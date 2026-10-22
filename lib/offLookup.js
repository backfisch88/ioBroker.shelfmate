'use strict';

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
        `?fields=code,product_name,product_name_${l},product_name_en,brands,quantity,image_front_small_url,image_url,nutriscore_grade&lc=${l}`
    );
}

/**
 * Look a barcode up. Resolves null when no database knows it or none can be reached.
 *
 * @param {string} ean barcode (8-14 digits)
 * @param {{lang?: string, fetch?: typeof fetch, timeoutMs?: number}} [opt] options
 * @returns {Promise<{name: string, brand: string, packageSize: string, image: string, category: string, nutriscore: string} | null>} product data
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
        };
    }
    return null;
}

module.exports = { lookupBarcode, DATABASES };
