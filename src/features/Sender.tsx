import { useMemo, useRef, useState } from 'react';
import { Peer, type DataConnection } from 'peerjs';
import { formatBytes, formatPercent, formatSpeed } from '../lib/format';
import { normalizeSessionCode, peerIdFromCode } from '../lib/session';
import { sendFiles } from '../lib/transfer';
import type { TransferProgress } from '../types';

interface Props {
  onBack: () => void;
}

type SenderStatus = 'idle' | 'connecting' | 'connected' | 'sending' | 'done' | 'error';

export function Sender({ onBack }: Props) {
  const [sessionCode, setSessionCode] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<SenderStatus>('idle');
  const [message, setMessage] = useState('Introduce el código que aparece en el PC.');
  const [progress, setProgress] = useState<TransferProgress | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
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
        setMessage('PC conectado. Selecciona tus fotos y videos.');
      });

      connection.on('close', () => {
        if (status !== 'done') {
          setMessage('La conexión con el PC se cerró.');
        }
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
      setStatus(error.name === 'AbortError' ? 'connected' : 'error');
      setMessage(error.name === 'AbortError' ? 'Transferencia cancelada.' : error.message);
    }
  };

  const cancelTransfer = () => abortRef.current?.abort();

  return (
    <div className="view">
      <button className="back-button" onClick={onBack}>← Inicio</button>
      <span className="eyebrow">MODO EMISOR · IPHONE</span>
      <h2>Enviar biblioteca seleccionada</h2>
      <p className="status-line">{message}</p>

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
            {status === 'connecting' ? 'Conectando…' : 'Conectar'}
          </button>
        </div>
      </div>

      <div className={`stack-card ${status === 'idle' || status === 'connecting' ? 'muted-card' : ''}`}>
        <label className="file-picker">
          <span className="mode-icon">＋</span>
          <span>
            <strong>Seleccionar fotos y videos</strong>
            <small>Se abrirá el selector de iOS</small>
          </span>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            disabled={status === 'idle' || status === 'connecting' || status === 'sending'}
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
        </label>

        {files.length > 0 && (
          <div className="selection-summary">
            <span><strong>{files.length.toLocaleString()}</strong><small>archivos</small></span>
            <span><strong>{formatBytes(totalSize)}</strong><small>seleccionados</small></span>
          </div>
        )}
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

      <p className="fine-print">No cierres Safari ni bloquees el iPhone durante una transferencia grande. AirDump no borra nada de Fotos.</p>
    </div>
  );
}
