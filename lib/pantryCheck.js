'use strict';

const { listName } = require('./core');

const UNITS = {
    kg: ['g', 1000],
    g: ['g', 1],
    gr: ['g', 1],
    gramm: ['g', 1],
    mg: ['g', 0.001],
    l: ['ml', 1000],
    liter: ['ml', 1000],
    ml: ['ml', 1],
    cl: ['ml', 10],
    dl: ['ml', 100],
    stück: ['count', 1],
    stueck: ['count', 1],
    stk: ['count', 1],
    st: ['count', 1],
    x: ['count', 1],
    pck: ['other', 1],
    packung: ['other', 1],
    pkg: ['other', 1],
    dose: ['other', 1],
    dosen: ['other', 1],
    el: ['other', 1],
    tl: ['other', 1],
    prise: ['other', 1],
    bund: ['other', 1],
    becher: ['other', 1],
    glas: ['other', 1],
};
const FRACTIONS = { '¼': 0.25, '½': 0.5, '¾': 0.75 };
const NUM = '(\\d+(?:[.,]\\d+)?|[¼½¾])';
const UNIT = `(${Object.keys(UNITS)
    .sort((a, b) => b.length - a.length)
    .join('|')})`;
const LEAD = new RegExp(`^${NUM}\\s*${UNIT}?\\.?\\s+(.+)$`, 'i');
const TRAIL = new RegExp(`^(.+?)\\s+${NUM}\\s*${UNIT}\\.?$`, 'i');

/**
 * @param {string} s number text
 * @returns {number} value
 */
function num(s) {
    return FRACTIONS[s] ?? Number(String(s).replace(',', '.'));
}

/**
 * Split one ingredient text into name, amount and kind (g, ml, count, other or empty).
 *
 * @param {string} text for example "200 g Mehl", "Mehl 200g", "3 Eier" or "Milch"
 * @returns {{name: string, amount: number, kind: string}} parsed ingredient
 */
function parseOne(text) {
    const t = String(text ?? '')
        .replace(/\s+/g, ' ')
        .trim();
    let m = LEAD.exec(t);
    let name = t;
    let n = 0;
    let u = '';
    if (m) {
        n = num(m[1]);
        u = (m[2] || '').toLowerCase();
        name = m[3];
    } else if ((m = TRAIL.exec(t))) {
        name = m[1];
        n = num(m[2]);
        u = m[3].toLowerCase();
    }
    name = name
        .replace(/\(.*?\)/g, '')
        .replace(/^[-–•*]\s*/, '')
        .trim();
    if (!n || !Number.isFinite(n)) {
        return { name, amount: 0, kind: '' };
    }
    const [kind, factor] = u ? UNITS[u] : ['count', 1];
    return { name, amount: kind === 'other' ? 0 : n * factor, kind: kind === 'other' ? '' : kind };
}

/**
 * Read a list of ingredients: a JSON array of texts or objects, or text separated by commas, semicolons or lines.
 * The same ingredient twice is added up.
 *
 * @param {string} input request
 * @returns {{name: string, amount: number, kind: string}[]} ingredients
 */
function parseItems(input) {
    let parts;
    const raw = String(input ?? '').trim();
    try {
        const j = JSON.parse(raw);
        if (Array.isArray(j)) {
            parts = j.map(x =>
                x && typeof x === 'object'
                    ? `${x.amount ?? ''} ${x.unit ?? ''} ${x.name ?? ''}`.replace(/\s+/g, ' ').trim()
                    : String(x),
            );
        }
    } catch {
        // plain text
    }
    parts ||= raw.split(/[;\n]|,(?!\d)/);
    const out = [];
    for (const p of parts) {
        const item = parseOne(p);
        if (!listName(item.name)) {
            continue;
        }
        const same = out.find(
            x => listName(x.name).toLowerCase() === listName(item.name).toLowerCase() && x.kind === item.kind,
        );
        if (same) {
            same.amount += item.amount;
        } else {
            out.push(item);
        }
    }
    return out.slice(0, 200);
}

/**
 * @param {string} word lower case word
 * @returns {string[]} the word and simple singular forms
 */
function forms(word) {
    const out = [word];
    for (const end of ['en', 'n', 'e', 's']) {
        if (word.length > 4 && word.endsWith(end)) {
            out.push(word.slice(0, -end.length));
        }
    }
    return out;
}

/**
 * @param {object} product product
 * @returns {{size: number, kind: string}} package size in g or ml, kind empty when unknown
 */
function packSize(product) {
    const m = /(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\b/i.exec(String(product.packageSize || ''));
    if (!m) {
        return { size: 0, kind: '' };
    }
    const [kind, factor] = UNITS[m[2].toLowerCase()];
    return { size: num(m[1]) * factor, kind };
}

/**
 * Products of the inventory that stand for an ingredient: by name, group or tag.
 *
 * @param {object} data inventory data
 * @param {string} name ingredient name
 * @returns {object[]} products
 */
function findProducts(data, name) {
    const wanted = forms(listName(name).toLowerCase());
    const fields = p => [p.name, p.group, ...(p.tags || [])].map(x => listName(x).toLowerCase()).filter(Boolean);
    const all = Object.values(data.products);
    const exact = all.filter(p => fields(p).some(f => wanted.includes(f)));
    if (exact.length) {
        return exact;
    }
    return all.filter(p =>
        fields(p).some(f =>
            wanted.some(
                w =>
                    w.length >= 3 && (f.startsWith(`${w} `) || f.includes(` ${w}`) || (f.length >= 4 && w.endsWith(f))),
            ),
        ),
    );
}

/**
 * Compare the ingredients with the stock.
 *
 * @param {object} data inventory data
 * @param {{name: string, amount: number, kind: string}[]} items ingredients
 * @returns {{name: string, wanted: number, unit: string, have: number, ok: boolean, missing: number, products: string[]}[]} result per ingredient
 */
function checkItems(data, items) {
    return items.map(item => {
        const products = findProducts(data, item.name);
        let have = 0;
        let present = false;
        let counted = false;
        for (const p of products) {
            const stock = Object.values(data.inventory[p.id] || {}).reduce((s, n) => s + Number(n || 0), 0);
            if (stock <= 0) {
                continue;
            }
            present = true;
            const pack = packSize(p);
            if (item.kind === 'g' || item.kind === 'ml') {
                const kind = p.type === 'weight' ? 'g' : p.type === 'volume' ? 'ml' : pack.kind;
                if (kind === item.kind) {
                    have += p.type === 'count' ? stock * pack.size : stock;
                    counted = true;
                }
            } else if (item.kind === 'count') {
                if (p.type === 'count') {
                    have += stock;
                    counted = true;
                } else if (pack.size > 0) {
                    have += stock / pack.size;
                    counted = true;
                }
            }
        }
        const measured = item.amount > 0 && counted;
        const ok = measured ? have + 1e-9 >= item.amount : present;
        const missing = !ok && measured ? Math.round((item.amount - have) * 1000) / 1000 : 0;
        return {
            name: item.name,
            wanted: item.amount,
            unit: item.kind === 'count' ? '' : item.kind,
            have: measured ? Math.round(have * 1000) / 1000 : present ? -1 : 0,
            ok,
            missing,
            products: products.map(p => p.name),
        };
    });
}

module.exports = { parseItems, parseOne, checkItems, findProducts };
