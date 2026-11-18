'use strict';

/** The kinds of products the lookup knows, in the order they are asked unless the settings say otherwise: the kitchen first, books after it. */
const SOURCES = ['food', 'drogerie', 'pet', 'household', 'pharmacy', 'books'];

/**
 * The order of the product sources from the settings: unknown entries and doubles are dropped, missing ones are added
 * at the end in the standard order.
 *
 * @param {unknown} raw the setting: list of names or of {source: name}, or a comma separated text
 * @returns {string[]} all sources, the preferred first
 */
function lookupOrder(raw) {
    const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,\s]+/) : [];
    const out = [];
    for (const x of list) {
        const k = String(x && typeof x === 'object' ? x.source : x)
            .trim()
            .toLowerCase();
        if (SOURCES.includes(k) && !out.includes(k)) {
            out.push(k);
        }
    }
    return [...out, ...SOURCES.filter(k => !out.includes(k))];
}

module.exports = { lookupOrder, SOURCES };
