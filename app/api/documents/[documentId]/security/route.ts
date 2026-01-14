import { NextRequest, NextResponse } from "next/server";
import { DocumentManager } from "@y-sweet/sdk";
import { sanitizeDocumentId } from "@/lib/colors";
import { hasDocumentAccess } from "@/lib/jwt";
import * as Y from "yjs";

const connectionString = process.env.CONNECTION_STRING || "ys://127.0.0.1:4001";
const fallbackConnectionString = "ys://127.0.0.1:4001";

interface SecurityStatus {
  isProtected: boolean;
  hasAccess: boolean;
}

/**
 * Tenta obter o documento do Y-Sweet, com fallback para localhost
 */
async function getDocUpdate(docId: string): Promise<Uint8Array | null> {
  // Y-Sweet adiciona prefixo "doc_" aos IDs
  const fullDocId = `doc_${docId}`;

  // Tentar com a connection string configurada
  try {
    const manager = new DocumentManager(connectionString);
    console.debug(
      `[Security] Tentando carregar documento: ${fullDocId} de ${connectionString}`
    );
    return await manager.getDocAsUpdate(fullDocId);
  } catch (error) {
    // Se falhar e o host for diferente de localhost, tentar localhost
    if (connectionString !== fallbackConnectionString) {
      console.debug(
        "[Security] Primary connection failed, trying fallback:",
        error instanceof Error ? error.message : error
      );
      try {
        const fallbackManager = new DocumentManager(fallbackConnectionString);
        console.debug(
          `[Security] Tentando fallback: ${fullDocId} de ${fallbackConnectionString}`
        );
        return await fallbackManager.getDocAsUpdate(fullDocId);
      } catch (fallbackError) {
        console.debug(
          "[Security] Fallback also failed:",
          fallbackError instanceof Error ? fallbackError.message : fallbackError
        );
      }
    }
    return null;
  }
}

/**
 * GET /api/documents/[documentId]/security
 * Retorna o status de segurança do documento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
): Promise<NextResponse<SecurityStatus | { error: string }>> {
  try {
    const { documentId } = await params;
    const sanitizedId = sanitizeDocumentId(decodeURIComponent(documentId));

    // Verificar se já tem acesso via JWT
    console.log(`[Security] Verificando acesso para documento: ${sanitizedId}`);
    const hasAccess = await hasDocumentAccess(sanitizedId);

    // Tentar ler os metadados de segurança do Y-Sweet
    let isProtected = false;

    try {
      const update = await getDocUpdate(sanitizedId);

      if (update && update.byteLength > 0) {
        // Decodificar o documento Yjs
        const ydoc = new Y.Doc();
        Y.applyUpdate(ydoc, update);

        // Ler o mapa de segurança
        const securityMap = ydoc.getMap("security");
        const protectedValue = securityMap.get("protected");
        const passwordHash = securityMap.get("passwordHash") as string | null;
        const hasPasswordHash = !!passwordHash;

        // A proteção é considerada ativa se há um hash de senha
        // (O campo "protected" pode ter problemas de sincronização, então usamos o hash como indicador)
        isProtected = hasPasswordHash;

        console.log(`[Security] Documento ${sanitizedId}:`, {
          isProtected,
          protectedValue, // Log do valor bruto
          protectedType: typeof protectedValue,
          hasPasswordHash,
          passwordHashLength: passwordHash ? passwordHash.length : 0,
          hasAccess,
          mapSize: securityMap.size,
          mapKeys: Array.from(securityMap.keys()),
        });

        ydoc.destroy();
      } else {
        console.warn(
          `[Security] Documento ${sanitizedId} não encontrado ou vazio. Update byteLength: ${update?.byteLength}`
        );
      }
    } catch (error) {
      // Se não conseguir ler, assume que não está protegido
      console.error(
        `[Security] Erro ao ler metadados de ${sanitizedId}:`,
        error
      );
      isProtected = false;
    }

    const finalResponse = {
      isProtected,
      hasAccess: hasAccess || !isProtected, // Se não está protegido, tem acesso
    };

    console.log(
      `[Security] Resposta final para ${sanitizedId}:`,
      finalResponse
    );

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error("Error checking security status:", error);
    return NextResponse.json(
      { error: "Failed to check security status" },
      { status: 500 }
    );
  }
}
