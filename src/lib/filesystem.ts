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
  removeEntry?(name: string, options?: { recursive?: boolean }): Promise<void>;
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

  // El selector se abre mediante un gesto explícito del usuario. Pedimos readwrite,
  // pero la verificación efectiva se hace de nuevo al pulsar «Activar receptor».
  return picker({
    mode: 'readwrite',
    id: 'jarvis-airdump-destination'
  });
}

/**
 * Debe llamarse directamente desde un clic del usuario (por ejemplo, «Activar receptor»).
 * Algunos navegadores mantienen el handle pero dejan el permiso de escritura en `prompt`.
 * Hacemos una solicitud explícita y una escritura mínima para asegurarnos de que la sesión
 * no empiece hasta que el directorio sea realmente escribible.
 */
export async function ensureDirectoryWritable(directory: DirectoryHandleLike): Promise<void> {
  let permission: PermissionStateLike = 'granted';

  if (directory.queryPermission) {
    permission = await directory.queryPermission({ mode: 'readwrite' });
  }

  if (permission !== 'granted') {
    if (!directory.requestPermission) {
      throw new Error('El navegador no permitió confirmar acceso de escritura. Vuelve a elegir la carpeta.');
    }

    permission = await directory.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      throw new Error('AirDump necesita permiso de escritura. Pulsa Permitir y vuelve a activar el receptor.');
    }
  }

  // Forzamos una operación de escritura durante el clic del usuario. Esto detecta permisos
  // perezosos antes de que el primer archivo llegue por WebRTC, cuando ya no hay user activation.
  const probeName = `.jarvis-airdump-write-test-${Date.now()}.tmp`;
  let probeCreated = false;

  try {
    const probe = await directory.getFileHandle(probeName, { create: true });
    probeCreated = true;
    const writer = await probe.createWritable({ keepExistingData: false });
    await writer.write('JARVIS AirDump write test');
    await writer.close();
  } catch (reason) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    throw new Error(`No fue posible habilitar escritura en «${directory.name}»: ${error.message}`);
  } finally {
    if (probeCreated && directory.removeEntry) {
      try {
        await directory.removeEntry(probeName);
      } catch {
        // El archivo temporal es inocuo; no bloqueamos la sesión si solo falla la limpieza.
      }
    }
  }
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
