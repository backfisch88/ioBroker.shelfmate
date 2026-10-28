'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dictDir = path.join(__dirname, 'translations');

const GERMAN = /[äöüßÄÖÜ]|\b(der|die|das|und|nicht|mit|für|bitte|noch|kein|keine|wird|werden|oder|eine|zum|zur|dem|den|von|bei|nach|alle|aus|auf|ist|sind|zu|neu)\b/i;

/**
 * Read all dictionary files and return the German source texts.
 *
 * @returns {{exact: Set<string>, patterns: RegExp[]}} lookup structures
 */
function loadDictionary() {
    const exact = new Set();
    const patterns = [];
    for (const file of fs.readdirSync(dictDir).filter(f => /^dict.*\.txt$/.test(f))) {
        for (const line of fs.readFileSync(path.join(dictDir, file), 'utf8').split('\n')) {
            const cols = line.split('|');
            if (cols.length < 11 || !cols[0].trim()) {
                continue;
            }
            const key = cols[0].trim();
            if (/\{\d\}/.test(key)) {
                const re = key.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\d\}/g, '[\\s\\S]+?');
                patterns.push(new RegExp(`^${re}$`));
            } else {
                exact.add(key);
            }
        }
    }
    return { exact, patterns };
}

/**
 * Collect user-visible strings from the static markup of the app.
 *
 * @param {string} html page source
 * @returns {Set<string>} texts
 */
function visibleTexts(html) {
    const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
    const out = new Set();
    for (const m of body.matchAll(/(?:placeholder|title|aria-label|alt)="([^"]+)"/g)) {
        out.add(m[1].trim());
    }
    for (const m of body.replace(/<[^>]*>/g, '\n').matchAll(/[^\n]+/g)) {
        const t = m[0].replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
        if (t) {
            out.add(t);
        }
    }
    return out;
}

// Proper names that are intentionally not translated.
const KEEP = new Set(['Küchenlager']);

describe('app translations', () => {
    const { exact, patterns } = loadDictionary();
    const html = fs.readFileSync(path.join(root, 'www', 'index.html'), 'utf8');

    it('every German text in the markup has a dictionary entry', () => {
        const missing = [...visibleTexts(html)].filter(
            t => GERMAN.test(t) && !KEEP.has(t) && !exact.has(t) && !patterns.some(re => re.test(t)),
        );
        assert.deepStrictEqual(missing, [], `Missing in tools/translations: ${JSON.stringify(missing, null, 1)}`);
    });

    it('the generated www/i18n.js contains every dictionary entry', () => {
        const generated = fs.readFileSync(path.join(root, 'www', 'i18n.js'), 'utf8');
        const absent = [...exact].filter(k => !generated.includes(JSON.stringify(k).slice(1, -1)));
        assert.deepStrictEqual(absent.slice(0, 10), [], 'run tools/buildI18n.py to refresh www/i18n.js');
    });
});
