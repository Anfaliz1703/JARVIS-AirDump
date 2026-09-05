# Límites de iOS/Safari

## Lo que la PWA sí puede hacer
- instalarse en pantalla de inicio;
- abrir el selector del sistema para elegir fotos/videos;
- recibir objetos `File` seleccionados por el usuario;
- leerlos progresivamente;
- utilizar WebRTC DataChannel;
- mostrar progreso y mantener estado mientras la página permanece activa.

## Lo que no debemos prometer
Una PWA no tiene acceso general y permanente a toda la fototeca de iOS como una app nativa con PhotoKit. Tampoco debe asumir que puede borrar automáticamente las fotos originales después del respaldo.

Por ello el flujo correcto es:

```text
Seleccionar → Transferir → Verificar en PC → Usuario elimina manualmente en Fotos si desea
```

## Segundo plano
Las transferencias grandes deben realizarse con la PWA visible. iOS puede suspender JavaScript/red cuando Safari/PWA queda en segundo plano o el dispositivo entra en determinados estados de ahorro.

La UX debe recordar:
- mantener la pantalla abierta;
- evitar cambiar de app durante vaciados grandes;
- conectar el iPhone a corriente cuando se transfieran bibliotecas grandes.

## iCloud Photos
Si el usuario usa Optimizar almacenamiento, algunos originales pueden no estar localmente disponibles de inmediato. El comportamiento final depende del selector y de cómo iOS materialice el archivo seleccionado.

No implementar lógica que asegure que se obtuvo un original completo sin verificar realmente el tamaño/contenido recibido.

## Evolución nativa opcional
Si el objetivo futuro pasa a ser:
- detectar automáticamente todo lo nuevo;
- examinar toda la biblioteca;
- excluir favoritos;
- gestionar Live Photos semánticamente;
- borrar elementos confirmados;

será conveniente añadir un cliente nativo iOS/PhotoKit conservando el protocolo y receptor existentes.
