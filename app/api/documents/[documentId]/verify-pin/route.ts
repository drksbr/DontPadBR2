import { NextRequest, NextResponse } from "next/server";
import { DocumentManager } from "@y-sweet/sdk";
import { sanitizeDocumentId } from "@/lib/colors";
import { setDocumentAuthCookie } from "@/lib/jwt";
import { hashPin } from "@/lib/crypto";
import * as Y from "yjs";

const connectionString = process.env.CONNECTION_STRING || "ys://127.0.0.1:8080";
const fallbackConnectionString = "ys://127.0.0.1:8080";

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
      return NextResponse.json(
        { success: false, error: "PIN é obrigatório" },
        { status: 400 }
      );
    }

    // Obter o hash do PIN armazenado no Y-Sweet
    let storedHash: string | null = null;

    try {
      const update = await getDocUpdate(sanitizedId);

      if (update && update.byteLength > 0) {
        const ydoc = new Y.Doc();
        Y.applyUpdate(ydoc, update);

        const securityMap = ydoc.getMap("security");
        storedHash = securityMap.get("passwordHash") as string | null;

        ydoc.destroy();
      }
    } catch (error) {
      console.error("Error reading security data:", error);
      return NextResponse.json(
        { success: false, error: "Erro ao verificar PIN" },
        { status: 500 }
      );
    }

    if (!storedHash) {
      // Documento não está protegido
      return NextResponse.json(
        { success: false, error: "Documento não está protegido" },
        { status: 400 }
      );
    }

    // Verificar o PIN
    const enteredHash = await hashPin(pin);

    if (enteredHash !== storedHash) {
      return NextResponse.json(
        { success: false, error: "PIN incorreto" },
        { status: 401 }
      );
    }

    // PIN correto! Gerar JWT e salvar em cookie
    await setDocumentAuthCookie(sanitizedId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
