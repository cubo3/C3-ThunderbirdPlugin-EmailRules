/* Lógica pura de reglas (sin APIs de Thunderbird) para poder testearla en Node. */
(function (root) {
  "use strict";

  const LIST_KEYS = ["blockSenders", "blockDomains", "allowSenders", "allowDomains"];
  const DEFAULT_RULES = { blockSenders: [], blockDomains: [], allowSenders: [], allowDomains: [], moveRules: [] };
  const DEFAULT_SETTINGS = { includeSubdomains: true, blockAction: "junk-and-move", markReadBlocked: false, markReadAllowed: false };

  /** Extrae el email de "Nombre <a@b.com>" o "a@b.com". Devuelve minúsculas o null. */
  function parseAddress(author) {
    if (!author || typeof author !== "string") return null;
    const m = author.match(/<([^<>\s]+@[^<>\s]+)>/) || author.match(/([^\s<>"',;]+@[^\s<>"',;]+)/);
    return m ? m[1].trim().toLowerCase() : null;
  }

  function domainOf(email) {
    if (!email) return null;
    const i = email.lastIndexOf("@");
    return i > 0 && i < email.length - 1 ? email.slice(i + 1) : null;
  }

  function domainMatches(domain, ruleDomain, includeSubdomains) {
    if (domain === ruleDomain) return true;
    return !!includeSubdomains && domain.endsWith("." + ruleDomain);
  }

  /**
   * Evalúa un remitente. Prioridad (como Outlook: lo seguro gana a lo bloqueado):
   * allowSender > blockSender > allowDomain > blockDomain.
   * Devuelve "allow" | "block" | null.
   */
  function evaluate(author, rules, settings) {
    const r = Object.assign({}, DEFAULT_RULES, rules);
    const s = Object.assign({}, DEFAULT_SETTINGS, settings);
    const email = parseAddress(author);
    if (!email) return null;
    const domain = domainOf(email);
    if (r.allowSenders.includes(email)) return "allow";
    if (r.blockSenders.includes(email)) return "block";
    if (domain) {
      if (r.allowDomains.some((d) => domainMatches(domain, d, s.includeSubdomains))) return "allow";
      if (r.blockDomains.some((d) => domainMatches(domain, d, s.includeSubdomains))) return "block";
    }
    return null;
  }

  /**
   * Regla de carpeta aplicable a un remitente. Un remitente exacto gana a un dominio;
   * entre dominios gana el más específico (el más largo).
   * moveRule = { type: "sender"|"domain", value, folder: {id, accountId, path, name}, markRead }
   */
  function findMoveRule(author, rules, settings) {
    const email = parseAddress(author);
    if (!email) return null;
    const list = (rules && Array.isArray(rules.moveRules)) ? rules.moveRules : [];
    const sub = settings ? settings.includeSubdomains !== false : true;
    const exact = list.find((r) => r.type === "sender" && r.value === email);
    if (exact) return exact;
    const domain = domainOf(email);
    if (!domain) return null;
    return list
      .filter((r) => r.type === "domain" && domainMatches(domain, r.value, sub))
      .sort((a, b) => b.value.length - a.value.length)[0] || null;
  }

  /** Agrega o reemplaza una regla de carpeta (misma type+value). Devuelve true si cambió. */
  function addMoveRule(rules, rule) {
    const value = String((rule && rule.value) || "").trim().toLowerCase();
    if (!rule || !["sender", "domain"].includes(rule.type) || !value || !rule.folder || !rule.folder.accountId || !rule.folder.path) return false;
    if (!Array.isArray(rules.moveRules)) rules.moveRules = [];
    const clean = {
      type: rule.type, value,
      folder: { id: rule.folder.id || "", accountId: rule.folder.accountId, path: rule.folder.path, name: rule.folder.name || rule.folder.path },
      markRead: !!rule.markRead
    };
    const i = rules.moveRules.findIndex((r) => r.type === clean.type && r.value === clean.value);
    if (i >= 0) rules.moveRules[i] = clean; else rules.moveRules.push(clean);
    return true;
  }

  /** Agrega un valor a una lista sin duplicados. Devuelve true si cambió. */
  function addTo(rules, listName, value) {
    const v = String(value || "").trim().toLowerCase();
    if (!v) return false;
    if (!Array.isArray(rules[listName])) rules[listName] = [];
    if (rules[listName].includes(v)) return false;
    rules[listName].push(v);
    return true;
  }

  /** Una regla nueva no puede convivir con su opuesta: quita el valor de la lista contraria. */
  const OPPOSITE = {
    blockSenders: "allowSenders", allowSenders: "blockSenders",
    blockDomains: "allowDomains", allowDomains: "blockDomains"
  };
  function addExclusive(rules, listName, value) {
    const v = String(value || "").trim().toLowerCase();
    const opp = OPPOSITE[listName];
    if (opp && Array.isArray(rules[opp])) rules[opp] = rules[opp].filter((x) => x !== v);
    return addTo(rules, listName, v);
  }

  /** Valida y normaliza un JSON importado. */
  function normalizeImport(obj) {
    const out = { rules: Object.assign({}, DEFAULT_RULES), settings: Object.assign({}, DEFAULT_SETTINGS) };
    if (!obj || typeof obj !== "object") throw new Error("Archivo inválido");
    const src = obj.rules || {};
    for (const k of LIST_KEYS) {
      const arr = Array.isArray(src[k]) ? src[k] : [];
      out.rules[k] = [...new Set(arr.map((x) => String(x).trim().toLowerCase()).filter(Boolean))];
    }
    out.rules.moveRules = [];
    for (const r of Array.isArray(src.moveRules) ? src.moveRules : []) addMoveRule(out.rules, r);
    if (obj.settings && typeof obj.settings === "object") {
      for (const k of ["includeSubdomains", "markReadBlocked", "markReadAllowed"]) {
        if (typeof obj.settings[k] === "boolean") out.settings[k] = obj.settings[k];
      }
      if (["junk", "junk-and-move", "trash"].includes(obj.settings.blockAction)) out.settings.blockAction = obj.settings.blockAction;
    }
    return out;
  }

  const api = { DEFAULT_RULES, DEFAULT_SETTINGS, parseAddress, domainOf, evaluate, findMoveRule, addMoveRule, addTo, addExclusive, normalizeImport };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.C3Rules = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
