# AGENTS.md — JARVIS AirDump

## Mission
Construir una PWA privada, rápida y confiable para mover fotos y videos desde iPhone hacia PC/SSD usando WebRTC P2P.

## Principios no negociables
1. Los archivos multimedia no deben pasar por Vercel ni por almacenamiento cloud.
2. El signaling puede usar infraestructura externa, pero solo para negociar WebRTC.
3. No cargar archivos grandes completos en RAM.
4. Transferir en chunks con backpressure.
5. Nunca sobrescribir silenciosamente un archivo existente.
6. Nunca eliminar fotos del iPhone desde la PWA.
7. No afirmar capacidades que Safari/iOS no posea.
8. Antes de marcar un archivo como correcto, verificar al menos tamaño; SHA-256 incremental es prioridad de la siguiente fase.
9. Mantener sender y receiver desacoplados de PeerJS para poder sustituir signaling más adelante.
10. Cada cambio debe pasar `npm run typecheck` y `npm run build`.

## Arquitectura actual
- React + TypeScript + Vite.
- PWA mediante vite-plugin-pwa.
- PeerJS para signaling y DataConnection WebRTC.
- iPhone/Safari: sender.
- Windows/Chrome o Edge: receiver.
- File System Access API para elegir una carpeta/SSD y escribir de forma incremental.
- Chunks actuales: 64 KiB.
- Backpressure: espera cuando RTCDataChannel.bufferedAmount supera 4 MiB.

## Archivos clave
- `src/lib/transfer.ts`: envío por chunks y control de flujo.
- `src/lib/receiver.ts`: recepción y escritura secuencial.
- `src/lib/filesystem.ts`: File System Access API y política de no sobrescritura.
- `src/lib/session.ts`: códigos de sesión/Peer IDs.
- `src/types.ts`: protocolo de control.
- `src/features/Sender.tsx`: UX iPhone.
- `src/features/Receiver.tsx`: UX Windows.

## Orden recomendado de trabajo
1. Probar MVP real iPhone ↔ Windows.
2. Corregir interoperabilidad antes de añadir features.
3. Añadir hash incremental SHA-256.
4. Añadir manifest/IndexedDB y detección de ya respaldados.
5. Añadir resume por offsets/checkpoints.
6. QR y mejoras UX.
7. Stress tests 10–100+ GB.

## Criterio de aceptación para cada iteración
- TypeScript estricto sin errores.
- Build de producción exitoso.
- No regresión en transferencia de un archivo grande.
- No sobrescritura de archivos existentes.
- Mensajes de error entendibles por usuario no técnico.
- Mantener documentación actualizada si cambia arquitectura o protocolo.
