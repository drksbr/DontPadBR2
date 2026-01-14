import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const decodedDocId = decodeURIComponent(documentId);

    // Delete all files associated with this document
    const DATA_DIR = path.join(process.cwd(), "data");
    const docDir = path.join(DATA_DIR, decodedDocId);

    if (fs.existsSync(docDir)) {
      fs.rmSync(docDir, { recursive: true, force: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
