# Roadmap

## v0.1 — MVP vertical
- [x] React + TypeScript + PWA.
- [x] Modo sender iPhone.
- [x] Modo receiver Windows.
- [x] Código de sesión.
- [x] WebRTC vía PeerJS.
- [x] Selección multiarchivo.
- [x] Chunks y backpressure básico.
- [x] Guardado directo mediante File System Access API.
- [x] Evitar sobrescritura por nombre.
- [x] Verificación de bytes/tamaño.
- [x] CI: typecheck + build.
- [ ] Prueba física iPhone 15 Pro ↔ Windows.

## v0.2 — Integridad
- [ ] SHA-256 incremental sender/receiver.
- [ ] Estado VERIFIED / CORRUPT.
- [ ] Retransmisión de archivo fallido.
- [ ] Mejor manejo de desconexión de SSD.

## v0.3 — Biblioteca inteligente
- [ ] IndexedDB manifest.
- [ ] Fingerprint rápido nombre+tamaño+lastModified.
- [ ] `Solo nuevos`.
- [ ] Historial de sesiones.
- [ ] Detección conservadora de duplicados.

## v0.4 — Resume
- [ ] Checkpoint por archivo.
- [ ] ACK periódico de offsets.
- [ ] Reanudar después de caída Wi-Fi.
- [ ] Persistencia de sesión.

## v0.5 — UX
- [ ] QR para emparejamiento.
- [ ] Wake Lock cuando esté disponible.
- [ ] ETA estable.
- [ ] Velocidad instantánea/media.
- [ ] Aviso de espacio libre insuficiente cuando la API lo permita.
- [ ] Organización año/mes/día.

## v0.6 — Robustez
- [ ] Tests automatizados de protocolo/chunking.
- [ ] Simulador de desconexión.
- [ ] Stress test 10 GB, 50 GB, 100 GB+.
- [ ] TURN configurable.
- [ ] Signaling propio sustituible.

## Futuro opcional
- cliente iOS nativo con PhotoKit;
- agente Windows nativo;
- NAS;
- transferencia directa USB-C/SSD;
- importación automática organizada.
