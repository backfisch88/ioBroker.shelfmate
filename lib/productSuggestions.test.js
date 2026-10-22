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

    it('uses known categories only', () => {
        const ok = new Set(['Lebensmittel', 'Drogerie', 'Haushalt', 'Tierbedarf']);
        for (const e of list) {
            assert.ok(ok.has(e[1]), e[0]);
        }
    });
});
