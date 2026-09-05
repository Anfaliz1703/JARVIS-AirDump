export interface TransferFileMeta {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  lastModified: number;
}

export interface TransferProgress {
  fileId: string;
  fileName: string;
  fileBytes: number;
  fileSize: number;
  totalBytes: number;
  totalSize: number;
  completedFiles: number;
  totalFiles: number;
  bytesPerSecond: number;
}

export type ControlMessage =
  | { type: 'hello'; protocol: 1 }
  | { type: 'file-meta'; file: TransferFileMeta }
  | { type: 'file-ready'; id: string; savedName: string }
  | { type: 'file-end'; id: string }
  | { type: 'file-complete'; id: string; ok: boolean; bytesReceived: number; expectedBytes: number; savedName: string }
  | { type: 'transfer-complete'; files: number; bytes: number }
  | { type: 'error'; message: string; fileId?: string };

export function parseControlMessage(data: unknown): ControlMessage | null {
  if (typeof data !== 'string') return null;
  try {
    const parsed = JSON.parse(data) as { type?: unknown };
    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') return null;
    return parsed as ControlMessage;
  } catch {
    return null;
  }
}
