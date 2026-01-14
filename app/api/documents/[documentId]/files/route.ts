import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import {
  addFileToDocument,
  deleteDocumentFile,
  getDocumentUploadsDir,
} from "@/lib/db";
import { DocumentFile } from "@/lib/types";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed MIME types for upload
const ALLOWED_MIME_TYPES = [
  // Microsoft Office Documents
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx

  // LibreOffice / OpenDocument Formats
  "application/vnd.oasis.opendocument.text", // .odt
  "application/vnd.oasis.opendocument.spreadsheet", // .ods
  "application/vnd.oasis.opendocument.presentation", // .odp

  // PDF
  "application/pdf",

  // Text files
  "text/plain", // .txt
  "text/csv", // .csv
  "text/markdown", // .md

  // Images (all types)
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/x-icon",

  // Compressed files
  "application/zip", // .zip
  "application/x-zip-compressed", // .zip (alternate)
  "application/x-rar-compressed", // .rar
  "application/x-rar", // .rar (alternate)

  // Video files
  "video/mp4", // .mp4, .m4v
  "video/webm", // .webm
  "video/quicktime", // .mov
  "video/x-matroska", // .mkv
  "video/3gpp", // .3gp (mobile)
  "video/3gpp2", // .3g2 (mobile)
  "video/x-msvideo", // .avi
  "video/mpeg", // .mpeg, .mpg
];

const ALLOWED_EXTENSIONS = [
  // Microsoft Office
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  // LibreOffice
  "odt",
  "ods",
  "odp",
  // PDF
  "pdf",
  // Text
  "txt",
  "csv",
  "md",
  // Images
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "tiff",
  "tif",
  "ico",
  // Compressed files
  "zip",
  "rar",
  // Video files
  "mp4",
  "m4v",
  "webm",
  "mov",
  "mkv",
  "3gp",
  "3g2",
  "avi",
  "mpeg",
  "mpg",
];

function isFileAllowed(file: File, fileExtension: string): boolean {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return false;
  }

  // Check extension as backup (some files might have generic MIME types)
  const extension = fileExtension.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return false;
  }

  return true;
}

/**
 * GET /api/documents/[documentId]/files
 *
 * DEPRECATED: File metadata is now stored in Y-Sweet Y.Array.
 * This endpoint returns empty array - real files come from Y-Sweet connection.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  if (!documentId || documentId === "null") {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  // Return empty array - file metadata comes from Y-Sweet Y.Array
  return NextResponse.json([]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const subdocumentId = request.nextUrl.searchParams.get("subdocumentId");

  if (!documentId || documentId === "null") {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum limit of ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`,
        },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split(".").pop() || "";

    // Validate file type
    if (!isFileAllowed(file, fileExtension)) {
      return NextResponse.json(
        {
          error: "Tipo de arquivo não permitido. Confira os formatos aceitos.",
        },
        { status: 400 }
      );
    }

    const decodedDocumentId = decodeURIComponent(documentId);
    const fileId = randomUUID();
    const storageName = `${fileId}.${fileExtension}`;

    // Get the appropriate upload directory
    const uploadDir = getDocumentUploadsDir(
      decodedDocumentId,
      subdocumentId || undefined
    );
    const filePath = join(uploadDir, storageName);

    // Convert File to Buffer and write
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Create file metadata
    const fileMetadata: DocumentFile = {
      id: fileId,
      name: storageName,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: Date.now(),
    };

    // File metadata storage in Y-Sweet happens on client
    // This endpoint returns the metadata object for the response
    const savedFile = addFileToDocument(
      decodedDocumentId,
      fileMetadata,
      subdocumentId || undefined
    );

    return NextResponse.json(savedFile, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const fileId = request.nextUrl.searchParams.get("fileId");
  const subdocumentId = request.nextUrl.searchParams.get("subdocumentId");
  const fileName = request.nextUrl.searchParams.get("fileName");

  if (!documentId || documentId === "null" || !fileId) {
    return NextResponse.json(
      { error: "Invalid document ID or file ID" },
      { status: 400 }
    );
  }

  try {
    const decodedDocumentId = decodeURIComponent(documentId);

    // Delete physical file if fileName is provided
    if (fileName) {
      const uploadDir = getDocumentUploadsDir(
        decodedDocumentId,
        subdocumentId || undefined
      );
      const filePath = join(uploadDir, fileName);

      try {
        await unlink(filePath);
      } catch {
        // File might already be deleted, continue
        console.warn(`File not found at ${filePath}`);
      }
    }

    // Actual deletion from Y-Sweet Y.Array happens on client
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
