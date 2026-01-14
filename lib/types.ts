export interface DocumentFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
}

export interface AudioNote {
  id: string;
  name: string;
  duration: number; // in seconds
  mimeType: string;
  size: number;
  createdAt: number;
}

export interface Subdocument {
  id: string;
  name: string;
  createdAt: number;
  files?: DocumentFile[];
  audioNotes?: AudioNote[];
}

export interface DocumentMetadata {
  title: string;
  createdAt: number;
  updatedAt: number;
  files?: DocumentFile[];
  audioNotes?: AudioNote[];
  protected?: boolean;
  passwordHash?: string;
}
