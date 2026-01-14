import fs from "fs";
import path from "path";
import { Subdocument, DocumentFile } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = DATA_DIR;

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * NOTE: Subdocuments and metadata are now stored in Y-Sweet (CRDT synchronization)
 * These functions return empty arrays/defaults as they are maintained for backward compatibility
 * The actual metadata is managed through Y-Sweet's shared types (Y.Map for subdocuments)
 *
 * When a client connects to a document in Y-Sweet, the subdocuments map is automatically
 * synced from the server. The API endpoints use these functions as fallback/compatibility layer.
 */

// Get subdocuments for a specific document
// NOTE: In the Y-Sweet architecture, subdocuments are stored in a Y.Map 'subdocuments'
// This returns empty array as the real data comes from Y-Sweet
export function getSubdocuments(documentId: string): Subdocument[] {
  ensureDataDir();
  // Return empty array - real subdocuments come from Y-Sweet via client
  // Clients fetch subdocument list from the Y.Map through Y-Sweet websocket
  return [];
}

// Add a subdocument
// NOTE: With Y-Sweet, subdocuments are added to the Y.Map 'subdocuments' in the document
// This function is kept for backward compatibility with API
export function addSubdocument(
  documentId: string,
  subdocument: Subdocument
): Subdocument {
  ensureDataDir();
  // The actual addition happens in Y-Sweet via the client
  // This function returns the subdocument as acknowledgment
  return subdocument;
}

// Delete a subdocument
// NOTE: Deletion happens in Y-Sweet via the client (removing from Y.Map)
export function deleteSubdocument(
  documentId: string,
  subdocId: string
): boolean {
  // Prevent deletion of the special __root__ entry
  if (subdocId === "__root__") {
    return false;
  }
  // Deletion happens in Y-Sweet, return true as acknowledgment
  return true;
}

// Clear all subdocuments for a document
export function clearSubdocuments(documentId: string) {
  // Clearing happens in Y-Sweet via client
  // This is a no-op as the real clearing happens in the CRDT
}

// Get document/subdocument specific uploads directory
export function getDocumentUploadsDir(
  documentId: string,
  subdocumentId?: string
): string {
  ensureDataDir();
  const docDir = path.join(UPLOADS_DIR, documentId);
  if (!subdocumentId) {
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }
    return docDir;
  }
  const subDocDir = path.join(docDir, subdocumentId);
  if (!fs.existsSync(subDocDir)) {
    fs.mkdirSync(subDocDir, { recursive: true });
  }
  return subDocDir;
}

// Add file to document/subdocument
// NOTE: File metadata is now stored in Y-Sweet via Y.Array in the document
// This function returns the file metadata for the API response
export function addFileToDocument(
  documentId: string,
  file: DocumentFile,
  subdocumentId?: string
): DocumentFile {
  ensureDataDir();
  // Get the appropriate upload directory
  getDocumentUploadsDir(documentId, subdocumentId);
  // File metadata is stored in Y-Sweet (Y.Array 'files' for doc root, 'subdocuments[id].files' for subdocs)
  // This function returns the file object for the API response
  return file;
}

// Get files for document/subdocument
// NOTE: File metadata comes from Y-Sweet Y.Array
// This returns empty array - real files are synced via Y-Sweet
export function getDocumentFiles(
  documentId: string,
  subdocumentId?: string
): DocumentFile[] {
  // Real file metadata comes from Y-Sweet via the client
  // Return empty array as files are fetched through Y-Sweet connection
  return [];
}

// Delete file from document/subdocument
// NOTE: File deletion happens in Y-Sweet (removing from Y.Array)
export function deleteDocumentFile(
  documentId: string,
  fileId: string,
  subdocumentId?: string
): boolean {
  // File deletion happens in Y-Sweet via client
  // Return true as acknowledgment
  return true;
}
