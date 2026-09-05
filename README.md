# JARVIS AirDump

PWA para transferir fotos y videos desde un iPhone hacia un PC Windows o SSD conectado al PC mediante WebRTC, sin subir los archivos a la nube.

## Estado

MVP v0.1 en construcción.

### Objetivo del MVP

1. Abrir la misma PWA en iPhone y PC.
2. En el PC elegir **Recibir** y seleccionar una carpeta destino o un SSD.
3. El PC genera un código corto de sesión.
4. En el iPhone elegir **Enviar**, introducir el código y seleccionar fotos/videos.
5. Los archivos viajan directamente por WebRTC DataChannel.
6. El PC escribe los archivos de forma incremental en la carpeta elegida.
7. El receptor confirma bytes recibidos antes de marcar el archivo como completado.

## Privacidad

- Los archivos multimedia no se suben a Vercel ni a un backend.
- PeerJS se utiliza inicialmente solo para signaling WebRTC.
- La transferencia de archivos es P2P entre los dispositivos.
- No hay analítica ni trackers.

## Stack

- React
- TypeScript
- Vite
- vite-plugin-pwa
- PeerJS / WebRTC DataChannel
- File System Access API en Windows/Chrome/Edge

## Desarrollo

```bash
npm install
npm run dev
```

Para probar entre dispositivos necesitas un origen seguro (HTTPS), salvo `localhost` en el equipo de desarrollo. El despliegue recomendado para el frontend es Vercel.

## Build

```bash
npm run build
npm run preview
```

## Compatibilidad objetivo

1. iPhone 15 Pro / Safari actual: modo emisor.
2. Windows 10/11 + Chrome: modo receptor.
3. Windows 10/11 + Edge: modo receptor.
4. iPad / Android: secundarios.

## Limitaciones conocidas del MVP

- iOS no permite que una PWA recorra o borre libremente toda la fototeca. El usuario debe seleccionar los archivos mediante el selector del sistema.
- Mantén la PWA abierta durante transferencias grandes; iOS puede suspender tareas web en segundo plano.
- La primera versión verifica tamaño/bytes recibidos. Hash SHA-256 incremental y reanudación por offsets están planificados para la siguiente fase.
- File System Access API no está disponible en Safari iOS; por eso el modo receptor está orientado a Chrome/Edge en Windows.

## Seguridad de borrado

JARVIS AirDump **no elimina fotos del iPhone**. Al finalizar solo informa qué elementos fueron transferidos correctamente para que el usuario decida qué borrar manualmente.

Consulta también `ARCHITECTURE.md`, `IOS_LIMITATIONS.md`, `ROADMAP.md` y `CODEX_MASTER_PROMPT.md`.
