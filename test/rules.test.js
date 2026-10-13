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
console.log("OK: todos los tests pasaron");
