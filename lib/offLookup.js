'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/** Generic top-level categories that say nothing about the product. */
const TOP_CATS = [
    'en:plant-based-foods-and-beverages',
    'en:plant-based-foods',
    'en:condiments',
    'en:beverages',
    'en:beverages-and-beverages-preparations',
    'en:fresh-foods',
    'en:frozen-foods',
    'en:canned-foods',
    'en:foods',
    'en:food',
    'en:groceries',
];

let localNames = null;

/** Category names of the app in all languages (the same list the app uses), loaded once. */
function loadLocalNames() {
    if (!localNames) {
        const ctx = { window: {} };
        try {
            vm.runInNewContext(
                fs.readFileSync(path.join(__dirname, '..', 'www', 'productSuggestions.js'), 'utf8'),
                ctx,
            );
        } catch {
            // the lookup works without the local names
        }
        const w = ctx.window;
        localNames = {
            langs: ['de'].concat(w.PRODUCT_SUGGESTION_LANGS || []),
            byId: new Map((w.PRODUCT_TAGS || []).map(t => [String(t[0]).toLowerCase(), t[1]])),
            plain: w.PRODUCT_TAG_NAMES || {},
        };
    }
    return localNames;
}

/**
 * @param {string} id Open Food Facts category id like "en:pastas"
 * @param {string} lang language code
 */
function localTag(id, lang) {
    const L = loadLocalNames();
    const k = String(id).toLowerCase();
    const names = L.byId.get(k) || L.plain[k.replace(/^en:/, '')];
    if (!names) {
        return '';
    }
    const i = L.langs.indexOf(lang);
    return names[i >= 0 ? i : 0] || '';
}

/**
 * Names of categories nobody translated locally, from the Open Food Facts taxonomy.
 *
 * @param {string[]} ids category ids
 * @param {string} lang language code
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @returns {Promise<Record<string, string>>} id to name
 */
async function taxonomyNames(ids, lang, doFetch, ms) {
    const l = lang === 'zh-cn' ? 'zh' : lang;
    try {
        const r = await doFetch(
            `https://world.openfoodfacts.org/api/v2/taxonomy?tagtype=categories&fields=name&lc=${l},en&tags=${encodeURIComponent(ids.join(','))}`,
            { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(ms) },
        );
        if (!r.ok) {
            return {};
        }
        const j = await r.json();
        const o = j && j.tags && typeof j.tags === 'object' && !Array.isArray(j.tags) ? j.tags : j;
        const out = {};
        for (const id of ids) {
            let nm = o && o[id] && o[id].name;
            if (nm && typeof nm === 'object') {
                nm = Array.isArray(nm) ? '' : nm[l];
            }
            if (typeof nm === 'string' && nm.trim()) {
                out[id] = nm.trim();
            }
        }
        return out;
    } catch {
        return {};
    }
}

/**
 * Tags of a product: the last three specific categories in the language of the system.
 *
 * @param {object} p product of Open Food Facts
 * @param {string} lang language code
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @returns {Promise<string[]>} tags
 */
async function tagsOf(p, lang, doFetch, ms) {
    const ids = (Array.isArray(p.categories_tags) ? p.categories_tags : []).filter(
        x => !TOP_CATS.includes(String(x).toLowerCase()),
    );
    const missing = ids.filter(id => /^[a-z]{2,3}:/i.test(id) && !localTag(id, lang));
    const remote = missing.length ? await taxonomyNames(missing, lang, doFetch, ms) : {};
    const name = id => {
        const local = localTag(id, lang);
        if (local) {
            return local;
        }
        if (remote[id]) {
            return remote[id];
        }
        if (lang !== 'en') {
            return '';
        }
        const w = String(id)
            .replace(/^[a-z]{2,3}:/i, '')
            .replace(/-/g, ' ')
            .trim();
        return w ? w.charAt(0).toUpperCase() + w.slice(1) : '';
    };
    let list = ids.map(name).filter(Boolean).slice(-3);
    if (!list.length && !ids.length && String(p.categories_lc || '').slice(0, 2) === lang.slice(0, 2) && p.categories) {
        list = String(p.categories)
            .split(',')
            .map(x => x.trim())
            .filter(x => x && !/^[a-z]{2,3}:/i.test(x))
            .slice(-3);
    }
    return [...new Set(list.map(x => x.replace(/\s+/g, ' ')))];
}

/** Open Food Facts and its sister databases, tried in this order. */
const DATABASES = [
    ['world.openfoodfacts.org', 'Lebensmittel'],
    ['world.openbeautyfacts.org', 'Drogerie'],
    ['world.openpetfoodfacts.org', 'Tierbedarf'],
    ['world.openproductsfacts.org', 'Haushalt'],
];

/**
 * @param {string} host database host
 * @param {string} ean barcode
 * @param {string} lang language code
 */
function urlFor(host, ean, lang) {
    const l = lang === 'zh-cn' ? 'zh' : lang;
    return (
        `https://${host}/api/v2/product/${encodeURIComponent(ean)}` +
        `?fields=code,product_name,product_name_${l},product_name_en,brands,quantity,image_front_small_url,image_url,nutriscore_grade,categories_tags,categories,categories_lc&lc=${l}`
    );
}

/**
 * Look a barcode up. Resolves null when no database knows it or none can be reached.
 *
 * @param {string} ean barcode (8-14 digits)
 * @param {{lang?: string, fetch?: typeof fetch, timeoutMs?: number}} [opt] options
 * @returns {Promise<{name: string, brand: string, packageSize: string, image: string, category: string, nutriscore: string, tags: string[]} | null>} product data
 */
async function lookupBarcode(ean, opt = {}) {
    const doFetch = opt.fetch || globalThis.fetch;
    const lang = opt.lang || 'en';
    const ms = opt.timeoutMs || 6000;
    for (const [host, category] of DATABASES) {
        let j;
        try {
            const r = await doFetch(urlFor(host, ean, lang), {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(ms),
            });
            if (!r.ok) {
                continue;
            }
            j = await r.json();
        } catch {
            continue;
        }
        const p = j && j.status === 1 && j.product;
        if (!p) {
            continue;
        }
        const name = String(p[`product_name_${lang}`] || p.product_name || p.product_name_en || '').trim();
        if (!name) {
            continue;
        }
        const image = String(p.image_front_small_url || p.image_url || '');
        const grade = String(p.nutriscore_grade || '').toLowerCase();
        return {
            name,
            brand: String(p.brands || ''),
            packageSize: String(p.quantity || ''),
            image: /^https:\/\//i.test(image) ? image : '',
            category,
            nutriscore: /^[a-e]$/.test(grade) ? grade : '',
            tags: await tagsOf(p, lang, doFetch, ms),
        };
    }
    return null;
}

module.exports = { lookupBarcode, DATABASES };
