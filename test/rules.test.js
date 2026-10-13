"use strict";
const assert = require("node:assert");
const R = require("../lib/rules.js");

const rules = { blockSenders: ["spam@x.com"], blockDomains: ["malo.com"], allowSenders: ["ok@malo.com"], allowDomains: ["bueno.cl"] };
const on = { includeSubdomains: true }, off = { includeSubdomains: false };

assert.strictEqual(R.parseAddress('"Juan P" <Juan@Ej.COM>'), "juan@ej.com");
assert.strictEqual(R.parseAddress("a@b.cl"), "a@b.cl");
assert.strictEqual(R.parseAddress("sin correo"), null);
assert.strictEqual(R.domainOf("a@b.cl"), "b.cl");

assert.strictEqual(R.evaluate("Spam <spam@x.com>", rules, on), "block");
assert.strictEqual(R.evaluate("x@malo.com", rules, on), "block");
assert.strictEqual(R.evaluate("x@mail.malo.com", rules, on), "block");
assert.strictEqual(R.evaluate("x@mail.malo.com", rules, off), null);
assert.strictEqual(R.evaluate("x@notmalo.com", rules, on), null, "no debe coincidir por sufijo parcial");
assert.strictEqual(R.evaluate("ok@malo.com", rules, on), "allow", "allow sender gana a block domain");
assert.strictEqual(R.evaluate("a@bueno.cl", rules, on), "allow");
assert.strictEqual(R.evaluate("sin correo", rules, on), null);

const r = { blockSenders: [], blockDomains: [], allowSenders: [], allowDomains: [] };
assert.ok(R.addExclusive(r, "blockSenders", "A@B.com"));
assert.ok(!R.addExclusive(r, "blockSenders", "a@b.com"), "sin duplicados");
R.addExclusive(r, "allowSenders", "a@b.com");
assert.deepStrictEqual(r.blockSenders, [], "al permitir se quita de bloqueados");

const n = R.normalizeImport({ rules: { blockDomains: [" A.com ", "a.com"] }, settings: { blockAction: "trash" } });
assert.deepStrictEqual(n.rules.blockDomains, ["a.com"]);
assert.strictEqual(n.settings.blockAction, "trash");
assert.throws(() => R.normalizeImport(null));
// --- Reglas de carpeta ---
const F = { id: "f1", accountId: "acc1", path: "/INBOX/Carrasco", name: "Carrasco" };
const F2 = { id: "f2", accountId: "acc1", path: "/INBOX/Jefe", name: "Jefe" };
const mr = { moveRules: [] };
assert.ok(R.addMoveRule(mr, { type: "domain", value: "Carrasco.cl", folder: F, markRead: true }));
assert.ok(R.addMoveRule(mr, { type: "sender", value: "jefe@carrasco.cl", folder: F2 }));
assert.ok(!R.addMoveRule(mr, { type: "domain", value: "", folder: F }), "valor vacío");
assert.ok(!R.addMoveRule(mr, { type: "otro", value: "a.cl", folder: F }), "tipo inválido");
assert.ok(!R.addMoveRule(mr, { type: "domain", value: "a.cl" }), "sin carpeta");
assert.strictEqual(mr.moveRules.length, 2);
assert.strictEqual(R.findMoveRule("Ana <ana@carrasco.cl>", mr, on).folder.path, "/INBOX/Carrasco");
assert.strictEqual(R.findMoveRule("ana@carrasco.cl", mr, on).markRead, true);
assert.strictEqual(R.findMoveRule("jefe@carrasco.cl", mr, on).folder.path, "/INBOX/Jefe", "remitente exacto gana a dominio");
assert.strictEqual(R.findMoveRule("x@mail.carrasco.cl", mr, on).folder.path, "/INBOX/Carrasco");
assert.strictEqual(R.findMoveRule("x@mail.carrasco.cl", mr, off), null);
assert.strictEqual(R.findMoveRule("x@xcarrasco.cl", mr, on), null, "sin coincidencia parcial");
assert.strictEqual(R.findMoveRule("sin correo", mr, on), null);
R.addMoveRule(mr, { type: "domain", value: "carrasco.cl", folder: F2, markRead: false });
assert.strictEqual(mr.moveRules.length, 2, "misma regla se reemplaza");
assert.strictEqual(R.findMoveRule("ana@carrasco.cl", mr, on).folder.path, "/INBOX/Jefe");
const deep = { moveRules: [] };
R.addMoveRule(deep, { type: "domain", value: "carrasco.cl", folder: F });
R.addMoveRule(deep, { type: "domain", value: "ventas.carrasco.cl", folder: F2 });
assert.strictEqual(R.findMoveRule("x@ventas.carrasco.cl", deep, on).folder.path, "/INBOX/Jefe", "gana el dominio más específico");

const imp = R.normalizeImport({ rules: { moveRules: [{ type: "domain", value: "A.cl", folder: F, markRead: 1 }, { type: "x" }] }, settings: { markReadBlocked: true, markReadAllowed: "si" } });
assert.strictEqual(imp.rules.moveRules.length, 1);
assert.strictEqual(imp.rules.moveRules[0].markRead, true);
assert.strictEqual(imp.settings.markReadBlocked, true);
assert.strictEqual(imp.settings.markReadAllowed, false, "solo booleanos");
console.log("OK: todos los tests pasaron");
