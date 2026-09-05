# Prompt maestro para Codex — JARVIS AirDump

Trabaja como ingeniero senior sobre este repositorio existente. Antes de modificar código, lee `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `IOS_LIMITATIONS.md`, `SECURITY.md` y `ROADMAP.md`.

## Objetivo
JARVIS AirDump debe permitir mover rápidamente fotos y videos seleccionados desde un iPhone 15 Pro hacia un PC Windows o SSD conectado al PC mediante una PWA. El contenido debe viajar P2P por WebRTC y nunca almacenarse en Vercel.

## Reglas
- No reescribas el proyecto desde cero si no es imprescindible.
- Conserva React + TypeScript + Vite salvo justificación técnica fuerte.
- Mantén módulos pequeños y responsabilidades claras.
- No uses `file.arrayBuffer()` para archivos grandes completos.
- Mantén streaming/chunking y backpressure.
- No sobrescribas archivos existentes.
- No implementes borrado automático de Fotos en iOS.
- No inventes capacidades de Safari.
- No añadas analítica ni trackers.
- Si cambias el protocolo, actualiza `ARCHITECTURE.md`.
- Cada entrega debe terminar con `npm run typecheck` y `npm run build` exitosos.

## Prioridad inmediata
La siguiente iteración debe centrarse primero en pruebas reales del flujo actual y luego en integridad SHA-256 incremental.

### Criterio de éxito de la próxima iteración
1. PC abre modo receptor y selecciona SSD/carpeta.
2. Genera código.
3. iPhone introduce código y conecta.
4. iPhone selecciona varios archivos, incluyendo al menos un video grande.
5. Se transfieren sin cargar el archivo completo en RAM.
6. El receptor escribe incrementalmente.
7. Ningún archivo existente es sobrescrito.
8. Al finalizar, sender y receiver muestran estados coherentes.
9. Añadir hash incremental y marcar archivo como verificado solo cuando hash y tamaño coinciden.
10. Build y typecheck verdes.

## Después
Implementa por fases, no todo simultáneamente:
- manifest IndexedDB y `solo nuevos`;
- resume por offsets;
- QR;
- organización por fecha;
- stress tests;
- signaling propio opcional.

Cuando encuentres una limitación de navegador, documéntala y ofrece degradación elegante. No maquilles una limitación con una interfaz que prometa algo que realmente no ocurre.
