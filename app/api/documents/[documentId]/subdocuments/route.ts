import { NextRequest, NextResponse } from "next/server";
import { addSubdocument, deleteSubdocument, getSubdocuments } from "@/lib/db";
import { Subdocument } from "@/lib/types";
import { generateSubdocumentId } from "@/lib/colors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  if (!documentId || documentId === "null") {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  try {
    const subdocuments = getSubdocuments(decodeURIComponent(documentId));
    return NextResponse.json(subdocuments);
  } catch (error) {
    console.error("Error fetching subdocuments:", error);
    return NextResponse.json(
      { error: "Failed to fetch subdocuments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  if (!documentId || documentId === "null") {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Subdocument name is required" },
        { status: 400 }
      );
    }

    const decodedDocumentId = decodeURIComponent(documentId);
    const trimmedName = name.trim();

    // Check if subdocument with this name already exists
    const existingSubdocs = getSubdocuments(decodedDocumentId);
    if (existingSubdocs.some((sub) => sub.name === trimmedName)) {
      return NextResponse.json(
        { error: "A subdocument with this name already exists" },
        { status: 409 }
      );
    }

    // Generate unique ID combining document and subdocument info
    const uniqueId = generateSubdocumentId(decodedDocumentId, trimmedName);

    const newSubdoc: Subdocument = {
      id: uniqueId,
      name: trimmedName,
      createdAt: Date.now(),
    };

    const subdocument = addSubdocument(decodedDocumentId, newSubdoc);
    return NextResponse.json(subdocument, { status: 201 });
  } catch (error) {
    console.error("Error creating subdocument:", error);
    return NextResponse.json(
      { error: "Failed to create subdocument" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const url = new URL(request.url);
  const subdocId = url.searchParams.get("id");

  if (!documentId || documentId === "null" || !subdocId) {
    return NextResponse.json(
      { error: "Invalid document ID or subdocument ID" },
      { status: 400 }
    );
  }

  try {
    const deleted = deleteSubdocument(decodeURIComponent(documentId), subdocId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Subdocument not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subdocument:", error);
    return NextResponse.json(
      { error: "Failed to delete subdocument" },
      { status: 500 }
    );
  }
}
