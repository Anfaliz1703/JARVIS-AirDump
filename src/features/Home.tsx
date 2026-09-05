import type { AppMode } from '../App';
import { supportsDirectoryPicker } from '../lib/filesystem';

interface Props {
  onSelect: (mode: AppMode) => void;
}

export function Home({ onSelect }: Props) {
  const canReceive = supportsDirectoryPicker();

  return (
    <div className="view home-view">
      <div className="hero-copy">
        <span className="eyebrow">TRANSFERENCIA LOCAL · PRIVADA · DIRECTA</span>
        <h1>Tus archivos.<br />Al instante, cerca.</h1>
        <p>
          Pasa fotos y videos desde tu iPhone directamente al PC o al SSD conectado al PC.
          Sin nube, sin recomprimir y sin cambiar el flujo de transferencia que ya probaste.
        </p>
      </div>

      <div className="mode-grid">
        <button className="mode-card primary-card" onClick={() => onSelect('sender')}>
          <span className="mode-icon">↑</span>
          <span className="mode-copy">
            <strong>Enviar desde iPhone</strong>
            <small>Selecciona tus fotos y videos y envíalos por Wi‑Fi</small>
          </span>
          <span className="arrow">›</span>
        </button>

        <button className="mode-card" onClick={() => onSelect('receiver')} disabled={!canReceive}>
          <span className="mode-icon">↓</span>
          <span className="mode-copy">
            <strong>Recibir en este PC</strong>
            <small>{canReceive ? 'Guarda directamente en una carpeta o SSD' : 'Requiere Chrome o Edge en Windows'}</small>
          </span>
          <span className="arrow">›</span>
        </button>
      </div>

      <div className="trust-row">
        <span><i /> WebRTC P2P</span>
        <span><i /> Sin nube</span>
        <span><i /> No sobrescribe archivos</span>
      </div>
    </div>
  );
}
