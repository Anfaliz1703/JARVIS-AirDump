import { useState } from 'react';
import { Home } from './features/Home';
import { Receiver } from './features/Receiver';
import { Sender } from './features/Sender';

export type AppMode = 'home' | 'sender' | 'receiver';

export default function App() {
  const [mode, setMode] = useState<AppMode>('home');

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="app-panel">
        <header className="brand-bar">
          <button className="brand" onClick={() => setMode('home')} aria-label="Volver al inicio">
            <span className="brand-orb" />
            <span>
              <strong>JARVIS</strong>
              <small>AIRDUMP</small>
            </span>
          </button>
          <span className="privacy-chip">P2P · SIN NUBE</span>
        </header>

        {mode === 'home' && <Home onSelect={setMode} />}
        {mode === 'sender' && <Sender onBack={() => setMode('home')} />}
        {mode === 'receiver' && <Receiver onBack={() => setMode('home')} />}
      </section>
    </main>
  );
}
