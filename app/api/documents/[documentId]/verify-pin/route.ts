import { NextRequest, NextResponse } from "next/server";
import { DocumentManager } from "@y-sweet/sdk";
import { sanitizeDocumentId } from "@/lib/colors";
import { setDocumentAuthCookie } from "@/lib/jwt";
import { hashPin, verifyPin } from "@/lib/crypto";
import * as Y from "yjs";

const connectionString = process.env.CONNECTION_STRING || "ys://127.0.0.1:4001";
const fallbackConnectionString = "ys://127.0.0.1:4001";

interface VerifyPinRequest {
  pin: string;
}

interface VerifyPinResponse {
  success: boolean;
  error?: string;
}

/**
 * Tenta obter o documento do Y-Sweet, com fallback para localhost
 */
async function getDocUpdate(docId: string): Promise<Uint8Array | null> {
  try {
    const manager = new DocumentManager(connectionString);
    return await manager.getDocAsUpdate(docId);
  } catch (error) {
    if (connectionString !== fallbackConnectionString) {
      console.debug("[VerifyPIN] Primary connection failed, trying fallback");
      try {
        const fallbackManager = new DocumentManager(fallbackConnectionString);
        return await fallbackManager.getDocAsUpdate(docId);
      } catch {
        // fallback also failed
      }
    }
    return null;
  }
}

/**
 * POST /api/documents/[documentId]/verify-pin
 * Verifica o PIN e gera JWT se correto
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
): Promise<NextResponse<VerifyPinResponse>> {
  try {
    const { documentId } = await params;
    const sanitizedId = sanitizeDocumentId(decodeURIComponent(documentId));

    // Ler o PIN do body
    const body: VerifyPinRequest = await request.json();
    const { pin } = body;

    if (!pin || typeof pin !== "string") {
      console.warn("[VerifyPIN] PIN inválido fornecido");
      return NextResponse.json(
        { success: false, error: "PIN é obrigatório" },
        { status: 400 }
      );
    }

    console.log(`[VerifyPIN] Verificando PIN para documento: ${sanitizedId}`);

    // Obter o hash do PIN armazenado no Y-Sweet
    let storedHash: string | null = null;

    try {
      const update = await getDocUpdate(sanitizedId);

      if (update && update.byteLength > 0) {
        const ydoc = new Y.Doc();
        Y.applyUpdate(ydoc, update);

        const securityMap = ydoc.getMap("security");
        const isProtected = securityMap.get("protected");
        storedHash = securityMap.get("passwordHash") as string | null;

        console.log(`[VerifyPIN] Mapa de segurança:`, {
          isProtected,
          hasPasswordHash: !!storedHash,
          passwordHashLength: storedHash ? storedHash.length : 0,
          mapSize: securityMap.size,
          mapKeys: Array.from(securityMap.keys()),
        });

        console.log(
          `[VerifyPIN] Hash armazenado encontrado: ${
            storedHash ? storedHash.substring(0, 20) + "..." : "null"
          }`
        );

        ydoc.destroy();
      } else {
        console.warn(
          `[VerifyPIN] Documento não encontrado no Y-Sweet. Update byteLength: ${update?.byteLength}`
        );
      }
    } catch (error) {
      console.error("[VerifyPIN] Erro ao ler dados de segurança:", error);
      return NextResponse.json(
        { success: false, error: "Erro ao verificar PIN" },
        { status: 500 }
      );
    }

    if (!storedHash) {
      // Documento não está protegido
      console.warn("[VerifyPIN] Documento não tem hash de proteção");
      return NextResponse.json(
        { success: false, error: "Documento não está protegido" },
        { status: 400 }
      );
    }

    // Verificar o PIN usando bcrypt
    console.log("[VerifyPIN] Comparando PIN com hash usando bcrypt");
    const isValid = await verifyPin(pin, storedHash);

    if (!isValid) {
      console.warn("[VerifyPIN] PIN incorreto fornecido");
      return NextResponse.json(
        { success: false, error: "PIN incorreto" },
        { status: 401 }
      );
    }

    // PIN correto! Gerar JWT e salvar em cookie
    console.log("[VerifyPIN] PIN verificado com sucesso! Gerando JWT");
    await setDocumentAuthCookie(sanitizedId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VerifyPIN] Erro interno:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
