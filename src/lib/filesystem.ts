export interface WritableFileLike {
  write(data: ArrayBuffer | ArrayBufferView | Blob | string): Promise<void>;
  close(): Promise<void>;
  abort?(reason?: unknown): Promise<void>;
}

export interface FileHandleLike {
  name: string;
  createWritable(options?: { keepExistingData?: boolean }): Promise<WritableFileLike>;
}

export interface DirectoryHandleLike {
  name: string;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandleLike>;
}

type WindowWithPicker = Window & {
  showDirectoryPicker?: () => Promise<DirectoryHandleLike>;
};

export function supportsDirectoryPicker(): boolean {
  return typeof (window as WindowWithPicker).showDirectoryPicker === 'function';
}

export async function pickDirectory(): Promise<DirectoryHandleLike> {
  const picker = (window as WindowWithPicker).showDirectoryPicker;
  if (!picker) throw new Error('Este navegador no permite elegir una carpeta de destino. Usa Chrome o Edge en Windows.');
  return picker();
}

function sanitizeFileName(name: string): string {
  const clean = name.replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').trim();
  return clean || `archivo-${Date.now()}`;
}

function addSuffix(name: string, suffix: number): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return `${name} (${suffix})`;
  return `${name.slice(0, dot)} (${suffix})${name.slice(dot)}`;
}

async function exists(directory: DirectoryHandleLike, name: string): Promise<boolean> {
  try {
    await directory.getFileHandle(name, { create: false });
    return true;
  } catch {
    return false;
  }
}

export async function createNonDestructiveFile(
  directory: DirectoryHandleLike,
  requestedName: string
): Promise<{ handle: FileHandleLike; savedName: string }> {
  const safeName = sanitizeFileName(requestedName);
  let candidate = safeName;
  let suffix = 1;

  while (await exists(directory, candidate)) {
    candidate = addSuffix(safeName, suffix++);
    if (suffix > 10_000) throw new Error('No fue posible generar un nombre de archivo único.');
  }

  const handle = await directory.getFileHandle(candidate, { create: true });
  return { handle, savedName: candidate };
}
