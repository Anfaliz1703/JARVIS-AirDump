# Seguridad y privacidad

## Modelo de privacidad
JARVIS AirDump está diseñado para que fotos y videos viajen por WebRTC entre dispositivos, no mediante almacenamiento cloud de la aplicación.

## Datos que no deben enviarse a analítica
- contenido de archivos;
- miniaturas;
- EXIF;
- ubicación GPS;
- nombres de archivos completos;
- hashes de contenido salvo necesidad técnica y almacenamiento local explícito.

## Signaling
El signaling conoce identificadores de sesión y datos necesarios para WebRTC, pero no debe almacenar archivos multimedia.

## Destino
La carpeta destino solo se selecciona mediante interacción explícita del usuario. El código no debe intentar descubrir rutas de Windows o unidades sin permiso.

## No sobrescritura
La aplicación genera nombres alternativos cuando ya existe un archivo. Nunca truncar silenciosamente un archivo existente.

## Integridad
MVP: comparación de bytes recibidos frente al tamaño esperado.

Objetivo siguiente: SHA-256 incremental en emisor y receptor, con estado `VERIFIED` solo después de coincidencia.

## Eliminación
La PWA no elimina archivos originales del iPhone. El borrado queda bajo control manual del usuario.

## Dependencias
Revisar alertas de dependencias y mantener CI activo. No introducir SDK de analítica, trackers o almacenamiento remoto sin una decisión explícita de arquitectura.
