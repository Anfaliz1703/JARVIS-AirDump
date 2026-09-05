import type { DataConnection } from 'peerjs';
import type { ControlMessage, TransferFileMeta } from '../types';
import { parseControlMessage } from '../types';
import { createNonDestructiveFile, type DirectoryHandleLike, type WritableFileLike } from './filesystem';

export interface ReceiverProgress {
  file: TransferFileMeta;
  savedName: string;
  receivedBytes: number;
  totalReceivedBytes: number;
  completedFiles: number;
}

type ReceiverOptions = {
  onProgress?: (progress: ReceiverProgress) => void;
  onFileComplete?: (file: TransferFileMeta, savedName: string) => void;
  onTransferComplete?: (files: number, bytes: number) => void;
  onError?: (error: Error) => void;
};

type CurrentFile = {
  meta: TransferFileMeta;
  savedName: string;
  writer: WritableFileLike;
  receivedBytes: number;
};

function toArrayBuffer(data: unknown): Promise<ArrayBuffer | null> {
  if (data instanceof ArrayBuffer) return Promise.resolve(data);
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return Promise.resolve(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer);
  }
  if (data instanceof Blob) return data.arrayBuffer();
  return Promise.resolve(null);
}

export function attachReceiver(
  connection: DataConnection,
  directory: DirectoryHandleLike,
  options: ReceiverOptions = {}
): () => void {
  let current: CurrentFile | null = null;
  let queue = Promise.resolve();
  let totalReceivedBytes = 0;
  let completedFiles = 0;

  const send = (message: ControlMessage) => connection.send(JSON.stringify(message));

  const handleControl = async (message: ControlMessage): Promise<void> => {
    if (message.type === 'file-meta') {
      if (current) throw new Error('Se recibió un archivo nuevo antes de cerrar el anterior.');
      const { handle, savedName } = await createNonDestructiveFile(directory, message.file.name);
      const writer = await handle.createWritable({ keepExistingData: false });
      current = { meta: message.file, savedName, writer, receivedBytes: 0 };
      send({ type: 'file-ready', id: message.file.id, savedName });
      return;
    }

    if (message.type === 'file-end') {
      if (!current || current.meta.id !== message.id) throw new Error('Fin de archivo fuera de secuencia.');
      const finished = current;
      current = null;
      await finished.writer.close();
      const ok = finished.receivedBytes === finished.meta.size;
      send({
        type: 'file-complete',
        id: finished.meta.id,
        ok,
        bytesReceived: finished.receivedBytes,
        expectedBytes: finished.meta.size,
        savedName: finished.savedName
      });

      if (ok) {
        completedFiles += 1;
        options.onFileComplete?.(finished.meta, finished.savedName);
      }
      return;
    }

    if (message.type === 'transfer-complete') {
      options.onTransferComplete?.(message.files, message.bytes);
    }
  };

  const handleData = (data: unknown) => {
    queue = queue
      .then(async () => {
        const control = parseControlMessage(data);
        if (control) {
          await handleControl(control);
          return;
        }

        if (!current) throw new Error('Se recibieron bytes sin un archivo activo.');
        const buffer = await toArrayBuffer(data);
        if (!buffer) throw new Error('Chunk binario no reconocido.');
        await current.writer.write(buffer);
        current.receivedBytes += buffer.byteLength;
        totalReceivedBytes += buffer.byteLength;

        options.onProgress?.({
          file: current.meta,
          savedName: current.savedName,
          receivedBytes: current.receivedBytes,
          totalReceivedBytes,
          completedFiles
        });
      })
      .catch(async (reason: unknown) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        if (current?.writer.abort) {
          try {
            await current.writer.abort(error);
          } catch {
            // El error original es más útil que un fallo secundario al abortar.
          }
        }
        current = null;
        options.onError?.(error);
        send({ type: 'error', message: error.message });
      });
  };

  connection.on('data', handleData);
  return () => connection.off('data', handleData);
}
