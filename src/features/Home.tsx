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
        <span className="eyebrow">TRANSFERENCIA LOCAL DE ALTA VELOCIDAD</span>
        <h1>Vacía tu iPhone.<br />Sin nube. Sin cables.</h1>
        <p>
          Selecciona tus fotos y videos en el iPhone y envíalos directamente al PC o al SSD conectado al PC.
          JARVIS AirDump no almacena tus archivos en servidores.
        </p>
      </div>

      <div className="mode-grid">
        <button className="mode-card primary-card" onClick={() => onSelect('sender')}>
          <span className="mode-icon">↑</span>
          <span className="mode-copy">
            <strong>Enviar desde iPhone</strong>
            <small>Seleccionar fotos y videos</small>
          </span>
          <span className="arrow">›</span>
        </button>

        <button className="mode-card" onClick={() => onSelect('receiver')} disabled={!canReceive}>
          <span className="mode-icon">↓</span>
          <span className="mode-copy">
            <strong>Recibir en este PC</strong>
            <small>{canReceive ? 'Guardar directamente en PC o SSD' : 'Requiere Chrome o Edge en Windows'}</small>
          </span>
          <span className="arrow">›</span>
        </button>
      </div>

      <div className="trust-row">
        <span><i /> P2P por WebRTC</span>
        <span><i /> Sin recomprimir</span>
        <span><i /> No sobrescribe archivos</span>
      </div>
    </div>
  );
}
