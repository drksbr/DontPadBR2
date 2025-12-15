const COLORS = [
  "#FF5C5C",
  "#FFB65C",
  "#88FF70",
  "#47F0FF",
  "#478EFF",
  "#745CFF",
  "#FF85FF",
];

export function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

/**
 * Sanitizes a document ID for use with Y-Sweet
 * Y-Sweet only accepts alphanumeric characters and hyphens
 */
export function sanitizeDocumentId(id: string): string {
  return id
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generates a deterministic unique ID for a subdocument
 * Combines documentId + subdocument name to ensure no conflicts
 */
export function generateSubdocumentId(
  documentId: string,
  subdocName: string
): string {
  // Create a simple hash from the combined string
  const combined = `${documentId}:${subdocName}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `subdoc-${Math.abs(hash).toString(36)}`;
}

/**
 * Generates a Yjs fragment key for a subdocument
 * Ensures complete isolation between documents and subdocuments
 */
export function generateSubdocumentFragmentKey(
  documentId: string,
  subdocName: string
): string {
  const sanitizedDocId = sanitizeDocumentId(decodeURIComponent(documentId));
  const sanitizedSubdocName = sanitizeDocumentId(
    decodeURIComponent(subdocName)
  );
  return `doc-${sanitizedDocId}:subdoc-${sanitizedSubdocName}`;
}
