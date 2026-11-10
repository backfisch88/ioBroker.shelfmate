'use strict';

const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');

/** Product fields of ShelfMate that can be taken from the own database. */
const FIELDS = [
    'ean',
    'name',
    'brand',
    'packageSize',
    'unit',
    'category',
    'group',
    'tags',
    'image',
    'minStock',
    'shelfLifeDays',
    'openedDays',
    'freezeDays',
];
const NUMBERS = { minStock: 100000, shelfLifeDays: 36500, openedDays: 3650, freezeDays: 36500 };
const MAX_BYTES = 20 * 1024 * 1024;
const WRAPPER_KEYS = ['products', 'items', 'data', 'list', 'rows'];

/**
 * @param {string} s text
 * @returns {string} text without a byte order mark
 */
function stripBom(s) {
    return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * Barcode as a comparison key: digits only, without leading zeros (UPC-A and EAN-13 of the same product match).
 *
 * @param {unknown} v barcode
 * @returns {string} key, empty if there are no digits
 */
function eanKey(v) {
    const d = String(v ?? '').replace(/\D/g, '');
    return d.replace(/^0+/, '');
}

/**
 * Split CSV text into rows of fields (quotes, doubled quotes and line breaks inside quotes are handled).
 *
 * @param {string} text CSV text
 * @param {string} delimiter field separator
 * @returns {string[][]} rows
 */
function csvRows(text, delimiter) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            } else if (c === '"') {
                quoted = false;
            } else {
                field += c;
            }
        } else if (c === '"' && field === '') {
            quoted = true;
        } else if (c === delimiter) {
            row.push(field);
            field = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') {
                i++;
            }
            row.push(field);
            field = '';
            if (row.some(x => x !== '')) {
                rows.push(row);
            }
            row = [];
        } else {
            field += c;
        }
    }
    row.push(field);
    if (row.some(x => x !== '')) {
        rows.push(row);
    }
    return rows;
}

/**
 * @param {string} text CSV text with a header line
 * @returns {object[]} one object per line, keyed by the header names
 */
function parseCsv(text) {
    const clean = stripBom(String(text));
    const head = clean.split(/\r?\n/, 1)[0] || '';
    const count = ch => head.split(ch).length - 1;
    const delimiter = [';', '\t', ',', '|'].reduce((best, ch) => (count(ch) > count(best) ? ch : best), ',');
    const rows = csvRows(clean, delimiter);
    if (rows.length < 2) {
        return [];
    }
    const names = rows[0].map(x => x.trim());
    return rows.slice(1).map(r => Object.fromEntries(names.map((n, i) => [n, r[i] ?? '']).filter(([n]) => n)));
}

/**
 * Read the records out of the raw content of a source.
 *
 * @param {string} raw JSON or CSV text
 * @param {'auto' | 'list' | 'object' | 'csv'} format how to read it
 * @returns {object[]} records; for the object format the key is kept as `__key`
 */
function parseRecords(raw, format = 'auto') {
    const text = stripBom(String(raw ?? ''));
    const trimmed = text.trim();
    if (!trimmed) {
        return [];
    }
    let kind = format;
    if (kind === 'auto' || !['list', 'object', 'csv'].includes(kind)) {
        kind = trimmed.startsWith('[') ? 'list' : trimmed.startsWith('{') ? 'object' : 'csv';
    }
    if (kind === 'csv') {
        return parseCsv(text);
    }
    const json = JSON.parse(trimmed);
    if (Array.isArray(json)) {
        return json.filter(x => x && typeof x === 'object');
    }
    if (!json || typeof json !== 'object') {
        return [];
    }
    // {"products": [...]} style wrapper
    const arrays = Object.entries(json).filter(([, v]) => Array.isArray(v));
    const wrapped = arrays.find(([k]) => WRAPPER_KEYS.includes(k)) || (arrays.length === 1 ? arrays[0] : null);
    if (wrapped && format !== 'object') {
        return wrapped[1].filter(x => x && typeof x === 'object');
    }
    return Object.entries(json)
        .filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v))
        .map(([k, v]) => ({ __key: k, ...v }));
}

