'use strict';

const LIST = require('./pluData');
const NAMES = require('./pluNames');

/**
 * Number of a produce item (PLU) as a plain digit string, or '' when the text is none.
 * Four digits are the normal number, five digits starting with 9 stand for organic.
 *
 * @param {string} s text
 */
function pluOf(s) {
    const t = String(s ?? '').trim();
    return /^[3-4]\d{3}$/.test(t) || /^9[3-4]\d{3}$/.test(t) ? t : '';
}

/**
 * Take apart a GS1 code as it is printed on price labels of scales (for example a data matrix):
 * 01 + article number (GTIN-14), then optionally net weight (310x, kg), price (392x) and dates.
 * Article numbers made of leading zeros and a PLU are returned as that PLU.
 *
 * @param {string} text scanned text
 * @returns {{code: string, plu: string, gtin: string, price?: number, weight?: number} | null} null when it is no GS1 code
 */
function parseGs1(text) {
    const s = String(text ?? '')
        .replace(/\s/g, '')
        .replaceAll('\u001d', '')
        .replace(/^\](?:d2|Q3|C1|e0)/i, '');
    const head = /^01(\d{14})(\d*)$/.exec(s);
    if (!head) {
        return null;
    }
    const gtin = head[1];
    let rest = head[2];
    const out = { gtin };
    while (rest) {
        const w = /^310([0-5])(\d{6})/.exec(rest);
        const p = /^392([0-3])(\d{1,15})$/.exec(rest);
        const d = /^(11|13|15|17)(\d{6})/.exec(rest);
        if (w) {
            out.weight = Number(w[2]) / 10 ** Number(w[1]);
            rest = rest.slice(10);
        } else if (p) {
            out.price = Number(p[2]) / 10 ** Number(p[1]);
            rest = '';
        } else if (d) {
            rest = rest.slice(8);
        } else {
            break;
        }
    }
    const short = /^0{9,10}(\d{4,5})$/.exec(gtin);
    const plu = short ? pluOf(short[1]) : '';
    return { ...out, plu, code: plu || gtin };
}

/**
 * Replace a GS1 code by the number the products are filed under, everything else stays as it is.
 *
 * @param {string} text scanned text
 */
function scanCode(text) {
    const g = parseGs1(text);
    return g ? g.code : String(text ?? '');
}

/**
 * Parse the data point with own PLU entries: {"4238": "Banane Bio"} or {"4238": {"name": "Banane Bio", ...}}.
 *
 * @param {string} raw JSON text
 * @returns {Map<string, object>} product fields by number
 */
function parseUser(raw) {
    const map = new Map();
    let obj;
    try {
        obj = JSON.parse(String(raw || '').trim() || '{}');
    } catch {
        return map;
    }
    if (!obj || typeof obj !== 'object') {
        return map;
    }
    const items = Array.isArray(obj)
        ? obj
        : Object.entries(obj).map(([k, v]) => ({ ...(typeof v === 'object' ? v : { name: v }), plu: k }));
    for (const it of items) {
        if (!it || typeof it !== 'object') {
            continue;
        }
        const code = pluOf(it.plu ?? it.code ?? it.ean);
        const name = String(it.name ?? '').trim();
        if (code && name) {
            const { plu: _a, code: _b, ean: _c, ...fields } = it;
            map.set(code, { ...fields, name: name.slice(0, 120) });
        }
    }
    return map;
}

// the category every product gets; the app translates it
const CATEGORY = 'Lebensmittel';
const LANGS = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];
// the word for organic, put behind the name (in front of it in Chinese)
const ORGANIC = {
    en: 'Organic',
    de: 'Bio',
    ru: 'Органический',
    pt: 'Biológico',
    nl: 'Biologisch',
    fr: 'Bio',
    it: 'Bio',
    es: 'Ecológico',
    pl: 'Bio',
    uk: 'Органічний',
    'zh-cn': '有机',
};
let base = null;

/**
 * @returns {Map<string, {name: string}>} base list by number, the name is the English one
 */
function baseList() {
    if (base) {
        return base;
    }
    base = new Map();
    for (const [name, codes] of LIST) {
        for (const t of codes.split(/\s+/)) {
            const [a, b] = t.split('-').map(Number);
            for (let n = a; n <= (b || a); n++) {
                base.set(String(n), { name });
            }
        }
    }
    return base;
}

/**
 * @param {string} lang language of the adapter
 * @returns {string} a language the names exist in
 */
function langOf(lang) {
    const l = String(lang || '').toLowerCase();
    return LANGS.includes(l) ? l : l === 'zh' || l === 'zh-tw' ? 'zh-cn' : 'en';
}

/**
 * Look a number up: own entries first, then the base list. An organic number (9 + number) adds the word for organic.
 *
 * @param {string} code number
 * @param {{lang?: string, user?: Map<string, object>}} [opts] options
 * @returns {object | null} product fields, null when unknown
 */
function findPlu(code, opts = {}) {
    const c = pluOf(code);
    if (!c) {
        return null;
    }
    const lang = langOf(opts.lang);
    const bio = c.length === 5;
    const plain = bio ? c.slice(1) : c;
    const own = opts.user?.get(c) || (bio ? opts.user?.get(plain) : undefined);
    if (own) {
        return { category: CATEGORY, type: 'count', ...own };
    }
    const b = baseList().get(plain);
    if (!b) {
        return null;
    }
    const name = NAMES[b.name]?.[lang] || b.name;
    const word = ORGANIC[lang];
    return {
        name: bio ? (lang === 'zh-cn' ? `${word}${name}` : `${name} ${word}`) : name,
        category: CATEGORY,
        type: 'count',
        ...(bio ? { tags: [word] } : {}),
    };
}

module.exports = { pluOf, parseGs1, scanCode, parseUser, findPlu, baseList };
