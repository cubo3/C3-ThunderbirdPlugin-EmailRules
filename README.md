# C3 Email Rules (add-on de Thunderbird)

Gestión de correo no deseado con clic derecho, al estilo Outlook Classic:

- Bloquear remitente / Bloquear dominio
- Whitelist remitente / Whitelist dominio

Los correos nuevos se evalúan contra las listas: los bloqueados se marcan como basura y se mueven a Junk (o Papelera, configurable); los de la whitelist se desmarcan y vuelven a la bandeja de entrada si estaban en Junk.

**Prioridad:** remitente permitido > remitente bloqueado > dominio permitido > dominio bloqueado.

## Instalación para pruebas
1. Thunderbird > Herramientas > Complementos y temas.
2. Engranaje > *Depurar complementos* > *Cargar complemento temporal…*
3. Seleccionar `manifest.json` de esta carpeta.
4. Clic derecho sobre un mensaje en la lista > **Correo no deseado (C3)**.

Opciones: Complementos > C3 Email Rules > Preferencias (editar listas, importar/exportar JSON).

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
