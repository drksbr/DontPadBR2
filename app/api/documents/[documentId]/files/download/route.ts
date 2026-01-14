import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getDocumentUploadsDir } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const fileId = request.nextUrl.searchParams.get("fileId");
  const fileName = request.nextUrl.searchParams.get("fileName");
  const originalName = request.nextUrl.searchParams.get("originalName");
  const mimeType = request.nextUrl.searchParams.get("mimeType");
  const size = request.nextUrl.searchParams.get("size");
  const subdocumentId = request.nextUrl.searchParams.get("subdocumentId");

  if (!documentId || documentId === "null" || !fileId || !fileName) {
    return NextResponse.json(
      { error: "Invalid document ID, file ID, or file name" },
      { status: 400 }
    );
  }

  try {
    const decodedDocumentId = decodeURIComponent(documentId);

    // Read the file from disk
    const uploadDir = getDocumentUploadsDir(
      decodedDocumentId,
      subdocumentId || undefined
    );
    const filePath = join(uploadDir, fileName);
    const fileContent = await readFile(filePath);

    // Return file with appropriate headers
    const response = new NextResponse(fileContent);
    response.headers.set(
      "Content-Type",
      mimeType || "application/octet-stream"
    );
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${originalName || fileName}"`
    );
    if (size) {
      response.headers.set("Content-Length", size);
    }

    return response;
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
