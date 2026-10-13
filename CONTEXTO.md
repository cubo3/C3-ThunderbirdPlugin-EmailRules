# Contexto del proyecto: C3 Email Rules

- **Objetivo:** gestionar correo basura con clic derecho como Outlook Classic (bloquear/whitelist de remitente y dominio).
- **Stack:** MailExtensions de Thunderbird (JS/HTML, no Java). `menus`, `storage.local`, `messages.onNewMailReceived`, `messages.update/move`.
- **Contexto:** correos en cPanel (Dovecot/IMAP); pruebas en Thunderbird 157.0.1 (PC de Luis). `strict_min_version` 128.0 (ESR).
- **Fases:** (1) MVP local; (2) importar/exportar, deshacer, subdominios, contador; (3) opcional: sincronizar con filtros de cPanel vía UAPI.
- **v0.2.0:** reglas de carpeta por remitente/dominio (`moveRules`) y opción "marcar como leído" (por regla de carpeta y global para bloqueados/whitelist). Los bloqueos tienen prioridad sobre las reglas de carpeta; la whitelist se combina con ellas en un solo movimiento.
- **Repo:** https://github.com/cubo3/C3-ThunderbirdPlugin-EmailRules (público, MIT).
- **Freedcamp:** proyecto "C3-Thunderbird Plugin" (ID 3781451), grupo Cubo3. Tareas ad hoc a nombre de Luis.
- **Flujo:** commit al terminar cada sesión y push si es posible.
