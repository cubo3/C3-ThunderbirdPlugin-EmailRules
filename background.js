"use strict";
/* C3 Email Rules - background. Usa C3Rules (lib/rules.js). */

async function load() {
  const d = await browser.storage.local.get(["rules", "settings"]);
  return {
    rules: Object.assign({}, C3Rules.DEFAULT_RULES, d.rules),
    settings: Object.assign({}, C3Rules.DEFAULT_SETTINGS, d.settings)
  };
}

async function save(rules) {
  await browser.storage.local.set({ rules });
}

async function findFolder(accountId, specialUse) {
  try {
    const f = await browser.folders.query({ accountId, specialUse: [specialUse] });
    return f[0] || null;
  } catch (e) {
    console.warn("[C3] folders.query falló:", e);
    return null;
  }
}

function findByPath(folders, path) {
  for (const f of folders || []) {
    if (f.path === path) return f;
    const sub = findByPath(f.subFolders, path);
    if (sub) return sub;
  }
  return null;
}

/** Resuelve la carpeta guardada en una regla (por id; si cambió, por cuenta + ruta). */
async function resolveFolder(ref) {
  if (!ref) return null;
  try {
    if (ref.id) return await browser.folders.get(ref.id);
  } catch (e) { /* cae al método por ruta */ }
  try {
    const account = await browser.accounts.get(ref.accountId);
    const subs = await browser.folders.getSubFolders(account.rootFolder, true);
    return findByPath(subs, ref.path);
  } catch (e) {
    console.warn("[C3] carpeta no encontrada:", ref.path, e);
    return null;
  }
}

function sameFolder(a, b) {
  return !!a && !!b && a.accountId === b.accountId && a.path === b.path;
}

/** Marca como basura, opcionalmente como leído, y según configuración mueve a Junk o Papelera. */
async function applyBlock(message, settings) {
  try {
    const upd = { junk: true };
    if (settings.markReadBlocked && !message.read) upd.read = true;
    await browser.messages.update(message.id, upd);
    if (settings.blockAction === "junk") return;
    const target = await findFolder(message.folder.accountId, settings.blockAction === "trash" ? "trash" : "junk");
    if (target && !sameFolder(message.folder, target)) {
      await browser.messages.move([message.id], target);
    }
  } catch (e) {
    console.error("[C3] applyBlock:", message.id, e);
  }
}

/**
 * Mensajes que no se bloquean: whitelist (sacar de basura) y/o regla de carpeta.
 * Un solo movimiento por mensaje: carpeta de la regla, o Inbox si era whitelist y estaba en Junk.
 */
async function applyKeep(message, verdict, moveRule, settings) {
  try {
    const upd = {};
    if (verdict === "allow" && message.junk) upd.junk = false;
    const markRead = (moveRule && moveRule.markRead) || (verdict === "allow" && settings.markReadAllowed);
    if (markRead && !message.read) upd.read = true;
    if (Object.keys(upd).length) await browser.messages.update(message.id, upd);

    let target = moveRule ? await resolveFolder(moveRule.folder) : null;
    if (!target && verdict === "allow") {
      const junk = await findFolder(message.folder.accountId, "junk");
      if (junk && sameFolder(message.folder, junk)) target = await findFolder(message.folder.accountId, "inbox");
    }
    if (target && !sameFolder(message.folder, target)) {
      await browser.messages.move([message.id], target);
    }
  } catch (e) {
    console.error("[C3] applyKeep:", message.id, e);
  }
}

async function processMessages(messages) {
  const { rules, settings } = await load();
  for (const m of messages) {
    const verdict = C3Rules.evaluate(m.author, rules, settings);
    if (verdict === "block") {
      await applyBlock(m, settings);
      continue;
    }
    const moveRule = C3Rules.findMoveRule(m.author, rules, settings);
    if (verdict === "allow" || moveRule) await applyKeep(m, verdict, moveRule, settings);
  }
}

/* ---- Menú contextual ---- */
const MENU = [
  { id: "c3-block-sender", title: "Bloquear remitente", list: "blockSenders", kind: "sender" },
  { id: "c3-block-domain", title: "Bloquear dominio", list: "blockDomains", kind: "domain" },
  { id: "c3-allow-sender", title: "Whitelist remitente", list: "allowSenders", kind: "sender" },
  { id: "c3-allow-domain", title: "Whitelist dominio", list: "allowDomains", kind: "domain" }
];
const MENU_RULE = [
  { id: "c3-move-sender", title: "Regla de carpeta para este remitente…", kind: "sender" },
  { id: "c3-move-domain", title: "Regla de carpeta para este dominio…", kind: "domain" }
];
const MENU_APPLY = { id: "c3-apply-now", title: "Aplicar reglas a la selección" };

function createMenus() {
  browser.menus.removeAll().then(() => {
    browser.menus.create({ id: "c3-parent", title: "Correo no deseado (C3)", contexts: ["message_list"] });
    for (const m of MENU) {
      browser.menus.create({ id: m.id, parentId: "c3-parent", title: m.title, contexts: ["message_list"] });
    }
    browser.menus.create({ id: "c3-sep", parentId: "c3-parent", type: "separator", contexts: ["message_list"] });
    for (const m of MENU_RULE) {
      browser.menus.create({ id: m.id, parentId: "c3-parent", title: m.title, contexts: ["message_list"] });
    }
    browser.menus.create({ id: MENU_APPLY.id, parentId: "c3-parent", title: MENU_APPLY.title, contexts: ["message_list"] });
  });
}

browser.menus.onClicked.addListener(async (info) => {
  const selected = (info.selectedMessages && info.selectedMessages.messages) || [];
  if (!selected.length) return;

  if (info.menuItemId === MENU_APPLY.id) {
    await processMessages(selected);
    return;
  }

  const ruleItem = MENU_RULE.find((m) => m.id === info.menuItemId);
  if (ruleItem) {
    // Abre las opciones con el formulario de regla de carpeta ya rellenado
    const email = C3Rules.parseAddress(selected[0].author);
    const value = ruleItem.kind === "domain" ? C3Rules.domainOf(email) : email;
    if (!value) return;
    const url = browser.runtime.getURL("options/options.html") +
      "#new=" + ruleItem.kind + "&value=" + encodeURIComponent(value);
    await browser.tabs.create({ url });
    return;
  }

  const item = MENU.find((m) => m.id === info.menuItemId);
  if (!item) return;
  const { rules } = await load();
  let changed = false;
  for (const msg of selected) {
    const email = C3Rules.parseAddress(msg.author);
    const value = item.kind === "domain" ? C3Rules.domainOf(email) : email;
    if (value && C3Rules.addExclusive(rules, item.list, value)) changed = true;
  }
  if (changed) await save(rules);

  // Acción inmediata sobre lo seleccionado
  await processMessages(selected);
});

/* ---- Correos nuevos ---- */
browser.messages.onNewMailReceived.addListener(async (folder, messageList) => {
  try {
    await processMessages(messageList.messages);
  } catch (e) {
    console.error("[C3] onNewMailReceived:", e);
  }
});

browser.runtime.onInstalled.addListener(createMenus);
createMenus();
