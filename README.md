# C3 Email Rules: bloquear remitentes y filtrar correo no deseado en Thunderbird

**C3 Email Rules** es un add-on gratuito y de código abierto para **Thunderbird** que permite **bloquear remitentes y dominios** y crear una **whitelist** (lista de remitentes seguros) con un clic derecho, para controlar el **correo no deseado (spam)** en cuentas IMAP y cPanel.

Gestión de correo no deseado con clic derecho, al estilo Outlook Classic:

- Bloquear remitente / Bloquear dominio
- Whitelist remitente / Whitelist dominio
- **Reglas de carpeta** (como las reglas de Outlook): mover siempre los correos de un remitente o dominio a una carpeta, por ejemplo `carrasco.cl` → `INBOX/Carrasco`
- **Marcar como leído** al procesar una regla: por regla de carpeta, y como opción global para bloqueados y whitelist

Los correos nuevos se evalúan contra las listas: los bloqueados se marcan como basura y se mueven a Junk (o Papelera, configurable); los de la whitelist se desmarcan y vuelven a la bandeja de entrada si estaban en Junk.

**Reglas de carpeta:** se crean en las opciones o desde el clic derecho (*Regla de carpeta para este dominio/remitente…*, que abre las opciones con el formulario ya relleno). Un remitente exacto gana a un dominio, y entre dominios gana el más específico. Con *Aplicar reglas a la selección* se ordenan correos que ya están en la bandeja.

**Prioridad:** remitente permitido > remitente bloqueado > dominio permitido > dominio bloqueado.

## Instalación para pruebas
1. Thunderbird > Herramientas > Complementos y temas.
2. Engranaje > *Depurar complementos* > *Cargar complemento temporal…*
3. Seleccionar `manifest.json` de esta carpeta.
4. Clic derecho sobre un mensaje en la lista > **Correo no deseado (C3)**.

Opciones: Complementos > C3 Email Rules > Preferencias (editar listas, importar/exportar JSON).

## Empaquetar y publicar
- `npm run build` genera `dist/c3-email-rules-<versión>.xpi` (solo los archivos del add-on).
- `npm run lint` construye y valida con `web-ext` (las advertencias de APIs/permisos de Thunderbird son esperadas: `web-ext` valida contra Firefox).
- Para publicar: subir el `.xpi` en https://addons.thunderbird.net (Developer Hub). Textos de la ficha y justificación de permisos en [`docs/ATN-listing.md`](docs/ATN-listing.md). Cada versión nueva debe subir `version` en `manifest.json`.

## Tests
`npm test` (Node, solo lógica de reglas en `lib/rules.js`).

## Limitaciones conocidas
- Las reglas viven en el add-on, no en los filtros nativos de Thunderbird; solo corren con Thunderbird abierto.
- Se evalúa el encabezado `From`, que puede estar falsificado.
- Fase 3 (opcional): sincronizar con filtros de cPanel vía UAPI para bloquear en el servidor.

## Licencia

[MIT](LICENSE) © 2026 Cubo3 Ltda.

---

Desarrollado orgullosamente en Chile 🇨🇱 por [**Cubo3**](https://cubo3.cl), ingeniería de internet: desarrollo web a medida, gestión documental y GPS.
