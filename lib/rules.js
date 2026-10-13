/* Lógica pura de reglas (sin APIs de Thunderbird) para poder testearla en Node. */
(function (root) {
  "use strict";

  const DEFAULT_RULES = { blockSenders: [], blockDomains: [], allowSenders: [], allowDomains: [] };
  const DEFAULT_SETTINGS = { includeSubdomains: true, blockAction: "junk-and-move" };

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
    for (const k of Object.keys(DEFAULT_RULES)) {
      const arr = Array.isArray(src[k]) ? src[k] : [];
      out.rules[k] = [...new Set(arr.map((x) => String(x).trim().toLowerCase()).filter(Boolean))];
    }
    if (obj.settings && typeof obj.settings === "object") {
      if (typeof obj.settings.includeSubdomains === "boolean") out.settings.includeSubdomains = obj.settings.includeSubdomains;
      if (["junk", "junk-and-move", "trash"].includes(obj.settings.blockAction)) out.settings.blockAction = obj.settings.blockAction;
    }
    return out;
  }

  const api = { DEFAULT_RULES, DEFAULT_SETTINGS, parseAddress, domainOf, evaluate, addTo, addExclusive, normalizeImport };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.C3Rules = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
