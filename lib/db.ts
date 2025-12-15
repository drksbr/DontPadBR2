import fs from "fs";
import path from "path";
import { Subdocument } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Get all documents data
function getAllDocumentsData(): Record<string, Subdocument[]> {
  ensureDataDir();
  if (!fs.existsSync(DOCUMENTS_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(DOCUMENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save all documents data
function saveAllDocumentsData(data: Record<string, Subdocument[]>) {
  ensureDataDir();
  fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(data, null, 2));
}

// Get subdocuments for a specific document
export function getSubdocuments(documentId: string): Subdocument[] {
  const data = getAllDocumentsData();
  return data[documentId] || [];
}

// Add a subdocument
export function addSubdocument(
  documentId: string,
  subdocument: Subdocument
): Subdocument {
  const data = getAllDocumentsData();
  if (!data[documentId]) {
    data[documentId] = [];
  }
  data[documentId].push(subdocument);
  saveAllDocumentsData(data);
  return subdocument;
}

// Delete a subdocument
export function deleteSubdocument(
  documentId: string,
  subdocId: string
): boolean {
  const data = getAllDocumentsData();
  if (!data[documentId]) {
    return false;
  }
  const initialLength = data[documentId].length;
  data[documentId] = data[documentId].filter((s) => s.id !== subdocId);
  const deleted = data[documentId].length < initialLength;
  if (deleted) {
    saveAllDocumentsData(data);
  }
  return deleted;
}

// Clear all subdocuments for a document
export function clearSubdocuments(documentId: string) {
  const data = getAllDocumentsData();
  delete data[documentId];
  saveAllDocumentsData(data);
}
