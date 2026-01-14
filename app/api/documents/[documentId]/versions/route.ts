import { NextRequest, NextResponse } from "next/server";
import { getVersions, saveVersion, DocumentVersion } from "@/lib/versions";

// GET - List all versions for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const { searchParams } = new URL(request.url);
  const subdocumentName = searchParams.get("subdocument") || undefined;

  try {
    const versions = getVersions(documentId, subdocumentName);

    // Sort by timestamp descending (newest first)
    versions.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

// POST - Create a new version (snapshot)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  try {
    const formData = await request.formData();
    const updateBlob = formData.get("update") as Blob | null;
    const label = formData.get("label") as string | null;
    const subdocumentName = formData.get("subdocument") as string | null;
    const createdBy = formData.get("createdBy") as string | null;

    if (!updateBlob) {
      return NextResponse.json(
        { error: "Missing 'update' field with document state" },
        { status: 400 }
      );
    }

    const updateBuffer = await updateBlob.arrayBuffer();
    const update = new Uint8Array(updateBuffer);

    const version = saveVersion(documentId, update, {
      subdocumentName: subdocumentName || undefined,
      label: label || undefined,
      createdBy: createdBy || undefined,
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error("Error creating version:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}
