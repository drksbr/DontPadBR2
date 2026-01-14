export interface DocumentFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
}

export interface Subdocument {
  id: string;
  name: string;
  createdAt: number;
  files?: DocumentFile[];
}

export interface DocumentMetadata {
  title: string;
  createdAt: number;
  updatedAt: number;
  files?: DocumentFile[];
  protected?: boolean;
  passwordHash?: string;
}
