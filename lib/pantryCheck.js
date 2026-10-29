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

const AMT = `\\d+(?:[.,]\\d+)?\\s*(?:${Object.keys(UNITS)
    .sort((a, b) => b.length - a.length)
    .join('|')})?`;
// "500g", "bunt 500g" or several amounts like "500g + 500g" (also with %2B as the Bring adapter writes it)
const SPEC = new RegExp(`^(?:([^\\d+%]+?)\\s+)?(${AMT}(?:\\s*(?:\\+|%2B)\\s*${AMT})*)\\.?$`, 'i');
const AMOUNT = new RegExp(`^${NUM}\\s*${UNIT}?\\.?$`, 'i');

/**
 * Split one ingredient text into name, qualifiers and amount. The text may look like
 * "200 g Mehl", "Mehl 200g", "Mehl, 200 g" or "Cherrytomaten, bunt, 500g" (name, qualifiers and amount between commas, in any order after the name).
 *
 * @param {string} text one ingredient
 * @returns {{name: string, qualifiers: string[], amountText: string, amount: number, kind: string}} parsed ingredient
 */
function parseOne(text) {
    const parts = String(text ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(/\s*,(?!\d)\s*/)
        .filter(Boolean);
    let name = parts.shift() || '';
    const qualifiers = [];
    let amountText = '';
    let n = 0;
    let u = '';
    let m = LEAD.exec(name);
    if (m) {
        n = num(m[1]);
        u = (m[2] || '').toLowerCase();
        amountText = `${m[1]}${m[2] ? ` ${m[2]}` : ''}`.trim();
        name = m[3];
    } else if ((m = TRAIL.exec(name))) {
        name = m[1];
        n = num(m[2]);
        u = m[3].toLowerCase();
        amountText = `${m[2]} ${m[3]}`.trim();
    }
    for (const p of parts) {
        const sp = !amountText && SPEC.exec(p);
        if (sp) {
            if (sp[1]) {
                qualifiers.push(sp[1]);
            }
            amountText = sp[2].replace(/%2B/gi, '+');
            for (const piece of amountText.split(/\s*\+\s*/)) {
                const am = AMOUNT.exec(piece);
                const unit = (am[2] || '').toLowerCase();
                const kind = unit ? (UNITS[unit] || ['other', 1])[0] : 'count';
                const factor = unit ? (UNITS[unit] || ['other', 1])[1] : 1;
                if (!u && !n) {
                    u = unit;
                }
                const first = (u ? (UNITS[u] || ['other', 1])[0] : 'count') === kind;
                if (first && kind !== 'other') {
                    n += num(am[1]) * (factor / (u ? (UNITS[u] || ['other', 1])[1] : 1));
                }
            }
        } else {
            qualifiers.push(p);
        }
    }
    name = name
        .replace(/\(.*?\)/g, '')
        .replace(/^[-–•*]\s*/, '')
        .trim();
    if (!n || !Number.isFinite(n)) {
        return { name, qualifiers, amountText, amount: 0, kind: '' };
    }
    const [kind, factor] = u ? UNITS[u] || ['other', 1] : ['count', 1];
    return {
        name,
        qualifiers,
        amountText,
        amount: kind === 'other' ? 0 : n * factor,
        kind: kind === 'other' ? '' : kind,
    };
}

/**
 * Read a list of ingredients, one per line or separated by semicolons, or a JSON array of texts or {name, amount, unit}.
 * Within an ingredient commas separate name, qualifiers and amount. The same ingredient twice is added up, the
 * original entries stay in `lines` so that they can go to the shopping list as they came.
 *
 * @param {string} input request
 * @returns {{name: string, amount: number, kind: string, lines: string[]}[]} ingredients
 */
function parseItems(input) {
    let parts;
    const raw = String(input ?? '').trim();
    try {
        const j = JSON.parse(raw);
        if (Array.isArray(j)) {
            parts = j.map(x =>
                x && typeof x === 'object'
                    ? [x.name, x.qualifier || x.note, `${x.amount ?? ''} ${x.unit ?? ''}`.trim()]
                          .filter(Boolean)
                          .join(', ')
                    : String(x),
            );
        }
    } catch {
        // plain text
    }
    parts ||= raw.split(/[;\n]/);
    const out = [];
    for (const p of parts) {
        const item = parseOne(p);
        if (!listName(item.name)) {
            continue;
        }
        const line = [item.name, ...item.qualifiers, item.amountText].filter(Boolean).join(', ');
        const same = out.find(
            x => listName(x.name).toLowerCase() === listName(item.name).toLowerCase() && x.kind === item.kind,
        );
        if (same) {
            same.amount += item.amount;
            same.lines.push(line);
        } else {
            out.push({ name: item.name, amount: item.amount, kind: item.kind, lines: [line] });
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
 * Products of the inventory that stand for an ingredient. The first of these that finds something wins:
 * name, group, then a whole word inside a name or group. Tags are not used: they are search terms and often
 * broad (from Open Food Facts), so they would count products that are not meant.
 *
 * @param {object} data inventory data
 * @param {string} name ingredient name
 * @returns {object[]} products
 */
function findProducts(data, name) {
    const wanted = forms(listName(name).toLowerCase());
    const all = Object.values(data.products);
    const named = all.filter(p => wanted.includes(listName(p.name).toLowerCase()));
    if (named.length) {
        return named;
    }
    const grouped = all.filter(p => p.group && wanted.includes(listName(p.group).toLowerCase()));
    if (grouped.length) {
        return grouped;
    }
    const inside = text => {
        const t = ` ${listName(text)
            .toLowerCase()
            .replace(/[\s,;:/()+-]+/g, ' ')} `;
        return wanted.some(w => w.length >= 3 && t.includes(` ${w} `));
    };
    return all.filter(p => inside(p.name) || (p.group && inside(p.group)));
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
        let reserve = 0;
        for (const p of products) {
            const stock = Object.values(data.inventory[p.id] || {}).reduce((s, n) => s + Number(n || 0), 0);
            const pack = packSize(p);
            const unit =
                p.type === 'count' && item.kind !== 'count'
                    ? pack.size
                    : p.type !== 'count' && item.kind === 'count'
                      ? 1 / (pack.size || Infinity)
                      : 1;
            reserve = Math.max(reserve, (Number(p.minStock) || 0) * unit);
            if (stock <= 0) {
                continue;
            }
            present = true;
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
        const need = item.amount + (measured ? reserve : 0);
        const ok = measured ? have + 1e-9 >= need : present;
        const missing = !ok && measured ? Math.round((need - have) * 1000) / 1000 : 0;
        let lines = item.lines || [item.name];
        if (missing > 0 && (have > 0 || reserve > 0)) {
            const first = parseOne(lines[0]);
            const unitText = item.kind === 'count' ? '' : item.kind;
            lines = [[first.name, ...first.qualifiers, `${missing}${unitText}`].join(', ')];
        }
        return {
            name: item.name,
            wanted: item.amount,
            unit: item.kind === 'count' ? '' : item.kind,
            have: measured ? Math.round(have * 1000) / 1000 : present ? -1 : 0,
            ok,
            missing,
            products: [...new Set(products.map(p => p.name))],
            lines,
        };
    });
}

module.exports = { parseItems, parseOne, checkItems, findProducts };