/**
 * Value of a field; a dotted name also reaches into nested objects ("data.title").
 *
 * @param {object} rec record
 * @param {string} key field name in the own data
 * @returns {unknown} value
 */
function getValue(rec, key) {
    if (!rec || !key) {
        return undefined;
    }
    if (Object.prototype.hasOwnProperty.call(rec, key)) {
        return rec[key];
    }
    let cur = rec;
    for (const part of String(key).split('.')) {
        if (cur === null || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, part)) {
            return undefined;
        }
        cur = cur[part];
    }
    return cur;
}

/**
 * @param {unknown} v value
 * @param {number} max upper limit
 * @returns {number} whole number, 0 if it is not usable
 */
function toNumber(v, max) {
    const n = Math.floor(Number(String(v ?? '').replace(',', '.')));
    return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
}

/**
 * @param {unknown} v list or text with separators
 * @returns {string[]} tags
 */
function toTags(v) {
    const list = Array.isArray(v) ? v : String(v ?? '').split(/[,;|]/);
    return [...new Set(list.map(x => String(x ?? '').trim()).filter(Boolean))].slice(0, 30);
}

/**
 * Field mapping: ShelfMate field to the name used in the own data. Without an entry the field keeps its name.
 *
 * @param {unknown} rows table of the settings, [{field, key}]
 * @returns {Record<string, string>} mapping
 */
function buildMap(rows) {
    const map = Object.fromEntries(FIELDS.map(f => [f, f]));
    for (const r of Array.isArray(rows) ? rows : []) {
        const field = String(r?.field ?? '').trim();
        const key = String(r?.key ?? '').trim();
        if (FIELDS.includes(field) && key) {
            map[field] = key;
        }
    }
    return map;
}

/**
 * @param {object} rec record of the own data
 * @param {Record<string, string>} map field mapping
 * @returns {object | null} product for ShelfMate, null without a name
 */
function mapRecord(rec, map) {
    const text = f => {
        const v = getValue(rec, map[f]);
        return v === undefined || v === null || typeof v === 'object' ? '' : String(v).trim();
    };
    const name = text('name');
    if (!name) {
        return null;
    }
    const product = { name, source: 'own' };
    for (const f of ['brand', 'packageSize', 'unit', 'category', 'group', 'image']) {
        const v = text(f);
        if (v) {
            product[f] = v;
        }
    }
    const tags = toTags(getValue(rec, map.tags));
    if (tags.length) {
        product.tags = tags;
    }
    for (const [f, max] of Object.entries(NUMBERS)) {
        const n = toNumber(getValue(rec, map[f]), max);
        if (n > 0) {
            product[f] = n;
        }
    }
    return product;
}

/**
 * @param {object[]} records records
 * @param {Record<string, string>} map field mapping
 * @returns {Map<string, object>} barcode key to record
 */
function buildIndex(records, map) {
    const index = new Map();
    for (const rec of records) {
        const key = eanKey(getValue(rec, map.ean) ?? rec.__key);
        if (key && !index.has(key)) {
            index.set(key, rec);
        }
    }
    return index;
}

/**
 * Load a text from a URL (http or https), with time and size limit.
 *
 * @param {string} url address
 * @param {number} [redirects] redirects still allowed
 * @returns {Promise<string>} body
 */
function fetchText(url, redirects = 3) {
    return new Promise((resolve, reject) => {
        let u;
        try {
            u = new URL(url);
        } catch {
            reject(new Error('Invalid URL'));
            return;
        }
        if (!/^https?:$/.test(u.protocol)) {
            reject(new Error('Only http and https are supported'));
            return;
        }
        const req = (u.protocol === 'https:' ? https : http).get(u, { timeout: 10000 }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
                res.resume();
                fetchText(new URL(res.headers.location, u).href, redirects - 1).then(resolve, reject);
                return;
            }
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            let size = 0;
            res.on('data', c => {
                size += c.length;
                if (size > MAX_BYTES) {
                    req.destroy(new Error('File too large'));
                    return;
                }
                chunks.push(c);
            });
            res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            res.on('error', reject);
        });
        req.on('timeout', () => req.destroy(new Error('Timeout')));
        req.on('error', reject);
    });
}

