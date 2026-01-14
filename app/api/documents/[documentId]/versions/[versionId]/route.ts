import { NextRequest, NextResponse } from "next/server";
import {
  getVersionData,
  getVersionMetadata,
  deleteVersion,
} from "@/lib/versions";

// GET - Get a specific version
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string; versionId: string }> }
) {
  const { documentId, versionId } = await params;
  const { searchParams } = new URL(request.url);
  const includeData = searchParams.get("includeData") === "true";

  try {
    const metadata = getVersionMetadata(documentId, versionId);

    if (!metadata) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (includeData) {
      const data = getVersionData(documentId, versionId);
      if (!data) {
        return NextResponse.json(
          { error: "Version data not found" },
          { status: 404 }
        );
      }

      // Return binary data with metadata in headers
      return new NextResponse(Buffer.from(data), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${versionId}.yupdate"`,
          "X-Version-Id": metadata.id,
          "X-Version-Timestamp": metadata.timestamp.toString(),
          "X-Version-Label": metadata.label || "",
          "X-Version-Size": metadata.size.toString(),
        },
      });
    }

    return NextResponse.json({ version: metadata });
  } catch (error) {
    console.error("Error fetching version:", error);
    return NextResponse.json(
      { error: "Failed to fetch version" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a version
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string; versionId: string }> }
) {
  const { documentId, versionId } = await params;

  try {
    const success = deleteVersion(documentId, versionId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete version" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting version:", error);
    return NextResponse.json(
      { error: "Failed to delete version" },
      { status: 500 }
    );
  }
}

// POST - Restore this version (returns the update data to be applied client-side)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string; versionId: string }> }
) {
  const { documentId, versionId } = await params;

  try {
    const data = getVersionData(documentId, versionId);

    if (!data) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Return the binary update that can be applied to restore
    return new NextResponse(Buffer.from(data), {
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Error restoring version:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    );
  }
}
