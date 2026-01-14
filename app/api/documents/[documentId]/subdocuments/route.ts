import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/documents/[documentId]/subdocuments
 *
 * DEPRECATED: Subdocuments are now managed entirely through Y-Sweet.
 * The Y.Map 'subdocuments' in the document contains all subdocument metadata.
 *
 * This endpoint is kept for backward compatibility but returns empty array.
 * Clients should fetch subdocuments directly from Y-Sweet connection.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  if (!documentId || documentId === "null") {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  // Return empty array - real subdocuments come from Y-Sweet Y.Map
  return NextResponse.json([]);
}

/**
 * POST /api/documents/[documentId]/subdocuments
 *
 * DEPRECATED: Subdocument creation is now handled entirely through Y-Sweet.
 * Clients should add to the Y.Map 'subdocuments' directly via Y-Sweet connection.
 *
 * This endpoint is kept for backward compatibility.
 */
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

    const trimmedName = name.trim();

    // Sanitize name for use as Y.Map key
    const sanitizedName = trimmedName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!sanitizedName) {
      return NextResponse.json(
        { error: "Subdocument name contains invalid characters" },
        { status: 400 }
      );
    }

    const newSubdoc = {
      id: sanitizedName,
      name: trimmedName,
      createdAt: Date.now(),
    };

    // Return the subdoc object - actual storage in Y-Sweet happens on client
    return NextResponse.json(newSubdoc, { status: 201 });
  } catch (error) {
    console.error("Error creating subdocument:", error);
    return NextResponse.json(
      { error: "Failed to create subdocument" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[documentId]/subdocuments
 *
 * DEPRECATED: Deletion is now handled entirely through Y-Sweet.
 * Clients should remove from the Y.Map 'subdocuments' via Y-Sweet connection.
 */
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

  // Return success - actual deletion in Y-Sweet happens on client
  return NextResponse.json({ success: true });
}
