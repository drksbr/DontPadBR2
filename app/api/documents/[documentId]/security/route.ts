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
    console.log(
      `[Security] Tentando carregar documento: ${fullDocId} de ${connectionString}`
    );
    const update = await manager.getDocAsUpdate(fullDocId);
    console.log(`[Security] Documento carregado com sucesso, bytes: ${update?.byteLength}`);
    return update;
  } catch (error) {
    console.log(
      `[Security] Erro ao carregar de ${connectionString}:`,
      error instanceof Error ? error.message : String(error)
    );
    
    // Se falhar e o host for diferente de localhost, tentar localhost
    if (connectionString !== fallbackConnectionString) {
      console.log(
        `[Security] Tentando fallback: ${fullDocId} de ${fallbackConnectionString}`
      );
      try {
        const fallbackManager = new DocumentManager(fallbackConnectionString);
        const update = await fallbackManager.getDocAsUpdate(fullDocId);
        console.log(`[Security] Documento carregado do fallback, bytes: ${update?.byteLength}`);
        return update;
      } catch (fallbackError) {
        console.log(
          "[Security] Fallback also failed:",
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
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

      console.log(`[Security] Update recebido:`, {
        existe: !!update,
        byteLength: update?.byteLength,
        tipo: update ? "Uint8Array" : "null",
      });

      if (update && update.byteLength > 0) {
        // Decodificar o documento Yjs
        const ydoc = new Y.Doc();
        Y.applyUpdate(ydoc, update);

        // Ler o mapa de segurança
        const securityMap = ydoc.getMap("security");

        const mapKeys = Array.from(securityMap.keys());
        console.log(`[Security] securityMap.keys():`, mapKeys);
        console.log(`[Security] securityMap.size:`, securityMap.size);

        // Log cada chave e valor individualmente
        mapKeys.forEach((key) => {
          const value = securityMap.get(key);
          console.log(`[Security] securityMap['${key}']:`, {
            value,
            tipo: typeof value,
            isString: typeof value === "string",
            comprimento: typeof value === "string" ? value.length : undefined,
          });
        });

        const protectedValue = securityMap.get("protected");
        const passwordHash = securityMap.get("passwordHash") as string | null;
        const hasPasswordHash = !!passwordHash;

        // A proteção é considerada ativa se há um hash de senha
        isProtected = hasPasswordHash;

        console.log(`[Security] Documento ${sanitizedId}:`, {
          isProtected,
          protectedValue,
          protectedType: typeof protectedValue,
          hasPasswordHash,
          passwordHashLength: passwordHash ? passwordHash.length : 0,
          hasAccess,
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

    // Lógica correcta:
    // - isProtected = true se tem PIN (passwordHash existe)
    // - hasAccess = true APENAS se tem JWT válido OU documento não está protegido
    let finalHasAccess = false;
    if (!isProtected) {
      // Documento não protegido - acesso livre
      finalHasAccess = true;
    } else if (hasAccess) {
      // Documento protegido E tem JWT válido
      finalHasAccess = true;
    } else {
      // Documento protegido e sem JWT - sem acesso (vai pedir PIN)
      finalHasAccess = false;
    }

    const finalResponse = {
      isProtected,
      hasAccess: finalHasAccess,
    };

    console.log(
      `[Security] Resposta final para ${sanitizedId}:`,
      finalResponse,
      `(isProtected=${isProtected}, hasJWT=${hasAccess})`
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
