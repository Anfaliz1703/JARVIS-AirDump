# Arquitectura — JARVIS AirDump

## Flujo principal

```text
iPhone 15 Pro / Safari PWA
        |
        | selección manual de Fotos
        v
    File objects
        |
        | chunks 64 KiB
        v
WebRTC DataChannel  <--- PeerJS signaling --->  PeerJS service
        |
        | tráfico multimedia P2P
        v
Windows Chrome / Edge PWA
        |
        | File System Access API
        v
Carpeta local / SSD externo
```

## Signaling vs transferencia
PeerJS se usa para localizar pares y negociar WebRTC. El contenido multimedia se envía por el DataChannel entre los navegadores. El diseño debe permitir reemplazar PeerJS por un `SignalingProvider` propio en una fase futura.

## Protocolo actual
Mensajes de control JSON:
- `hello`
- `file-meta`
- `file-ready`
- `file-end`
- `file-complete`
- `transfer-complete`
- `error`

Los chunks de archivo se envían como `ArrayBuffer`. La conexión WebRTC es ordenada y cada archivo se procesa de forma serial en el MVP.

## Sender
`sendFiles()`:
1. anuncia metadata;
2. espera `file-ready`;
3. lee `File.stream()`;
4. divide cada bloque en chunks de máximo 64 KiB;
5. aplica backpressure según `bufferedAmount`;
6. envía `file-end`;
7. espera confirmación de bytes del receptor.

## Receiver
`attachReceiver()`:
1. recibe metadata;
2. genera un nombre seguro que no sobrescriba archivos;
3. abre `FileSystemWritableFileStream` equivalente;
4. serializa escrituras mediante una cola Promise;
5. cierra el archivo al recibir `file-end`;
6. compara `receivedBytes === expectedSize`;
7. responde `file-complete`.

## Riesgos conocidos
- Safari puede suspender la PWA si pasa a segundo plano.
- WebRTC puede requerir TURN en algunas topologías de red.
- PeerJS público no debe considerarse infraestructura final de producción crítica.
- Verificar solo tamaño no detecta todas las corrupciones; añadir hash incremental es prioridad alta.
- Un SSD desconectado durante escritura debe producir error recuperable, no falso positivo.

## Próxima evolución técnica
Separar interfaces:
- `Transport`
- `SignalingProvider`
- `HashService`
- `ManifestStore`
- `ResumeManager`
- `DestinationWriter`

Eso permitirá conservar la UX aunque más adelante se sustituya PeerJS, se añada un agente Windows o se cree cliente nativo iOS.
