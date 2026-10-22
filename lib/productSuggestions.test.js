'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

describe('productSuggestions', () => {
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'www', 'productSuggestions.js'), 'utf8'), ctx);
    const list = ctx.window.PRODUCT_SUGGESTIONS;
    const langs = ctx.window.PRODUCT_SUGGESTION_LANGS;

    it('provides the 10 non-German languages', () => {
        assert.deepStrictEqual([...langs], ['en', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn']);
    });

    it('has a non-empty name in every language for every entry', () => {
        assert.ok(list.length > 1000);
        for (const [de, cat, names] of list) {
            assert.ok(de && cat, `entry ${de}`);
            assert.strictEqual(names.length, langs.length, de);
            names.forEach((n, i) => assert.ok(n && n.trim(), `${de} (${langs[i]})`));
        }
    });

    it('links food entries to tags with 11 non-empty labels', () => {
        const tags = ctx.window.PRODUCT_TAGS;
        assert.ok(tags.length > 500);
        for (const [id, labels] of tags) {
            assert.match(id, /^[a-z]{2}:/);
            assert.strictEqual(labels.length, 11, id);
            labels.forEach((l, i) => assert.ok(l && l.trim(), `${id} #${i}`));
        }
        tags.forEach(([id, , parents]) => {
            assert.ok(parents.length <= 2, id);
            parents.forEach(j => assert.ok(tags[j], id));
        });
        const fusilli = tags.find(t => t[0] === 'en:fusilli');
        assert.deepStrictEqual(
            [...fusilli[2]].map(j => tags[j][1][0]),
            ['Nudeln', 'Pflanzliche Lebensmittel'],
        );
        const linked = list.filter(e => e.length > 3);
        assert.ok(linked.length > 1000);
        linked.forEach(e => assert.ok(tags[e[3]], e[0]));
    });

    it('uses known categories only', () => {
        const ok = new Set(['Lebensmittel', 'Drogerie', 'Haushalt', 'Tierbedarf']);
        for (const e of list) {
            assert.ok(ok.has(e[1]), e[0]);
        }
    });
});

describe("extra category names", () => {
	it("has 11 non-empty labels per extra category", () => {
		const vm = require("node:vm");
		const fs = require("node:fs");
		const path = require("node:path");
		const w = {};
		vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "www", "productSuggestions.js"), "utf8"), { window: w });
		const ids = Object.keys(w.PRODUCT_TAG_NAMES);
		assert.ok(ids.length > 900);
		for (const id of ids) {
			const l = w.PRODUCT_TAG_NAMES[id];
			assert.strictEqual(l.length, 11, id);
			assert.ok(l.every(x => x && x.trim()), id);
		}
	});
});