/** Product fields that ShelfMate writes for products with an own barcode. */
const EXPORT_FIELDS = FIELDS.filter(f => f !== 'ean');

/**
 * Barcodes ShelfMate makes up itself (13 digits, start with 2) are written to the own database,
 * so the same product keeps the same barcode when data is restored or moved.
 *
 * @param {unknown} ean barcode
 * @returns {boolean} true for a barcode made up by ShelfMate
 */
function isOwnEan(ean) {
    return /^2\d{12}$/.test(String(ean ?? ''));
}

/**
 * Add the products with an own barcode to the list of the own database, keeping everything else in it.
 *
 * @param {string} current content of the data point (JSON list, may be empty)
 * @param {object[]} products products of ShelfMate
 * @returns {string | null} new content, null if nothing changes or the content is not a JSON list
 */
function mergeOwnProducts(current, products) {
    const text = stripBom(String(current ?? '')).trim();
    let list = [];
    if (text) {
        try {
            list = JSON.parse(text);
        } catch {
            return null;
        }
        if (!Array.isArray(list)) {
            return null;
        }
    }
    const next = list.slice();
    for (const p of products) {
        if (!isOwnEan(p.ean) || !p.name) {
            continue;
        }
        const entry = { ean: p.ean, name: p.name };
        for (const f of EXPORT_FIELDS) {
            const v = p[f];
            if (f === 'name' || v === undefined || v === null || v === '' || v === 0) {
                continue;
            }
            if (Array.isArray(v) ? v.length : true) {
                entry[f] = v;
            }
        }
        if (typeof entry.image === 'string' && !/^https?:\/\//i.test(entry.image)) {
            delete entry.image;
        }
        const at = next.findIndex(x => x && typeof x === 'object' && eanKey(x.ean) === eanKey(p.ean));
        if (at >= 0) {
            next[at] = { ...next[at], ...entry };
        } else {
            next.push(entry);
        }
    }
    const out = JSON.stringify(next);
    return out === JSON.stringify(list) ? null : out;
}

/** The own product database: looks a barcode up in a data point, a file and/or a web address. */
class OwnDb {
    /**
     * @param {object} opt options
     * @param {object} opt.config adapter settings (ownDbMode, ownDbState, ownDbFile, ownDbUrl, ownDbFormat, ownDbRefresh, ownDbMap)
     * @param {(id: string) => Promise<unknown>} [opt.readState] value of a data point
     * @param {(path: string) => Promise<{text: string, stamp: string}>} [opt.readFile] file content
     * @param {(url: string) => Promise<string>} [opt.fetchUrl] web content
     * @param {(msg: string) => void} [opt.warn] logger for problems
     * @param {() => number} [opt.now] clock
     */
    constructor(opt) {
        this.config = opt.config || {};
        this.builtin = opt.builtin || '';
        this.builtinSize = 0;
        this.readState = opt.readState || (async () => null);
        this.readFile =
            opt.readFile ||
            (async path => {
                const st = await fs.promises.stat(path);
                if (st.size > MAX_BYTES) {
                    throw new Error('File too large');
                }
                return { text: await fs.promises.readFile(path, 'utf8'), stamp: `${st.mtimeMs}|${st.size}` };
            });
        this.fetchUrl = opt.fetchUrl || fetchText;
        this.warn = opt.warn || (() => {});
        this.now = opt.now || Date.now;
        this.cache = new Map();
        this.failed = new Map();
    }

