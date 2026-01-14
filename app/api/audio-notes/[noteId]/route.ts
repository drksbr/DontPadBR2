import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const documentId = request.headers.get("X-Document-Id");
    const subdocumentId = request.headers.get("X-Subdocument-Id");

    console.log("[Audio GET] noteId:", noteId);
    console.log("[Audio GET] documentId:", documentId);
    console.log("[Audio GET] subdocumentId:", subdocumentId);

    if (!documentId || !noteId) {
      console.error("[Audio GET] Missing documentId or noteId");
      return NextResponse.json(
        { error: "documentId e noteId são obrigatórios" },
        { status: 400 }
      );
    }

    const audioDir = subdocumentId
      ? join(
          DATA_DIR,
          decodeURIComponent(documentId),
          "audio-notes",
          subdocumentId
        )
      : join(DATA_DIR, decodeURIComponent(documentId), "audio-notes");

    const filePath = join(audioDir, `${noteId}.webm`);

    console.log("[Audio GET] Looking for file at:", filePath);
    console.log("[Audio GET] File exists:", fs.existsSync(filePath));

    if (!fs.existsSync(filePath)) {
      console.error("[Audio GET] File not found:", filePath);
      return NextResponse.json(
        { error: "Nota de áudio não encontrada" },
        { status: 404 }
      );
    }

    const audioBuffer = await readFile(filePath);
    console.log(
      "[Audio GET] File read successfully, size:",
      audioBuffer.length
    );

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/webm",
        "Content-Disposition": `attachment; filename="audio-${noteId}.webm"`,
      },
    });
  } catch (error) {
    console.error("[Audio GET] Error:", error);
    return NextResponse.json(
      { error: "Falha ao recuperar nota de áudio" },
      { status: 500 }
    );
  }
}
