# Ficha para addons.thunderbird.net (ATN) — C3 Email Rules

Datos para copiar y pegar en el Developer Hub. El paquete es `dist/c3-email-rules-0.2.0.xpi` (se genera con `npm run build`).

## Datos generales

- **Nombre:** C3 Email Rules
- **Add-on ID:** email-rules@cubo3.cl
- **Categorías sugeridas:** Message Filtering (o Mail / Spam)
- **Licencia:** MIT
- **Sitio web / código fuente:** https://github.com/cubo3/C3-ThunderbirdPlugin-EmailRules
- **Soporte (issues):** https://github.com/cubo3/C3-ThunderbirdPlugin-EmailRules/issues
- **Correo de soporte:** lg@cubo3.cl
- **Compatibilidad:** Thunderbird 128.0 o superior
- **Política de privacidad:** no requerida para add-ons que no recopilan datos; se puede indicar "No data collected" (el add-on declara `data_collection_permissions: none`).
- **Código fuente para revisores:** el add-on no usa minificación ni bundlers, así que se sube tal cual; basta indicar el repositorio.

## Resumen (máx. 250 caracteres)

**EN:** Block or whitelist senders and domains with a right click, and create Outlook-style folder rules. Free and open source.

**ES:** Bloquea o permite remitentes y dominios con clic derecho y crea reglas de carpeta al estilo Outlook. Gratuito y de código abierto.

## Descripción (EN)

C3 Email Rules brings the right-click junk management of Outlook Classic to Thunderbird.

Right-click any message and choose **Correo no deseado (C3)** (the add-on interface is currently in Spanish) to:
- Block sender / Block domain
- Whitelist sender / Whitelist domain
- Create a **folder rule**: always move mail from a sender or domain to a folder you choose (for example `example.com` → `INBOX/Example`)
- Mark as read automatically when a rule is applied

New mail is checked against your lists. Blocked senders are marked as junk and moved to Junk (or Trash, configurable). Whitelisted senders are unmarked and returned to the Inbox if they landed in Junk. "Apply rules to selection" sorts mail that is already in a folder.

Priority: allowed sender > blocked sender > allowed domain > blocked domain. An exact sender beats a domain rule, and the most specific domain wins.

Your lists can be edited in the add-on preferences and imported or exported as JSON.

**Privacy:** everything stays on your computer. The add-on does not connect to any server and collects no data.

**Known limitations:** rules run inside Thunderbird (only while it is open) and are not synced to the mail server. The `From` header is used, which can be forged.

Open source (MIT): https://github.com/cubo3/C3-ThunderbirdPlugin-EmailRules

## Descripción (ES)

C3 Email Rules trae a Thunderbird la gestión de correo no deseado con clic derecho de Outlook Classic.

Haz clic derecho en un mensaje y elige **Correo no deseado (C3)** para:
- Bloquear remitente / Bloquear dominio
- Whitelist de remitente / Whitelist de dominio
- Crear una **regla de carpeta**: mover siempre los correos de un remitente o dominio a la carpeta que elijas (por ejemplo `ejemplo.cl` → `INBOX/Ejemplo`)
- Marcar como leído automáticamente al aplicar una regla

Los correos nuevos se evalúan contra tus listas. Los remitentes bloqueados se marcan como basura y se mueven a Junk (o Papelera, configurable). Los de la whitelist se desmarcan y vuelven a la bandeja de entrada si estaban en Junk. "Aplicar reglas a la selección" ordena correos que ya están en una carpeta.

Prioridad: remitente permitido > remitente bloqueado > dominio permitido > dominio bloqueado. Un remitente exacto gana a una regla de dominio, y entre dominios gana el más específico.

Las listas se editan en las preferencias del add-on y se pueden importar y exportar en JSON.

**Privacidad:** todo queda en tu equipo. El add-on no se conecta a ningún servidor ni recopila datos.

**Limitaciones:** las reglas corren dentro de Thunderbird (solo con el programa abierto) y no se sincronizan con el servidor de correo. Se evalúa el encabezado `From`, que puede estar falsificado.

Código abierto (MIT): https://github.com/cubo3/C3-ThunderbirdPlugin-EmailRules

## Notas para los revisores (Notes to Reviewer)

C3 Email Rules is a plain MailExtension (MV2), no minification, no remote code, no network access. Source: https://github.com/cubo3/C3-ThunderbirdPlugin-EmailRules (the uploaded .xpi is built with `npm run build`, which only zips manifest.json, background.js, lib/, options/, icons/ and LICENSE).

Permission justification:
- `menus`: adds the "Junk (C3)" submenu to the message list context menu.
- `storage`: saves the user's block/allow lists, folder rules and settings in `storage.local`.
- `accountsRead`: lists accounts and folders to find Junk, Trash and Inbox, and to resolve the destination folder of a rule.
- `messagesRead`: reads the sender (`From`) of new and selected messages to match them against the rules.
- `messagesMove`: moves matching messages to Junk/Trash/Inbox or to the folder chosen in a rule.
- `messagesUpdate`: marks messages as junk / not junk and as read when a rule says so.

## Capturas de pantalla sugeridas (tomarlas en tu Thunderbird)

1. Clic derecho sobre un mensaje con el submenú "Correo no deseado (C3)" abierto.
2. Página de preferencias con las listas de bloqueados y whitelist.
3. Formulario de regla de carpeta (por ejemplo carrasco.cl → INBOX/Carrasco).
4. Opciones globales (marcar como leído, destino de bloqueados).

Formato recomendado: PNG, mínimo 600×400 px, sin datos personales ni correos reales visibles.
