# Publicación en GitHub Pages

JARVIS AirDump está configurado para funcionar desde el subdirectorio del repositorio:

`https://anfaliz1703.github.io/JARVIS-AirDump/`

## Activación inicial

En GitHub abre:

1. `JARVIS-AirDump`
2. `Settings`
3. `Pages`
4. En **Build and deployment**, selecciona **GitHub Actions** como Source.

Esta selección normalmente solo se necesita una vez.

## Despliegue automático

El archivo `.github/workflows/deploy-pages.yml` se ejecuta con cada push a `main`.

El workflow:

1. instala Node 22;
2. instala dependencias;
3. ejecuta `npm run build`;
4. configura GitHub Pages;
5. sube `dist/` como artifact;
6. despliega el artifact al environment `github-pages`.

## Ruta base

Como el repositorio se llama `JARVIS-AirDump`, Vite usa:

`/JARVIS-AirDump/`

como `base`.

El manifest y el service worker utilizan el mismo scope. No cambiar estas rutas a `/` mientras el proyecto siga publicado como Project Page.

## Uso

### PC

Abrir en Chrome o Edge:

`https://anfaliz1703.github.io/JARVIS-AirDump/`

Elegir **Recibir**, seleccionar el directorio del PC o SSD y crear una sesión.

### iPhone

Abrir la misma URL en Safari.

Opcionalmente instalarla mediante:

**Compartir → Añadir a pantalla de inicio**.

Elegir **Enviar**, escribir el código del PC y seleccionar fotos/videos.

## Privacidad

GitHub Pages solo aloja los archivos estáticos de la PWA. No recibe las fotos y videos transferidos.

PeerJS participa inicialmente en la negociación de la conexión WebRTC. El contenido de los archivos viaja mediante la conexión WebRTC entre los dispositivos.

## Diagnóstico

Si la página muestra 404, confirmar que GitHub Pages esté configurado con Source = GitHub Actions.

Si la interfaz abre pero faltan iconos, manifest o service worker, confirmar que `vite.config.ts` mantenga `base = '/JARVIS-AirDump/'`.

Si PC e iPhone no conectan, revisar primero señalización/WebRTC y no la publicación de Pages: son capas diferentes.

## Cambio de nombre del repositorio

Si se renombra `JARVIS-AirDump`, también debe cambiarse el valor `base` de `vite.config.ts` y las rutas del manifest/service worker.