    /** @returns {string[][]} the sources of the settings, in the order they are asked */
    sources() {
        const c = this.config;
        const out = [];
        for (const [kind, key] of [
            ['state', 'ownDbState'],
            ['file', 'ownDbFile'],
            ['url', 'ownDbUrl'],
        ]) {
            const v = String(c[key] ?? '').trim();
            if (v) {
                out.push([kind, v]);
            }
        }
        return out;
    }

    /** @returns {'off' | 'first' | 'only'} how the own database is used; "off" without a source */
    get mode() {
        if (!this.sources().length && !this.builtinSize) {
            return 'off';
        }
        const m = this.config.ownDbMode;
        return m === 'only' ? 'only' : m === 'off' ? 'off' : 'first';
    }

    /** @returns {number} minutes before a web address is loaded again */
    get refreshMs() {
        const m = Math.floor(Number(this.config.ownDbRefresh));
        return (Number.isFinite(m) && m >= 1 && m <= 1440 ? m : 10) * 60000;
    }

    /**
     * @param {string} kind state, file or url
     * @param {string} ref data point id, path or address
     * @returns {Promise<Map<string, object> | null>} index of the source, null if it cannot be read
     */
    async load(kind, ref) {
        const id = `${kind}:${ref}`;
        const own = ref === this.builtin;
        const map = buildMap(own ? [] : this.config.ownDbMap);
        const format = own ? 'auto' : this.config.ownDbFormat;
        const mapKey = JSON.stringify([map, format]);
        const old = this.cache.get(id);
        try {
            let text;
            let stamp;
            if (kind === 'state') {
                const v = await this.readState(ref);
                text = typeof v === 'string' ? v : v === null || v === undefined ? '' : JSON.stringify(v);
                stamp = text;
            } else if (kind === 'file') {
                const f = await this.readFile(ref);
                ({ text, stamp } = f);
            } else {
                if (old && old.mapKey === mapKey && this.now() - old.at < this.refreshMs) {
                    return old.index;
                }
                text = await this.fetchUrl(ref);
                stamp = `${text.length}|${text.slice(0, 200)}|${text.slice(-200)}`;
            }
            if (old && old.stamp === stamp && old.mapKey === mapKey) {
                old.at = this.now();
                this.failed.delete(id);
                return old.index;
            }
            const index = buildIndex(parseRecords(text, format), map);
            if (own) {
                this.builtinSize = index.size;
            }
            this.cache.set(id, { stamp, mapKey, index, map, at: this.now() });
            this.failed.delete(id);
            return index;
        } catch (e) {
            if (this.failed.get(id) !== e.message) {
                this.failed.set(id, e.message);
                this.warn(`Own database (${kind} ${ref}): ${e.message}`);
            }
            if (old) {
                old.at = this.now();
            }
            return old ? old.index : null;
        }
    }

    /** Read the data point of the own database, so that `mode` knows whether it holds anything. */
    async refresh() {
        if (this.builtin) {
            await this.load('state', this.builtin);
        }
    }

    /**
     * @param {string} ean barcode
     * @returns {Promise<object | null>} product with the ShelfMate field names, null if no source knows it
     */
    async find(ean) {
        const key = eanKey(ean);
        if (!key) {
            return null;
        }
        if (this.builtin) {
            await this.load('state', this.builtin);
        }
        if (this.mode === 'off') {
            return null;
        }
        const sources = this.builtin ? [['state', this.builtin], ...this.sources()] : this.sources();
        for (const [kind, ref] of sources) {
            const index = await this.load(kind, ref);
            const rec = index && index.get(key);
            const product = rec && mapRecord(rec, buildMap(ref === this.builtin ? [] : this.config.ownDbMap));
            if (product) {
                return { ...product, ean: String(ean).trim() };
            }
        }
        return null;
    }
}

module.exports = {
    OwnDb,
    FIELDS,
    isOwnEan,
    mergeOwnProducts,
    eanKey,
    parseRecords,
    parseCsv,
    buildMap,
    mapRecord,
    buildIndex,
    getValue,
};
