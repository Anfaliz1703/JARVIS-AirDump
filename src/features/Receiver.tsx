import { useEffect, useRef, useState } from 'react';
import { Peer, type DataConnection } from 'peerjs';
import { pickDirectory, supportsDirectoryPicker, type DirectoryHandleLike } from '../lib/filesystem';
import { formatBytes, formatPercent } from '../lib/format';
import { attachReceiver, type ReceiverProgress } from '../lib/receiver';
import { generateSessionCode, peerIdFromCode } from '../lib/session';

interface Props {
  onBack: () => void;
}

type ReceiverStatus = 'idle' | 'waiting' | 'connected' | 'receiving' | 'done' | 'error';

export function Receiver({ onBack }: Props) {
  const [directory, setDirectory] = useState<DirectoryHandleLike | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [status, setStatus] = useState<ReceiverStatus>('idle');
  const [message, setMessage] = useState('Selecciona la carpeta del PC o del SSD donde quieres guardar los archivos.');
  const [progress, setProgress] = useState<ReceiverProgress | null>(null);
  const [completedNames, setCompletedNames] = useState<string[]>([]);
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const detachReceiverRef = useRef<(() => void) | null>(null);

  useEffect(() => () => {
    detachReceiverRef.current?.();
    connectionRef.current?.close();
    peerRef.current?.destroy();
  }, []);

  const selectDirectory = async () => {
    try {
      const handle = await pickDirectory();
      setDirectory(handle);
      setMessage(`Destino listo: ${handle.name}`);
    } catch (reason) {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      if (error.name !== 'AbortError') {
        setStatus('error');
        setMessage(error.message);
      }
    }
  };

  const activateReceiver = () => {
    if (!directory) return;
    peerRef.current?.destroy();
    const code = generateSessionCode();
    const peer = new Peer(peerIdFromCode(code));
    peerRef.current = peer;
    setSessionCode(code);
    setStatus('waiting');
    setMessage('Receptor activo. Introduce este código en el iPhone.');

    peer.on('open', () => setStatus('waiting'));

    peer.on('connection', (connection) => {
      if (connectionRef.current?.open) {
        connection.close();
        return;
      }

      connectionRef.current = connection;
      connection.on('open', () => {
        setStatus('connected');
        setMessage('iPhone conectado. Esperando selección e inicio de transferencia.');
        detachReceiverRef.current = attachReceiver(connection, directory, {
          onProgress: (next) => {
            setProgress(next);
            setStatus('receiving');
            setMessage(`Recibiendo ${next.savedName}`);
          },
          onFileComplete: (_file, savedName) => {
            setCompletedNames((current) => [savedName, ...current].slice(0, 5));
          },
          onTransferComplete: (files, bytes) => {
            setStatus('done');
            setMessage(`${files.toLocaleString()} archivos recibidos · ${formatBytes(bytes)}.`);
          },
          onError: (error) => {
            setStatus('error');
            setMessage(error.message);
          }
        });
      });

      connection.on('close', () => {
        if (status !== 'done') setMessage('El iPhone se desconectó. Puedes volver a activar una sesión.');
      });
    });

    peer.on('error', (error) => {
      setStatus('error');
      setMessage(error.type === 'unavailable-id' ? 'El código colisionó con otra sesión. Pulsa activar de nuevo.' : error.message);
    });
  };

  const copyCode = async () => {
    if (sessionCode) await navigator.clipboard?.writeText(sessionCode);
  };

  const filePercent = progress ? formatPercent(progress.receivedBytes, progress.file.size) : 0;

  if (!supportsDirectoryPicker()) {
    return (
      <div className="view">
        <button className="back-button" onClick={onBack}>← Inicio</button>
        <span className="eyebrow">MODO RECEPTOR</span>
        <h2>Navegador no compatible</h2>
        <p className="status-line">Abre JARVIS AirDump en Chrome o Edge desde Windows para guardar directamente en una carpeta o SSD.</p>
      </div>
    );
  }

  return (
    <div className="view">
      <button className="back-button" onClick={onBack}>← Inicio</button>
      <span className="eyebrow">MODO RECEPTOR · WINDOWS</span>
      <h2>Recibir en PC o SSD</h2>
      <p className="status-line">{message}</p>

      <div className="stack-card destination-card">
        <div>
          <small>DESTINO</small>
          <strong>{directory?.name ?? 'Ninguna carpeta seleccionada'}</strong>
        </div>
        <button className="secondary-button" onClick={selectDirectory} disabled={status === 'receiving'}>
          Elegir carpeta
        </button>
      </div>

      <button className="action-button wide" onClick={activateReceiver} disabled={!directory || status === 'receiving'}>
        {status === 'waiting' ? 'Generar otro código' : 'Activar receptor'}
      </button>

      {sessionCode && (
        <button className="session-code-card" onClick={copyCode} title="Copiar código">
          <small>CÓDIGO DE SESIÓN</small>
          <strong>{sessionCode}</strong>
          <span>{status === 'waiting' ? 'Esperando iPhone…' : 'Sesión enlazada'}</span>
        </button>
      )}

      {progress && (
        <div className="transfer-card">
          <div className="transfer-heading">
            <span>{status === 'done' ? 'RECIBIDO' : 'ARCHIVO ACTUAL'}</span>
            <strong>{filePercent}%</strong>
          </div>
          <div className="progress-track"><div style={{ width: `${filePercent}%` }} /></div>
          <div className="current-file">{progress.savedName}</div>
          <div className="metric-grid">
            <span><strong>{formatBytes(progress.receivedBytes)}</strong><small>de {formatBytes(progress.file.size)}</small></span>
            <span><strong>{formatBytes(progress.totalReceivedBytes)}</strong><small>sesión</small></span>
            <span><strong>{progress.completedFiles}</strong><small>verificados</small></span>
          </div>
        </div>
      )}

      {completedNames.length > 0 && (
        <div className="completed-list">
          <small>ÚLTIMOS ARCHIVOS COMPLETADOS</small>
          {completedNames.map((name) => <span key={name}>✓ {name}</span>)}
        </div>
      )}

      <p className="fine-print">Si el destino ya contiene un archivo con el mismo nombre, AirDump crea una copia numerada en lugar de sobrescribirlo.</p>
    </div>
  );
}
