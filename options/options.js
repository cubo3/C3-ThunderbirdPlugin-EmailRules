"use strict";

const LISTS = [
  { key: "blockSenders", title: "Remitentes bloqueados", placeholder: "spam@ejemplo.com" },
  { key: "blockDomains", title: "Dominios bloqueados", placeholder: "ejemplo.com" },
  { key: "allowSenders", title: "Remitentes permitidos (whitelist)", placeholder: "cliente@empresa.cl" },
  { key: "allowDomains", title: "Dominios permitidos (whitelist)", placeholder: "empresa.cl" }
];

let state = { rules: {}, settings: {} };
const $ = (id) => document.getElementById(id);

async function load() {
  const d = await browser.storage.local.get(["rules", "settings"]);
  state.rules = Object.assign({}, C3Rules.DEFAULT_RULES, d.rules);
  state.settings = Object.assign({}, C3Rules.DEFAULT_SETTINGS, d.settings);
}

async function persist() {
  await browser.storage.local.set({ rules: state.rules, settings: state.settings });
}

function flash(msg) {
  $("status").textContent = msg;
  setTimeout(() => ($("status").textContent = ""), 2500);
}

/* ---- Carpetas por cuenta ---- */
let folderChoices = []; // [{ folder: {id, accountId, path, name}, label }]

async function loadFolders() {
  folderChoices = [];
  const select = $("moveFolder");
  select.textContent = "";
  try {
    const accounts = await browser.accounts.list();
    for (const acc of accounts) {
      if (!acc.rootFolder) continue;
      const group = document.createElement("optgroup");
      group.label = acc.name;
      const walk = (folders, depth) => {
        for (const f of folders || []) {
          const idx = folderChoices.length;
          folderChoices.push({ folder: { id: f.id, accountId: f.accountId, path: f.path, name: f.name }, label: acc.name + " / " + f.path });
          const opt = document.createElement("option");
          opt.value = String(idx);
          opt.textContent = "\u00a0\u00a0".repeat(depth) + f.name;
          group.append(opt);
          walk(f.subFolders, depth + 1);
        }
      };
      walk(await browser.folders.getSubFolders(acc.rootFolder, true), 0);
      select.append(group);
    }
  } catch (e) {
    console.error("[C3] no se pudieron listar carpetas", e);
  }
}

function renderMoveRules() {
  const ul = $("moveList");
  ul.textContent = "";
  const rules = state.rules.moveRules || [];
  if (!rules.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Sin reglas de carpeta todavía.";
    ul.append(li);
    return;
  }
  rules.forEach((r, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = `${r.type === "domain" ? "Dominio" : "Remitente"} ${r.value} \u2192 ${r.folder.name} (${r.folder.path})` + (r.markRead ? " \u2022 marcar leído" : "");
    const rm = document.createElement("button");
    rm.textContent = "Quitar";
    rm.addEventListener("click", async () => {
      state.rules.moveRules.splice(i, 1);
      await persist(); renderMoveRules();
    });
    li.append(span, rm);
    ul.append(li);
  });
}

$("moveForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const choice = folderChoices[Number($("moveFolder").value)];
  if (!choice) { flash("Elige una carpeta"); return; }
  const ok = C3Rules.addMoveRule(state.rules, {
    type: $("moveType").value, value: $("moveValue").value, folder: choice.folder, markRead: $("moveRead").checked
  });
  if (!ok) { flash("Datos inválidos"); return; }
  await persist();
  $("moveValue").value = "";
  renderMoveRules();
  flash("Regla guardada");
});

function prefillFromHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get("new") === "sender" || p.get("new") === "domain") {
    $("moveType").value = p.get("new");
    $("moveValue").value = p.get("value") || "";
    $("moveSection").scrollIntoView();
    $("moveFolder").focus();
  }
}

function render() {
  $("includeSubdomains").checked = state.settings.includeSubdomains;
  $("blockAction").value = state.settings.blockAction;
  $("markReadBlocked").checked = !!state.settings.markReadBlocked;
  $("markReadAllowed").checked = !!state.settings.markReadAllowed;
  renderMoveRules();
  const root = $("lists");
  root.textContent = "";
  for (const L of LISTS) {
    const box = document.createElement("div");
    box.className = "list";
    const h = document.createElement("h2");
    h.textContent = `${L.title} (${state.rules[L.key].length})`;
    const ul = document.createElement("ul");
    for (const v of state.rules[L.key]) {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = v;
      const rm = document.createElement("button");
      rm.textContent = "Quitar";
      rm.addEventListener("click", async () => {
        state.rules[L.key] = state.rules[L.key].filter((x) => x !== v);
        await persist(); render();
      });
      li.append(span, rm);
      ul.append(li);
    }
    const add = document.createElement("div");
    add.className = "add";
    const input = document.createElement("input");
    input.placeholder = L.placeholder;
    const btn = document.createElement("button");
    btn.textContent = "Agregar";
    const doAdd = async () => {
      if (C3Rules.addExclusive(state.rules, L.key, input.value)) { await persist(); render(); }
    };
    btn.addEventListener("click", doAdd);
    input.addEventListener("keydown", (e) => e.key === "Enter" && doAdd());
    add.append(input, btn);
    box.append(h, ul, add);
    root.append(box);
  }
}

$("includeSubdomains").addEventListener("change", async (e) => { state.settings.includeSubdomains = e.target.checked; await persist(); });
$("markReadBlocked").addEventListener("change", async (e) => { state.settings.markReadBlocked = e.target.checked; await persist(); });
$("markReadAllowed").addEventListener("change", async (e) => { state.settings.markReadAllowed = e.target.checked; await persist(); });
$("blockAction").addEventListener("change", async (e) => { state.settings.blockAction = e.target.value; await persist(); });

$("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ rules: state.rules, settings: state.settings }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "c3-email-rules.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", async (e) => {
  try {
    const parsed = C3Rules.normalizeImport(JSON.parse(await e.target.files[0].text()));
    state.rules = parsed.rules; state.settings = parsed.settings;
    await persist(); render(); flash("Importado");
  } catch (err) { flash("Error: " + err.message); }
  e.target.value = "";
});

load().then(render).then(loadFolders).then(prefillFromHash);
