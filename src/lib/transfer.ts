import type { DataConnection } from 'peerjs';
import type { ControlMessage, TransferFileMeta, TransferProgress } from '../types';
import { parseControlMessage } from '../types';

const CHUNK_SIZE = 64 * 1024;
const MAX_BUFFERED_BYTES = 4 * 1024 * 1024;
const CONTROL_TIMEOUT_MS = 30_000;

type ProgressCallback = (progress: TransferProgress) => void;

type SendFilesOptions = {
  onProgress?: ProgressCallback;
  signal?: AbortSignal;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForBackpressure(connection: DataConnection): Promise<void> {
  const channel = connection.dataChannel;
  while (channel && channel.bufferedAmount > MAX_BUFFERED_BYTES) {
    await delay(20);
  }
}

function waitForControl(
  connection: DataConnection,
  predicate: (message: ControlMessage) => boolean,
  timeoutMs = CONTROL_TIMEOUT_MS
): Promise<ControlMessage> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      connection.off('data', handler);
      reject(new Error('El otro dispositivo no respondió a tiempo.'));
    }, timeoutMs);

    const handler = (data: unknown) => {
      const message = parseControlMessage(data);
      if (!message || !predicate(message)) return;
      window.clearTimeout(timer);
      connection.off('data', handler);
      resolve(message);
    };

    connection.on('data', handler);
  });
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Transferencia cancelada', 'AbortError');
}

function fileMeta(file: File): TransferFileMeta {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    lastModified: file.lastModified
  };
}

export async function sendFiles(
  connection: DataConnection,
  files: File[],
  options: SendFilesOptions = {}
): Promise<void> {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  let totalBytes = 0;
  let completedFiles = 0;
  const startedAt = performance.now();

  connection.send(JSON.stringify({ type: 'hello', protocol: 1 } satisfies ControlMessage));

  for (const file of files) {
    assertNotAborted(options.signal);
    const meta = fileMeta(file);
    const readyPromise = waitForControl(
      connection,
      (message) => message.type === 'file-ready' && message.id === meta.id
    );

    connection.send(JSON.stringify({ type: 'file-meta', file: meta } satisfies ControlMessage));
    await readyPromise;

    const reader = file.stream().getReader();
    let fileBytes = 0;

    try {
      while (true) {
        assertNotAborted(options.signal);
        const { done, value } = await reader.read();
        if (done) break;

        for (let offset = 0; offset < value.byteLength; offset += CHUNK_SIZE) {
          assertNotAborted(options.signal);
          const end = Math.min(offset + CHUNK_SIZE, value.byteLength);
          const chunk = value.slice(offset, end);
          await waitForBackpressure(connection);
          connection.send(chunk.buffer);

          fileBytes += chunk.byteLength;
          totalBytes += chunk.byteLength;
          const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001);

          options.onProgress?.({
            fileId: meta.id,
            fileName: file.name,
            fileBytes,
            fileSize: file.size,
            totalBytes,
            totalSize,
            completedFiles,
            totalFiles: files.length,
            bytesPerSecond: totalBytes / elapsedSeconds
          });
        }
      }
    } finally {
      reader.releaseLock();
    }

    const completePromise = waitForControl(
      connection,
      (message) => message.type === 'file-complete' && message.id === meta.id,
      120_000
    );
    connection.send(JSON.stringify({ type: 'file-end', id: meta.id } satisfies ControlMessage));
    const complete = await completePromise;

    if (complete.type !== 'file-complete' || !complete.ok) {
      throw new Error(`La verificación de tamaño falló para ${file.name}.`);
    }

    completedFiles += 1;
    options.onProgress?.({
      fileId: meta.id,
      fileName: file.name,
      fileBytes: file.size,
      fileSize: file.size,
      totalBytes,
      totalSize,
      completedFiles,
      totalFiles: files.length,
      bytesPerSecond: totalBytes / Math.max((performance.now() - startedAt) / 1000, 0.001)
    });
  }

  connection.send(
    JSON.stringify({ type: 'transfer-complete', files: files.length, bytes: totalBytes } satisfies ControlMessage)
  );
}
