# Despliegue en Vercel

El frontend es una aplicación Vite estática y no requiere que las fotos pasen por Vercel.

## Flujo recomendado
1. Importar `Anfaliz1703/JARVIS-AirDump` en Vercel.
2. Framework preset: Vite (normalmente se detecta automáticamente).
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Node.js: 22 o superior.
6. Desplegar.

## Importante
Vercel entrega HTTPS, necesario para varias APIs web modernas y apropiado para instalar la PWA en iPhone.

El despliegue aloja HTML/CSS/JS y el service worker. Los archivos seleccionados deben continuar viajando por WebRTC entre iPhone y PC.

## Prueba mínima tras desplegar
- abrir URL en Chrome/Edge del PC;
- elegir receptor y carpeta;
- abrir la misma URL en Safari del iPhone;
- conectar con código;
- probar primero un archivo pequeño;
- luego una foto HEIC y un video;
- comprobar bytes/nombre en destino.
