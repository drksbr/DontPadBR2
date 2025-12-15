// Professional color palette for collaborators
// Each color has light and dark variants for proper contrast
const COLLABORATOR_COLORS = [
  { light: "#2563eb", dark: "#60a5fa" }, // Blue
  { light: "#059669", dark: "#34d399" }, // Emerald
  { light: "#7c3aed", dark: "#a78bfa" }, // Violet
  { light: "#db2777", dark: "#f472b6" }, // Pink
  { light: "#ea580c", dark: "#fb923c" }, // Orange
  { light: "#0891b2", dark: "#22d3ee" }, // Cyan
  { light: "#4f46e5", dark: "#818cf8" }, // Indigo
  { light: "#be123c", dark: "#fb7185" }, // Rose
  { light: "#0d9488", dark: "#2dd4bf" }, // Teal
  { light: "#9333ea", dark: "#c084fc" }, // Purple
];

// Legacy colors for backward compatibility
const COLORS = COLLABORATOR_COLORS.map((c) => c.light);

export function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

/**
 * Gets a random collaborator color appropriate for the current theme
 * @param isDarkMode - Whether the app is in dark mode
 * @returns A hex color string
 */
export function getCollaboratorColor(isDarkMode: boolean = false): string {
  const colorPair =
    COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
  return isDarkMode ? colorPair.dark : colorPair.light;
}

/**
 * Gets a deterministic collaborator color based on a seed (like user ID)
 * @param seed - A string to use as seed for consistent color assignment
 * @param isDarkMode - Whether the app is in dark mode
 * @returns A hex color string
 */
export function getCollaboratorColorFromSeed(
  seed: string,
  isDarkMode: boolean = false
): string {
  // Simple hash function for deterministic color selection
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  const colorPair = COLLABORATOR_COLORS[index];
  return isDarkMode ? colorPair.dark : colorPair.light;
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
