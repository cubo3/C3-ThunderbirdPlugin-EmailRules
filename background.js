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

/** Marca como basura y, según configuración, mueve a Junk o Papelera. */
async function applyBlock(message, settings) {
  try {
    await browser.messages.update(message.id, { junk: true });
    if (settings.blockAction === "junk") return;
    const target = await findFolder(message.folder.accountId, settings.blockAction === "trash" ? "trash" : "junk");
    if (target && message.folder.path !== target.path) {
      await browser.messages.move([message.id], target);
    }
  } catch (e) {
    console.error("[C3] applyBlock:", message.id, e);
  }
}

/** Quita la marca de basura y, si estaba en Junk, lo devuelve a la bandeja de entrada. */
async function applyAllow(message) {
  try {
    if (message.junk) await browser.messages.update(message.id, { junk: false });
    const junk = await findFolder(message.folder.accountId, "junk");
    if (junk && message.folder.path === junk.path) {
      const inbox = await findFolder(message.folder.accountId, "inbox");
      if (inbox) await browser.messages.move([message.id], inbox);
    }
  } catch (e) {
    console.error("[C3] applyAllow:", message.id, e);
  }
}

async function processMessages(messages) {
  const { rules, settings } = await load();
  for (const m of messages) {
    const verdict = C3Rules.evaluate(m.author, rules, settings);
    if (verdict === "block") await applyBlock(m, settings);
    else if (verdict === "allow") await applyAllow(m);
  }
}

/* ---- Menú contextual ---- */
const MENU = [
  { id: "c3-block-sender", title: "Bloquear remitente", list: "blockSenders", kind: "sender" },
  { id: "c3-block-domain", title: "Bloquear dominio", list: "blockDomains", kind: "domain" },
  { id: "c3-allow-sender", title: "Whitelist remitente", list: "allowSenders", kind: "sender" },
  { id: "c3-allow-domain", title: "Whitelist dominio", list: "allowDomains", kind: "domain" }
];

function createMenus() {
  browser.menus.removeAll().then(() => {
    browser.menus.create({ id: "c3-parent", title: "Correo no deseado (C3)", contexts: ["message_list"] });
    for (const m of MENU) {
      browser.menus.create({ id: m.id, parentId: "c3-parent", title: m.title, contexts: ["message_list"] });
    }
  });
}

browser.menus.onClicked.addListener(async (info) => {
  const item = MENU.find((m) => m.id === info.menuItemId);
  if (!item) return;
  const selected = (info.selectedMessages && info.selectedMessages.messages) || [];
  if (!selected.length) return;

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
