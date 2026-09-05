import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Peer, type DataConnection } from 'peerjs';
import { formatBytes, formatPercent, formatSpeed } from '../lib/format';
import { normalizeSessionCode, peerIdFromCode } from '../lib/session';
import { sendFiles } from '../lib/transfer';
import type { TransferProgress } from '../types';

interface Props {
  onBack: () => void;
}

type SenderStatus = 'idle' | 'connecting' | 'connected' | 'sending' | 'done' | 'error';
type MediaKind = 'photo' | 'video';

function fileIdentity(file: File): string {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}\u0000${file.type}`;
}

function mergeUniqueFiles(current: File[], incoming: File[]): File[] {
  const seen = new Set(current.map(fileIdentity));
  const merged = [...current];

  for (const file of incoming) {
    const key = fileIdentity(file);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(file);
  }

  return merged;
}

function isVideo(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  return /\.(mov|mp4|m4v|avi|mkv|hevc)$/i.test(file.name);
}

export function Sender({ onBack }: Props) {
  const [sessionCode, setSessionCode] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<SenderStatus>('idle');
  const [message, setMessage] = useState('Selecciona fotos o videos primero. Puedes agregarlos en varias tandas.');
  const [progress, setProgress] = useState<TransferProgress | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const videoCount = useMemo(() => files.filter(isVideo).length, [files]);
  const photoCount = files.length - videoCount;
  const overallPercent = progress ? formatPercent(progress.totalBytes, progress.totalSize) : 0;

  const connect = () => {
    const code = normalizeSessionCode(sessionCode);
    if (code.length < 4) {
      setStatus('error');
      setMessage('Código de sesión incompleto.');
      return;
    }

    connectionRef.current?.close();
    peerRef.current?.destroy();
    setStatus('connecting');
    setMessage('Buscando el PC receptor…');

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      const connection = peer.connect(peerIdFromCode(code), { reliable: true });
      connectionRef.current = connection;

      connection.on('open', () => {
        setStatus('connected');
        setMessage(
          files.length > 0
            ? `PC conectado. ${files.length.toLocaleString()} archivos listos para transferir.`
            : 'PC conectado. Selecciona tus fotos o videos.'
        );
      });

      connection.on('close', () => {
        connectionRef.current = null;
        setStatus((current) => (current === 'done' ? current : 'idle'));
        setMessage(
          files.length > 0
            ? 'La conexión con el PC se cerró, pero tu selección sigue lista. Pulsa Conectar de nuevo.'
            : 'La conexión con el PC se cerró.'
        );
      });

      connection.on('error', (error) => {
        setStatus('error');
        setMessage(error.message || 'Error de conexión con el PC.');
      });
    });

    peer.on('error', (error) => {
      setStatus('error');
      setMessage(error.message || 'No fue posible iniciar WebRTC.');
    });
  };

  const handleFileSelection = (kind: MediaKind) => (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selected = Array.from(input.files ?? []);

    // Permite volver a abrir el selector y agregar más lotes. Limpiamos el input
    // para que iOS dispare onChange incluso si se vuelve a elegir el mismo elemento.
    input.value = '';

    if (selected.length === 0) {
      setMessage(
        kind === 'video'
          ? 'iOS no entregó videos en esta selección. Prueba con un solo video corto para diagnosticar.'
          : 'iOS no entregó fotos en esta selección. Prueba un lote más pequeño.'
      );
      return;
    }

    const nextFiles = mergeUniqueFiles(files, selected);
    const added = nextFiles.length - files.length;
    const skipped = selected.length - added;

    setFiles(nextFiles);
    setProgress(null);

    if (status === 'done') {
      setStatus(connectionRef.current?.open ? 'connected' : 'idle');
    }

    const connectionIsOpen = Boolean(connectionRef.current?.open);
    const skippedText = skipped > 0 ? ` · ${skipped} repetidos omitidos` : '';
    const mediaLabel = kind === 'video' ? 'videos' : 'fotos';

    setMessage(
      connectionIsOpen
        ? `${added} ${mediaLabel} agregados · ${nextFiles.length.toLocaleString()} archivos listos${skippedText}.`
        : `${added} ${mediaLabel} agregados · ${nextFiles.length.toLocaleString()} archivos listos${skippedText}. Conecta al PC cuando termines.`
    );
  };

  const clearSelection = () => {
    setFiles([]);
    setProgress(null);
    setMessage(
      connectionRef.current?.open
        ? 'Selección vacía. El PC sigue conectado; selecciona fotos o videos.'
        : 'Selección vacía. Selecciona fotos o videos primero.'
    );
  };

  const startTransfer = async () => {
    const connection = connectionRef.current;
    if (!connection?.open || files.length === 0) return;

    abortRef.current = new AbortController();
    setStatus('sending');
    setMessage('Transferencia en curso. Mantén esta pantalla abierta.');

    try {
      await sendFiles(connection, files, {
        signal: abortRef.current.signal,
        onProgress: setProgress
      });
      setStatus('done');
      setMessage('Transferencia completada y tamaño verificado por el PC. Ya puedes revisar el destino.');
    } catch (reason) {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      const stillConnected = Boolean(connectionRef.current?.open);
      setStatus(error.name === 'AbortError' && stillConnected ? 'connected' : 'error');
      setMessage(
        error.name === 'AbortError'
          ? 'Transferencia cancelada. La selección permanece disponible.'
          : `${error.message} La selección permanece disponible para reintentar.`
      );
    }
  };

  const cancelTransfer = () => abortRef.current?.abort();

  return (
    <div className="view">
      <button className="back-button" onClick={onBack}>← Inicio</button>
      <span className="eyebrow">MODO EMISOR · IPHONE</span>
      <h2>Enviar biblioteca seleccionada</h2>
      <p className="status-line">{message}</p>

      <div className={`stack-card ${status === 'connecting' || status === 'sending' ? 'muted-card' : ''}`}>
        <label className="file-picker">
          <span className="mode-icon">＋</span>
          <span>
            <strong>{photoCount > 0 ? 'Agregar más fotos' : 'Seleccionar fotos'}</strong>
            <small>HEIC, JPEG, PNG y demás imágenes disponibles en iOS</small>
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={status === 'connecting' || status === 'sending'}
            onChange={handleFileSelection('photo')}
          />
        </label>

        <label className="file-picker">
          <span className="mode-icon">▶</span>
          <span>
            <strong>{videoCount > 0 ? 'Agregar más videos' : 'Seleccionar videos'}</strong>
            <small>Prueba primero con 1 video; luego agrega lotes pequeños</small>
          </span>
          <input
            type="file"
            accept="video/*"
            multiple
            disabled={status === 'connecting' || status === 'sending'}
            onChange={handleFileSelection('video')}
          />
        </label>

        {files.length > 0 && (
          <>
            <div className="selection-summary">
              <span><strong>{files.length.toLocaleString()}</strong><small>archivos acumulados</small></span>
              <span><strong>{formatBytes(totalSize)}</strong><small>seleccionados</small></span>
            </div>
            <div className="selection-summary">
              <span><strong>{photoCount.toLocaleString()}</strong><small>fotos</small></span>
              <span><strong>{videoCount.toLocaleString()}</strong><small>videos</small></span>
            </div>
            <button className="secondary-button" onClick={clearSelection} disabled={status === 'sending'}>
              Limpiar selección
            </button>
          </>
        )}
      </div>

      <div className="stack-card">
        <label className="field-label" htmlFor="session-code">Código del PC</label>
        <div className="connect-row">
          <input
            id="session-code"
            className="session-input"
            value={sessionCode}
            onChange={(event) => setSessionCode(normalizeSessionCode(event.target.value))}
            placeholder="ABC123"
            autoCapitalize="characters"
            autoCorrect="off"
            disabled={status === 'connecting' || status === 'sending'}
          />
          <button className="action-button" onClick={connect} disabled={status === 'connecting' || status === 'sending'}>
            {status === 'connecting' ? 'Conectando…' : status === 'connected' ? 'Reconectar' : 'Conectar'}
          </button>
        </div>
      </div>

      {(status === 'sending' || status === 'done') && progress && (
        <div className="transfer-card">
          <div className="transfer-heading">
            <span>{status === 'done' ? 'TRANSFERENCIA COMPLETADA' : 'TRANSFIRIENDO'}</span>
            <strong>{overallPercent}%</strong>
          </div>
          <div className="progress-track"><div style={{ width: `${overallPercent}%` }} /></div>
          <div className="current-file">{progress.fileName}</div>
          <div className="metric-grid">
            <span><strong>{formatBytes(progress.totalBytes)}</strong><small>de {formatBytes(progress.totalSize)}</small></span>
            <span><strong>{formatSpeed(progress.bytesPerSecond)}</strong><small>velocidad media</small></span>
            <span><strong>{progress.completedFiles}/{progress.totalFiles}</strong><small>completados</small></span>
          </div>
        </div>
      )}

      <div className="action-row">
        {status === 'sending' ? (
          <button className="danger-button" onClick={cancelTransfer}>Cancelar</button>
        ) : (
          <button
            className="action-button wide"
            disabled={status !== 'connected' || files.length === 0}
            onClick={startTransfer}
          >
            Transferir {files.length ? formatBytes(totalSize) : ''}
          </button>
        )}
      </div>

      <p className="fine-print">
        En iPhone, los videos pueden tardar más en quedar disponibles si Fotos necesita descargar o preparar el original. Selecciona primero 1 video corto para validar. Luego arma la cola en lotes y conecta al PC al final. No cierres Safari ni bloquees el iPhone durante la transferencia.
      </p>
    </div>
  );
}
