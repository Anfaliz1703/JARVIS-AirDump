export interface WritableFileLike {
  write(data: ArrayBuffer | ArrayBufferView | Blob | string): Promise<void>;
  close(): Promise<void>;
  abort?(reason?: unknown): Promise<void>;
}

export interface FileHandleLike {
  name: string;
  createWritable(options?: { keepExistingData?: boolean }): Promise<WritableFileLike>;
}

type PermissionMode = 'read' | 'readwrite';
type PermissionStateLike = 'granted' | 'denied' | 'prompt';

export interface DirectoryHandleLike {
  name: string;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandleLike>;
  queryPermission?(descriptor?: { mode?: PermissionMode }): Promise<PermissionStateLike>;
  requestPermission?(descriptor?: { mode?: PermissionMode }): Promise<PermissionStateLike>;
}

type WindowWithPicker = Window & {
  showDirectoryPicker?: (options?: {
    mode?: PermissionMode;
    id?: string;
  }) => Promise<DirectoryHandleLike>;
};

export function supportsDirectoryPicker(): boolean {
  return typeof (window as WindowWithPicker).showDirectoryPicker === 'function';
}

export async function pickDirectory(): Promise<DirectoryHandleLike> {
  const picker = (window as WindowWithPicker).showDirectoryPicker;
  if (!picker) throw new Error('Este navegador no permite elegir una carpeta de destino. Usa Chrome o Edge en Windows.');

  // Pedimos escritura en el mismo gesto del usuario. Si se deja el modo por defecto
  // (solo lectura), Chrome intentará solicitar escritura más tarde al recibir el archivo
  // por WebRTC y fallará porque ya no existe una activación directa del usuario.
  const handle = await picker({
    mode: 'readwrite',
    id: 'jarvis-airdump-destination'
  });

  if (handle.queryPermission) {
    let permission = await handle.queryPermission({ mode: 'readwrite' });

    if (permission !== 'granted' && handle.requestPermission) {
      permission = await handle.requestPermission({ mode: 'readwrite' });
    }

    if (permission !== 'granted') {
      throw new Error('AirDump necesita permiso de escritura en la carpeta seleccionada. Vuelve a elegirla y pulsa Permitir.');
    }
  }

  return handle;
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
