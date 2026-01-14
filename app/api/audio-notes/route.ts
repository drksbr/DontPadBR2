import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, readFile } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureAudioDir(documentId: string, subdocumentId?: string) {
  const audioDir = subdocumentId
    ? join(
        DATA_DIR,
        decodeURIComponent(documentId),
        "audio-notes",
        subdocumentId
      )
    : join(DATA_DIR, decodeURIComponent(documentId), "audio-notes");

  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  return audioDir;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as Blob;
    const duration = parseFloat(formData.get("duration") as string);
    const documentId = formData.get("documentId") as string;
    const subdocumentId = formData.get("subdocumentId") as string | null;

    console.log(
      "[Audio API] POST - documentId:",
      documentId,
      "subdocumentId:",
      subdocumentId
    );
    console.log(
      "[Audio API] Audio blob:",
      audio?.size,
      "bytes, duration:",
      duration
    );

    if (!audio || !documentId) {
      return NextResponse.json(
        { error: "Audio e documentId são obrigatórios" },
        { status: 400 }
      );
    }

    const noteId = randomUUID();
    const fileName = `${noteId}.webm`;
    const audioDir = ensureAudioDir(documentId, subdocumentId || undefined);
    const filePath = join(audioDir, fileName);

    console.log("[Audio API] Saving to:", filePath);

    // Save file
    const buffer = Buffer.from(await audio.arrayBuffer());
    await writeFile(filePath, buffer);

    console.log("[Audio API] File saved successfully, size:", buffer.length);

    const audioNote = {
      id: noteId,
      name: `Nota de Áudio ${new Date().toLocaleString("pt-BR")}`,
      duration: Math.round(duration * 10) / 10,
      mimeType: "audio/webm",
      size: buffer.length,
      createdAt: Date.now(),
    };

    console.log("[Audio API] Returning note:", audioNote);
    return NextResponse.json(audioNote);
  } catch (error) {
    console.error("[Audio API] Error saving audio:", error);
    return NextResponse.json(
      { error: "Falha ao salvar nota de áudio", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, noteId, subdocumentId } = body;

    if (!documentId || !noteId) {
      return NextResponse.json(
        { error: "documentId e noteId são obrigatórios" },
        { status: 400 }
      );
    }

    const audioDir = ensureAudioDir(documentId, subdocumentId);
    const filePath = join(audioDir, `${noteId}.webm`);

    // Delete file if exists
    try {
      await unlink(filePath);
    } catch (err) {
      // File might not exist, that's ok
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar nota de áudio:", error);
    return NextResponse.json(
      { error: "Falha ao deletar nota de áudio" },
      { status: 500 }
    );
  }
}
