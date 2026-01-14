import { NextRequest, NextResponse } from "next/server";
import { DocumentManager } from "@y-sweet/sdk";
import { sanitizeDocumentId } from "@/lib/colors";
import { hasDocumentAccess } from "@/lib/jwt";
import * as Y from "yjs";

const connectionString = process.env.CONNECTION_STRING || "ys://127.0.0.1:8080";
const fallbackConnectionString = "ys://127.0.0.1:8080";

interface SecurityStatus {
  isProtected: boolean;
  hasAccess: boolean;
}

/**
 * Tenta obter o documento do Y-Sweet, com fallback para localhost
 */
async function getDocUpdate(docId: string): Promise<Uint8Array | null> {
  // Tentar com a connection string configurada
  try {
    const manager = new DocumentManager(connectionString);
    return await manager.getDocAsUpdate(docId);
  } catch (error) {
    // Se falhar e o host for diferente de localhost, tentar localhost
    if (connectionString !== fallbackConnectionString) {
      console.debug(
        "[Security] Primary connection failed, trying fallback:",
        error instanceof Error ? error.message : error
      );
      try {
        const fallbackManager = new DocumentManager(fallbackConnectionString);
        return await fallbackManager.getDocAsUpdate(docId);
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
        isProtected = securityMap.get("protected") === true;

        // Debug log
        console.debug("[Security API] Document:", sanitizedId, {
          isProtected,
          hasPasswordHash: !!securityMap.get("passwordHash"),
          mapSize: securityMap.size,
        });

        ydoc.destroy();
      }
    } catch (error) {
      // Se não conseguir ler, assume que não está protegido
      console.debug("Could not read security metadata:", error);
      isProtected = false;
    }

    return NextResponse.json({
      isProtected,
      hasAccess: hasAccess || !isProtected, // Se não está protegido, tem acesso
    });
  } catch (error) {
    console.error("Error checking security status:", error);
    return NextResponse.json(
      { error: "Failed to check security status" },
      { status: 500 }
    );
  }
}
