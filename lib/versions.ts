import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export interface DocumentVersion {
  id: string;
  documentId: string;
  subdocumentName?: string;
  timestamp: number;
  label?: string;
  size: number;
  createdBy?: string;
}

// Ensure versions directory exists for a document
function ensureVersionsDir(documentId: string): string {
  const versionsDir = path.join(DATA_DIR, documentId, "versions");
  if (!fs.existsSync(versionsDir)) {
    fs.mkdirSync(versionsDir, { recursive: true });
  }
  return versionsDir;
}

// Get all versions for a document/subdocument
export function getVersions(
  documentId: string,
  subdocumentName?: string
): DocumentVersion[] {
  const versionsDir = path.join(DATA_DIR, documentId, "versions");

  if (!fs.existsSync(versionsDir)) {
    return [];
  }

  const metadataFile = path.join(versionsDir, "metadata.json");
  if (!fs.existsSync(metadataFile)) {
    return [];
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf-8"));
    const versions = metadata.versions || [];

    // Filter by subdocument if specified
    if (subdocumentName !== undefined) {
      return versions.filter(
        (v: DocumentVersion) => v.subdocumentName === subdocumentName
      );
    }

    return versions;
  } catch {
    return [];
  }
}

// Save a new version
export function saveVersion(
  documentId: string,
  update: Uint8Array,
  options: {
    subdocumentName?: string;
    label?: string;
    createdBy?: string;
  } = {}
): DocumentVersion {
  const versionsDir = ensureVersionsDir(documentId);
  const timestamp = Date.now();
  const versionId = `${timestamp}-${Math.random().toString(36).substring(7)}`;

  // Save the binary update
  const versionFile = path.join(versionsDir, `${versionId}.yupdate`);
  fs.writeFileSync(versionFile, Buffer.from(update));

  // Create version metadata
  const version: DocumentVersion = {
    id: versionId,
    documentId,
    subdocumentName: options.subdocumentName,
    timestamp,
    label: options.label,
    size: update.length,
    createdBy: options.createdBy,
  };

  // Update metadata file
  const metadataFile = path.join(versionsDir, "metadata.json");
  let metadata: { versions: DocumentVersion[] } = { versions: [] };

  if (fs.existsSync(metadataFile)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metadataFile, "utf-8"));
    } catch {
      metadata = { versions: [] };
    }
  }

  metadata.versions.push(version);

  // Keep only last 50 versions per subdocument to save space
  const subdocVersions = metadata.versions.filter(
    (v) => v.subdocumentName === options.subdocumentName
  );
  if (subdocVersions.length > 50) {
    const oldestToRemove = subdocVersions
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, subdocVersions.length - 50);

    for (const old of oldestToRemove) {
      const oldFile = path.join(versionsDir, `${old.id}.yupdate`);
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
      }
      metadata.versions = metadata.versions.filter((v) => v.id !== old.id);
    }
  }

  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

  return version;
}

// Get a specific version's data
export function getVersionData(
  documentId: string,
  versionId: string
): Uint8Array | null {
  const versionsDir = path.join(DATA_DIR, documentId, "versions");
  const versionFile = path.join(versionsDir, `${versionId}.yupdate`);

  if (!fs.existsSync(versionFile)) {
    return null;
  }

  return new Uint8Array(fs.readFileSync(versionFile));
}

// Get version metadata
export function getVersionMetadata(
  documentId: string,
  versionId: string
): DocumentVersion | null {
  const versions = getVersions(documentId);
  return versions.find((v) => v.id === versionId) || null;
}

// Delete a version
export function deleteVersion(documentId: string, versionId: string): boolean {
  const versionsDir = path.join(DATA_DIR, documentId, "versions");
  const versionFile = path.join(versionsDir, `${versionId}.yupdate`);
  const metadataFile = path.join(versionsDir, "metadata.json");

  // Remove file
  if (fs.existsSync(versionFile)) {
    fs.unlinkSync(versionFile);
  }

  // Update metadata
  if (fs.existsSync(metadataFile)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf-8"));
      metadata.versions = metadata.versions.filter(
        (v: DocumentVersion) => v.id !== versionId
      );
      fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    } catch {
      return false;
    }
  }

  return true;
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
