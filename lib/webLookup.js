'use strict';

/**
 * Last resort for barcodes no product database knows: search the web for the barcode and read name, brand
 * and picture from the shop pages that show it. Only runs when the user asks for it.
 */

const { gate } = require('./netGate');
const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const SKIP_HOST =
    /(^|\.)(duckduckgo|google|bing|mojeek|brave|startpage|youtube|youtu|facebook|instagram|pinterest|tiktok|reddit|wikipedia|twitter|x|gs1-germany|gs1|tec-it|ean-finder|appontes|ean-suche|ean-search|barcodelookup|barcodespider|go-upc|upcitemdb|ean-code|eancode|buycott|gutefrage|quora|forum|answers)\.[a-z.]+$/i;
const MAX_HTML = 1500000;
// search results about adult content are dropped before anything is read or shown
const ADULT =
    /(porn|xxx|\bsex|nackt|naked|nude|erotik|erotic|escort|hentai|nsfw|fetisch|fetish|bdsm|camgirl|onlyfans|milf|brazzers|xvideos|xnxx|upskirt|masturb)/i;

const ENTITIES = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    szlig: 'ß',
    auml: 'ä',
    ouml: 'ö',
    uuml: 'ü',
};

/**
 * @param {string} s text with HTML entities
 * @returns {string} plain text
 */
function decode(s) {
    return String(s || '')
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
        .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * @param {string} html fragment with tags
 * @returns {string} plain text
 */
function strip(html) {
    return decode(String(html || '').replace(/<[^>]*>/g, ' '));
}

/**
 * @param {string} raw link as found on a result page (may be a redirect)
 * @returns {string} the target address, empty when it is not a usable link
 */
function target(raw) {
    try {
        const x = new URL(
            decode(raw).startsWith('//') ? `https:${decode(raw)}` : decode(raw),
            'https://duckduckgo.com',
        );
        let u = x.href;
        if (x.searchParams.get('uddg')) {
            u = x.searchParams.get('uddg');
        } else if (/\/ck\/a$/.test(x.pathname) && /^a1/.test(x.searchParams.get('u') || '')) {
            u = Buffer.from(x.searchParams.get('u').slice(2), 'base64').toString('utf8');
        }
        const t = new URL(u);
        return /^https?:$/.test(t.protocol) && !SKIP_HOST.test(t.hostname) && !/\.(pdf|jpe?g|png)$/i.test(t.pathname)
            ? t.href
            : '';
    } catch {
        return '';
    }
}

/**
 * Hits of a DuckDuckGo (normal or lite) or Bing result page, best first.
 *
 * @param {string} html result page
 * @returns {{url: string, title: string, snippet: string}[]} hits
 */
function searchResults(html) {
    const text = String(html);
    const out = [];
    const seen = new Set();
    const add = (raw, title, snippet) => {
        const url = target(raw);
        if (url && !seen.has(url)) {
            seen.add(url);
            out.push({ url, title: strip(title), snippet: strip(snippet) });
        }
    };
    // DuckDuckGo: <a class="result__a" href=...>title</a> ... class="result__snippet"
    for (const m of text.matchAll(
        /<a\b[^>]*class=["'][^"']*result(?:__a|-link)[^"']*["'][^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<a\b[^>]*class=["'][^"']*result(?:__a|-link)|$)/g,
    )) {
        const href = /href=["']([^"']+)["']/.exec(m[0].slice(0, m[0].indexOf('>') + 1));
        const snip = /class=["'][^"']*result(?:__snippet|-snippet)[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|td|div)>/.exec(
            m[2],
        );
        if (href) {
            add(href[1], m[1], snip ? snip[1] : '');
        }
    }
    // Bing: <li class="b_algo"><h2><a href=...>title</a></h2> ... <p>snippet</p>
    for (const m of text.matchAll(/<li class="b_algo"[\s\S]*?<\/li>/g)) {
        const a = /<h2[^>]*><a[^>]*?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(m[0]);
        const p = /<p[^>]*>([\s\S]*?)<\/p>/.exec(m[0]);
        if (a) {
            add(a[1], a[2], p ? p[1] : '');
        }
    }
    if (!out.length && !/<li class="b_algo"|result(?:__a|-link)/.test(text)) {
        // other result pages: every link to another site counts, the pages are checked for the barcode anyway
        for (const m of text.matchAll(/<a\b[^>]*?href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/g)) {
            if (strip(m[2]).length >= 8) {
                add(m[1], m[2], '');
            }
        }
    }
    return out.slice(0, 20);
}

/**
 * Language of a page: the html tag, else the locale of the page or of its address (/nl/, /fr-fr/).
 *
 * @param {string} html page
 * @param {URL} base address
 * @returns {string} two letters, empty when unknown
 */
function pageLang(html, base) {
    const tag = (/<html[^>]*\blang=["']?([a-z]{2})/i.exec(html) || [])[1];
    const loc = (/property=["']og:locale["'][^>]*content=["']([a-z]{2})/i.exec(html) || [])[1];
    const path = (/^\/([a-z]{2})(?:[-_][a-z]{2})?(?:\/|$)/i.exec(base.pathname) || [])[1];
    return String(tag || loc || path || '').toLowerCase();
}

/**
 * What the search asks for per language of the app: the search engines, the country endings of shops
 * that count as home, and the language of their pages.
 */
const LOCALES = {
    de: { tlds: ['de', 'at', 'ch', 'eu'], ddg: 'de-de', bing: 'setlang=de&cc=de' },
    en: {
        tlds: ['uk', 'us', 'ie', 'ca', 'au', 'eu'],
        ddg: 'uk-en',
        bing: 'setlang=en-GB&cc=GB',
    },
    fr: { tlds: ['fr', 'be', 'ch', 'lu', 'eu'], ddg: 'fr-fr', bing: 'setlang=fr&cc=FR' },
    es: { tlds: ['es', 'eu'], ddg: 'es-es', bing: 'setlang=es&cc=ES' },
    it: { tlds: ['it', 'ch', 'eu'], ddg: 'it-it', bing: 'setlang=it&cc=IT' },
    nl: { tlds: ['nl', 'be', 'eu'], ddg: 'nl-nl', bing: 'setlang=nl&cc=NL' },
    pl: { tlds: ['pl', 'eu'], ddg: 'pl-pl', bing: 'setlang=pl&cc=PL' },
    pt: { tlds: ['pt', 'br', 'eu'], ddg: 'br-pt', bing: 'setlang=pt&cc=PT' },
    ru: { tlds: ['ru', 'by', 'kz'], ddg: 'ru-ru', bing: 'setlang=ru&cc=RU' },
    uk: { tlds: ['ua'], ddg: 'ua-uk', bing: 'setlang=uk&cc=UA' },
    'zh-cn': { tlds: ['cn'], ddg: 'cn-zh', bing: 'setlang=zh-Hans&cc=CN' },
};

/**
 * @param {string} [lang] language of the app (de, en, fr, ... zh-cn)
 * @returns {{lang: string, tlds: string[], ddg: string, bing: string}} what to search with
 */
function localeOf(lang) {
    const l = String(lang || 'de').toLowerCase() === 'zh' ? 'zh-cn' : String(lang || 'de').toLowerCase();
    return { lang: LOCALES[l] ? l : 'de', ...(LOCALES[l] || LOCALES.de) };
}

// typical small words per language, to tell the language of a product name
const WORDS = {
    nl: 'voor|met|het|een|zonder|voet\\w*|voeten\\w*|huid|verzorging\\w*|voedende|verfrissing\\w*|ontspan\\w*|gezicht\\w*|lichaam\\w*|zeep|schuim|\\w+iteit\\w*',
    fr: 'pour|avec|sans|les|soin|peau|cheveux',
    es: 'para|con|sin|piel|cabello',
    it: 'per|senza|pelle',
    pl: 'dla|bez|skora|wlosow',
    de: 'und|mit|fur|ohne|haut|pflege\\w*|fuss\\w*|dusch\\w*|seife|erfrischung\\w*|zusatz\\w*|sanft\\w*|milch|honig|handwasch\\w*',
    en: 'the|and|with|for|care|bath|foot|feet|refreshing|soothing|moisturi[sz]ing|nourishing|cleansing|gentle|hair|skin|face',
};
const WORD_RE = Object.fromEntries(Object.entries(WORDS).map(([k, v]) => [k, new RegExp(`^(${v})$`)]));

/**
 * The language of a product name, from its typical small words.
 *
 * @param {string} name product name
 * @param {string} [want] language of the app: the words of another language have to appear twice, except for German
 * @returns {string} nl, fr, es, it, pl, de or en; empty when the name does not say
 */
function nameLang(name, want = 'de') {
    const words = plain(name).match(/[a-z]+/g) || [];
    let best = '';
    let top = 0;
    for (const [lang, re] of Object.entries(WORD_RE)) {
        const n = words.filter(w => re.test(w)).length;
        const need = lang === 'en' || (want !== 'de' && lang !== want) ? 2 : 1;
        if (n >= need && (n > top || (n === top && lang === want))) {
            best = lang;
            top = n;
        }
    }
    return best;
}

/**
 * A product name in another language than the app speaks (Dutch, French, ... for German): English is not
 * counted, it is used as a last resort (looksEnglish).
 *
 * @param {string} name product name
 * @param {string} [want] language of the app
 * @returns {boolean} true when it reads like a foreign language
 */
function looksForeign(name, want = 'de') {
    const l = nameLang(name, want);
    return !!l && l !== want && l !== 'en';
}

/**
 * A product name in English although the app speaks another language: the name of a shop of the home country is the
 * better one, English is only the last resort.
 *
 * @param {string} name product name
 * @param {string} [lang] language of the page
 * @param {string} [want] language of the app
 * @returns {boolean} true when it reads like English
 */
function looksEnglish(name, lang = '', want = 'de') {
    if (want === 'en') {
        return false;
    }
    const words = plain(name).match(/[a-z]+/g) || [];
    const hits = words.filter(w => WORD_RE.en.test(w)).length;
    return hits >= 2 || (lang === 'en' && hits >= 1);
}

/**
 * @param {string} html result page
 * @returns {string[]} urls of the hits
 */
function searchLinks(html) {
    return searchResults(html).map(r => r.url);
}

/**
 * @param {unknown} v image field of a JSON-LD node
 * @returns {string[]} image urls
 */
function imageList(v) {
    if (!v) {
        return [];
    }
    if (typeof v === 'string') {
        return [v];
    }
    if (Array.isArray(v)) {
        return v.flatMap(imageList);
    }
    return typeof v === 'object' ? imageList(v.url || v.contentUrl) : [];
}

/**
 * @param {unknown} node parsed JSON-LD
 * @param {object[]} out collected product nodes
 */
function collectProducts(node, out) {
    if (Array.isArray(node)) {
        node.forEach(n => collectProducts(n, out));
    } else if (node && typeof node === 'object') {
        const t = [].concat(node['@type'] || []).map(String);
        if (t.includes('Product')) {
            out.push(node);
        }
        collectProducts(node['@graph'], out);
        collectProducts(node.mainEntity, out);
    }
}

/**
 * @param {string} html page
 * @param {string} prop meta property
 * @returns {string} content of the meta tag
 */
function meta(html, prop) {
    const a = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*?content=["']([^"']*)["']`, 'i').exec(html);
    const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*?(?:property|name)=["']${prop}["']`, 'i').exec(html);
    return decode((a || b || [])[1]);
}

/**
 * Take the shop name and the size out of a page title: "NIVEA - Pflegedusche Derma, 250 ml | dm.de".
 *
 * @param {string} title raw title
 * @param {string} brand brand when the page names one
 * @returns {{name: string, brand: string, packageSize: string}} cleaned parts
 */
function cleanTitle(title, brand) {
    let name = decode(title);
    const parts = name.split(/\s+[|·]\s+/);
    name = parts[0].replace(/\s+[-–—]\s+INCI Beauty.*$/i, '');
    name = name.replace(/\s+[-–—]\s+[^-–—]{2,40}$/, m =>
        /(shop|online|kaufen|drogerie|markt|apotheke|rossmann|\bdm\b|\.(de|at|ch|com)\b)/i.test(m) ? '' : m,
    );
    name = name.replace(/\s+(online\s+)?(kaufen|bestellen)\b.*$/i, '').trim();
    let b = decode(brand);
    if (b && name.toLowerCase().startsWith(b.toLowerCase())) {
        const rest = name.slice(b.length).replace(/^\s*[-–—:]?\s*/, '');
        if (rest) {
            name = rest;
        }
    } else if (!b) {
        const m = /^([A-ZÄÖÜ][\wÄÖÜäöüß&'.]{1,20})\s+[-–—]\s+(.+)$/.exec(name);
        if (m) {
            b = m[1];
            name = m[2];
        }
    }
    let packageSize = '';
    const sz = /[-–—,\s]*\b(\d+(?:[.,]\d+)?\s?(?:ml|cl|liter|l|g|kg|stk\.?|stück|st))\s*$/i.exec(name);
    if (sz && name.length > sz[0].length) {
        packageSize = sz[1]
            .replace(/\s+/g, '')
            .replace(/liter$/i, 'l')
            .replace(/^([\d.,]+)/, '$1 ');
        name = name.slice(0, sz.index).replace(/[,\s-]+$/, '');
    }
    return { name: name.slice(0, 120), brand: b.slice(0, 60), packageSize };
}

/**
 * Rossmann puts its top category in front of the name: /de/pflege-und-duft-isana-spuelung/p/4068134135513.
 */
const ROSSMANN_CATS = [
    ['pflege-und-duft', 'Pflege & Duft', 'Drogerie'],
    ['dekorative-kosmetik', 'Make-up', 'Drogerie'],
    ['make-up', 'Make-up', 'Drogerie'],
    ['gesundheit', 'Gesundheit', 'Drogerie'],
    ['baby-und-kind', 'Baby & Kind', 'Drogerie'],
    ['baby-und-spielzeug', 'Baby & Spielzeug', 'Drogerie'],
    ['haushalt-und-wohnen', 'Haushalt & Wohnen', 'Haushalt'],
    ['haushalt', 'Haushalt', 'Haushalt'],
    ['ernaehrung', 'Ernährung', 'Lebensmittel'],
    ['tierbedarf', 'Tierbedarf', 'Tierbedarf'],
];

/**
 * @param {string} slug the part of an address in front of /p/
 * @returns {{cat: string[], rest: string}} top category (name, group) and the slug without it
 */
function rossmannSplit(slug) {
    for (const [prefix, name, group] of ROSSMANN_CATS) {
        if (slug.startsWith(`${prefix}-`)) {
            return { cat: [name, group], rest: slug.slice(prefix.length + 1) };
        }
    }
    return { cat: [], rest: slug };
}

/**
 * @param {string} url product address of Rossmann
 * @returns {{tags?: string[], category?: string}} category out of the address
 */
function rossmannCat(url) {
    try {
        const u = new URL(url);
        if (!/(^|\.)rossmann\.de$/i.test(u.hostname)) {
            return {};
        }
        const slug = decodeURIComponent(u.pathname.split('/p/')[0].split('/').pop() || '').toLowerCase();
        const { cat } = rossmannSplit(slug);
        return cat.length ? { tags: [cat[0]], category: cat[1] } : {};
    } catch {
        return {};
    }
}

/**
 * Labels a pharmacy shop puts under the title of an article (regulatory status, not advertising like "Now! Produkt").
 */
const PHARMA_LABELS = [
    'Arzneimittel',
    'apothekenpflichtig',
    'verschreibungspflichtig',
    'freiverkäuflich',
    'Medizinprodukt',
    'Nahrungsergänzungsmittel',
    'Homöopathikum',
    'Pflanzliches Arzneimittel',
];

/**
 * Tags of a pharmacy article: the status labels under the title ("Arzneimittel", "apothekenpflichtig") and the most
 * specific entry of the breadcrumb trail ("Ibuprofen"). Advertising labels like "Now! Produkt" are left out.
 *
 * @param {string} html product page
 * @param {string} url address of the page
 * @returns {{tags?: string[], category?: string}} tags and category, empty for other shops
 */
function pharmacyCat(html, url) {
    try {
        if (!/(^|\.)shop-apotheke\.com$/i.test(new URL(url).hostname)) {
            return {};
        }
    } catch {
        return {};
    }
    const tags = [];
    // the labels sit between the title and the rest of the page; the menu at the top has similar words
    const head = html.search(/<\/h1>/i);
    if (head >= 0) {
        const part = html.slice(head, head + 6000);
        const found = [];
        for (const m of part.matchAll(/>\s*([^<>]{3,40}?)\s*</g)) {
            const at = PHARMA_LABELS.findIndex(l => l.toLowerCase() === decode(m[1]).toLowerCase());
            if (at >= 0 && !found.includes(PHARMA_LABELS[at])) {
                found.push(PHARMA_LABELS[at]);
                tags.push(decode(m[1]));
            }
        }
    }
    // the trail as the page names it (a name like "1 mg/g" must not be split), without the start page
    const home = x => !x || /^(startseite|home|shop apotheke)$/i.test(x);
    let trail = breadcrumbs(html)
        .map(decode)
        .filter(x => !home(x));
    if (!trail.length) {
        const nav = /<(?:nav|ol|ul)[^>]+breadcrumb[^>]*>([\s\S]*?)<\/(?:nav|ol|ul)>/i.exec(html);
        trail = nav ? [...nav[1].matchAll(/>\s*([^<>]{2,80}?)\s*</g)].map(m => decode(m[1])).filter(x => !home(x)) : [];
    }
    // the last entry is often the article itself: only a category helps as tag
    const title = plain(decode((/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html) || [])[1] || '').replace(/<[^>]+>/g, ''));
    const article = x => x.length > 35 || (plain(x).length >= 15 && !!title && title.includes(plain(x).slice(0, 15)));
    const last = trail.filter(x => !article(x)).pop();
    if (last && !tags.some(t => t.toLowerCase() === last.toLowerCase())) {
        tags.push(last);
    }
    return tags.length ? { tags, category: 'Medikamente' } : {};
}

/**
 * Category path of a shop ("Baby & Kind > Babypflege > Babyshampoo") as a list of names.
 *
 * @param {unknown} raw text with separators, a list, or objects with a name
 * @returns {string[]} names, the generic first entries left out
 */
function catSegments(raw) {
    const out = [];
    const add = v => {
        if (Array.isArray(v)) {
            v.forEach(add);
        } else if (v && typeof v === 'object') {
            add(v.name || v.title || v.label || '');
        } else {
            String(v || '')
                .split(/\s*(?:>|›|»|\/|→)\s*/)
                .map(x => x.trim())
                .filter(
                    x => x && x.length < 60 && !/^(startseite|home|dm|alle produkte)$/i.test(x) && !/^https?:/i.test(x),
                )
                .forEach(x => out.push(x));
        }
    };
    add(raw);
    return [...new Set(out)].slice(0, 6);
}

/**
 * @param {string[]} segments category path of a shop
 * @returns {{tags?: string[], category?: string}} tags and the matching ShelfMate category
 */
function catInfo(segments) {
    if (!segments || !segments.length) {
        return {};
    }
    const t = plain(segments.join(' '));
    let category = 'Drogerie';
    if (/arzneimittel|medikament|apothekenpflicht/.test(t)) {
        category = 'Medikamente';
    } else if (/\b(tier|hund|katze|haustier|nager|vogel|aquaristik)/.test(t)) {
        category = 'Tierbedarf';
    } else if (/ernahr|lebensmittel|nahrung|getrank|snack|susswar|obst|gemuse|kaffee|\btee\b|brei\b|saft/.test(t)) {
        category = 'Lebensmittel';
    } else if (/haushalt|reinig|wasch|putz|kuche|papier|spul|insekt|batterie|kerze|garten|buro/.test(t)) {
        category = 'Haushalt';
    }
    return { tags: segments, category };
}

/**
 * The product name out of an address like https://www.rossmann.de/de/pflege-und-duft-sunozon-kids-sonnenspray/p/4305615827759.
 *
 * @param {string} url product address
 * @returns {string} name from the part before /p/
 */
function slugName(url) {
    try {
        const part = new URL(url).pathname.split('/p/')[0].split('/').pop() || '';
        return rossmannSplit(decodeURIComponent(part).toLowerCase())
            .rest.replace(/-+/g, ' ')
            .replace(/^\w/, c => c.toUpperCase())
            .trim();
    } catch {
        return '';
    }
}

/**
 * The barcode as a number of its own, never as a part of a longer number. A short barcode (EAN-8) also turns up in
 * prices, dates and ids, so a word like EAN or GTIN has to stand in front of it, unless the text is a data field.
 *
 * @param {string} text page or snippet
 * @param {string} ean barcode
 * @param {boolean} [bare] the text is a data field (a gtin in JSON-LD), no label needed
 * @returns {boolean} the text shows the barcode
 */
function hasCode(text, ean, bare = false) {
    const plainEan = ean.replace(/^0+/, '');
    const forms = [ean, ean.padStart(13, '0'), plainEan].filter(v => v.length >= 8);
    if (!forms.some(v => new RegExp(`(?<!\\d)${v}(?!\\d)`).test(text))) {
        return false;
    }
    if (bare || plainEan.length >= 12) {
        return true;
    }
    return new RegExp(
        `(?:ean|gtin\\d*|upc|barcode|strichcode|art\\.?-?nr\\.?|artikelnummer)[^\\d]{0,40}0*${plainEan}(?!\\d)`,
        'i',
    ).test(text);
}

/**
 * Titles of protection, error and start pages: bot checks answer with a normal 200 page that has a title, too.
 *
 * @param {string} title page title or product name
 * @returns {boolean} not the name of a product
 */
function junkTitle(title) {
    return /(client challenge|just a moment|attention required|access denied|are you (a )?human|are you a robot|robot check|captcha|verify(ing)? you|pardon our interruption|request blocked|security check|zugriff (verweigert|blockiert)|bot.?(schutz|protection)|nicht gefunden|page not found|^\s*(404|403|error|fehler)\b|^\s*(home|startseite)\s*$)/i.test(
        String(title || ''),
    );
}

/**
 * What a shop page says about the product, or null when it is not about this barcode.
 *
 * @param {string} html page
 * @param {string} url address of the page
 * @param {string} ean barcode
 * @param {boolean} [loose] accept a page that does not show the barcode
 * @returns {{name: string, brand: string, packageSize: string, images: string[], source: string, url: string} | null} page data
 */
function pageInfo(html, url, ean, loose = false) {
    if (!loose && !hasCode(html, ean)) {
        return null;
    }
    const nodes = [];
    for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
            collectProducts(JSON.parse(m[1]), nodes);
        } catch {
            // broken JSON-LD
        }
    }
    // with several products on a page only the one with this barcode counts, never just the first
    const named = nodes.filter(n => n.name);
    const own = named.find(n =>
        ['gtin', 'gtin8', 'gtin12', 'gtin13', 'gtin14'].some(k => n[k] && hasCode(String(n[k]), ean, true)),
    );
    const p = own || (named.length === 1 ? named[0] : {});
    const brandRaw = p.brand && typeof p.brand === 'object' ? p.brand.name : p.brand;
    const title = p.name || meta(html, 'og:title') || decode((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [])[1]);
    if (!title || junkTitle(title)) {
        return null;
    }
    const base = new URL(url);
    const cat = pharmacyCat(html, url);
    const images = [...imageList(p.image), meta(html, 'og:image')]
        .filter(Boolean)
        .map(i => {
            try {
                return new URL(decode(i), base).href;
            } catch {
                return '';
            }
        })
        .filter(i => /^https:\/\//i.test(i) && !/\.(svg|gif)(\?|$)/i.test(i));
    if (!images.length) {
        // shop apps (dm, for one) keep the pictures in script data instead of meta tags
        const raw = html.replace(/\\u002F|\\\//gi, '/');
        for (const m of raw.matchAll(/https:\/\/[^"'\s\\<>()]+?\.(?:jpe?g|png|webp)(?:\?[^"'\s\\<>()]*)?/gi)) {
            if (/product/i.test(m[0]) && !/logo|icon|sprite|banner|placeholder/i.test(m[0])) {
                images.push(m[0]);
            }
        }
        // Rossmann: /media-neu/567/MAM_56760592/MAM_56760592_SHOP_IMAGE_1.4.png?width=550&height=550&..., the small thumbnails left out
        for (const m of raw.matchAll(
            /(?:https:\/\/www\.rossmann\.de)?\/media-neu\/[^"'\s\\<>()]+?SHOP_IMAGE[^"'\s\\<>()]*/g,
        )) {
            if (/width=(?:[3-9]\d\d|\d{4})/.test(m[0])) {
                images.push(new URL(m[0], base).href);
            }
        }
        // dm: https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_440,w_500/v123/assets/pas/images/<id>/<name>, no file ending,
        // the same picture in several sizes; the first is taken per picture
        const seen = new Set();
        for (const m of raw.matchAll(/https:\/\/products\.dm-static\.com\/images\/[^/"'\s\\<>()]+\/[^"'\s\\<>()]+/g)) {
            const key = m[0].split('/').slice(-2).join('/');
            if (!seen.has(key) && /\/assets\//.test(m[0]) && !/logo|icon|brand/i.test(m[0])) {
                seen.add(key);
                images.push(m[0]);
            }
        }
    }
    return {
        ...cleanTitle(title, String(brandRaw || '')),
        images: [...new Set(images)].slice(0, 6),
        lang: pageLang(html, base),
        source: base.hostname.replace(/^www\./, ''),
        url: base.href,
        ...(cat.tags ? { cat } : {}),
    };
}

/**
 * @param {typeof fetch} doFetch fetch
 * @param {string} url address
 * @param {number} ms timeout
 * @param {string} [form] form data, makes it a post
 * @param {(why: string) => void} [note] told why there is no page
 * @returns {Promise<string>} page text, empty when it could not be read
 */
async function getHtml(doFetch, url, ms, form = '', note = () => {}) {
    try {
        const headers = {
            'User-Agent': UA,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.7',
        };
        if (form) {
            // DuckDuckGo answers a form post like the browser does and blocks a plain request much sooner
            const o = new URL(url).origin;
            Object.assign(headers, {
                'Content-Type': 'application/x-www-form-urlencoded',
                Origin: o,
                Referer: `${o}/`,
            });
        }
        const r = await doFetch(url, {
            method: form ? 'POST' : 'GET',
            body: form || undefined,
            headers,
            timeoutMs: ms,
            redirect: 'follow',
        });
        if (!r.ok || !/html/i.test(r.headers?.get?.('content-type') || 'text/html')) {
            note(r.ok ? 'no page' : `HTTP ${r.status}`);
            return '';
        }
        return (await r.text()).slice(0, MAX_HTML);
    } catch (e) {
        note(e?.name === 'TimeoutError' ? 'timeout' : String(e?.message || e).slice(0, 60));
        return '';
    }
}

/**
 * Product name from the answer page of ean-search.org ("Product name for EAN 4066447276800: Balea Bio-Körperöl, 100 ml").
 *
 * @param {string} html page
 * @param {string} ean barcode
 * @returns {string} name, empty when the page does not know the barcode
 */
function eanSiteName(html, ean) {
    const tail = `${ean}\\s*:\\s*(?:<[^>]*>\\s*)*`;
    const m =
        new RegExp(`${tail}<a\\b[^>]*>([^<]{3,200})</a>`, 'i').exec(html) ||
        new RegExp(`${tail}([^<(]{3,200})`, 'i').exec(html);
    let name = m ? decode(m[1]) : '';
    if (!name) {
        // fall back to the page title ("EAN 4066447276800 - Balea Bio-Körperöl")
        const t = decode((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [])[1]);
        if (hasCode(t, ean)) {
            name = t
                .replace(ean, '')
                .replace(/\b(ean|gtin|barcode|ean-search(\.org)?|search|suche)\b/gi, '')
                .replace(/^[\s\-–—|:]+|[\s\-–—|:]+$/g, '')
                .trim();
        }
    }
    return /^(not found|nicht gefunden|unknown)/i.test(name) ? '' : name;
}

/**
 * @param {typeof fetch} doFetch fetch
 * @param {string} url address
 * @param {number} ms timeout
 * @param {string} [referer] page the request comes from
 * @param {(why: string) => void} [note] told why there is no answer
 * @returns {Promise<unknown>} parsed JSON, null when it could not be read
 */
async function getJson(doFetch, url, ms, referer = '', note = () => {}) {
    try {
        const r = await doFetch(url, {
            headers: { 'User-Agent': UA, Accept: 'application/json', ...(referer ? { Referer: referer } : {}) },
            timeoutMs: ms,
        });
        if (!r.ok) {
            note(r.status ? `HTTP ${r.status}` : 'no answer');
            return null;
        }
        return await r.json();
    } catch (e) {
        note(e?.name === 'TimeoutError' ? 'timeout' : 'no answer');
        return null;
    }
}

/**
 * Name from the official ean-search.org interface (needs a free token).
 *
 * @param {string} ean barcode
 * @param {string} token access token
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @returns {Promise<string>} name, empty when unknown
 */
async function eanApiName(ean, token, doFetch, ms) {
    const j = await getJson(
        doFetch,
        `https://api.ean-search.org/api?token=${encodeURIComponent(token)}&op=barcode-lookup&ean=${ean}&format=json&language=1`,
        ms,
    );
    const p = Array.isArray(j) ? j[0] : j && Array.isArray(j.product) ? j.product[0] : null;
    return p && typeof p.name === 'string' ? decode(p.name) : '';
}

const SUCHE_LIMIT = 50; // ean-suche.net allows 60 requests per hour and address
const sucheCalls = [];
let sucheBlockedUntil = 0;

/** Forget the request count and a pause of ean-suche.net (tests). */
function resetSuche() {
    sucheCalls.length = 0;
    sucheBlockedUntil = 0;
}

/**
 * Picture addresses in an answer of ean-suche.net: every text field whose key speaks of a picture.
 *
 * @param {unknown} node parsed answer
 * @param {string[]} [out] collected addresses
 * @returns {string[]} https addresses
 */
function sucheImages(node, out = []) {
    if (Array.isArray(node)) {
        node.forEach(n => sucheImages(n, out));
    } else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
            if (typeof v === 'string' && /(image|img|bild|foto|photo|picture|thumb)/i.test(k)) {
                try {
                    const u = new URL(decode(v), 'https://ean-suche.net/');
                    if (u.protocol === 'https:' && !/\.(svg|gif)$/i.test(u.pathname)) {
                        out.push(u.href);
                    }
                } catch {
                    // not an address
                }
            } else if (v && typeof v === 'object') {
                sucheImages(v, out);
            }
        }
    }
    return out;
}

/**
 * Product from the free interface of ean-suche.net (no key, 60 requests per hour, link to the source required).
 * The page of a product shows a picture; it is taken from the answer, or else from the page.
 *
 * @param {string} ean barcode
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @returns {Promise<{name: string, images: string[]}>} name and pictures, empty when unknown or when the limit is used up
 */
async function eanSucheProduct(ean, doFetch, ms) {
    const none = { name: '', images: [] };
    const now = Date.now();
    while (sucheCalls.length && now - sucheCalls[0] > 3600000) {
        sucheCalls.shift();
    }
    if (now < sucheBlockedUntil || sucheCalls.length >= SUCHE_LIMIT) {
        return none;
    }
    sucheCalls.push(now);
    try {
        const r = await doFetch(`https://ean-suche.net/api/produkt/${ean}`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            timeoutMs: ms,
        });
        if (r.status === 429) {
            sucheBlockedUntil = now + 3600000;
            return none;
        }
        const j = r.ok ? await r.json() : null;
        if (!j || !j.found || typeof j.product_name !== 'string') {
            return none;
        }
        const name = decode(j.product_name);
        let images = [...new Set(sucheImages(j))];
        if (!images.length && sucheCalls.length < SUCHE_LIMIT) {
            // the page of the product shows the picture, in the shop picture tag or as og:image
            const words = [...new Set(plain(name).match(/[a-z0-9]{4,}/g) || [])].slice(0, 5);
            for (const path of ['ean', 'produkt']) {
                const url = `https://ean-suche.net/${path}/${ean}`;
                const html = await getHtml(doFetch, url, ms);
                if (!html) {
                    continue;
                }
                const found = [meta(html, 'og:image')];
                for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
                    const src = (/\bsrc=["']([^"']+)["']/i.exec(m[0]) || [])[1];
                    const alt = plain(decode((/\balt=["']([^"']*)["']/i.exec(m[0]) || [])[1] || ''));
                    if (src && words.filter(w => alt.includes(w)).length >= Math.min(2, words.length)) {
                        found.push(src);
                    }
                }
                images = found
                    .filter(Boolean)
                    .map(i => {
                        try {
                            return new URL(decode(i), url).href;
                        } catch {
                            return '';
                        }
                    })
                    .filter(i => /^https:\/\//i.test(i) && !/\.(svg|gif)(\?|$)/i.test(i) && !/logo|icon/i.test(i));
                if (images.length) {
                    break;
                }
            }
        }
        return { name, images: [...new Set(images)].slice(0, 4) };
    } catch {
        return none;
    }
}

/**
 * @param {string} ean barcode
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @returns {Promise<string>} name from ean-suche.net, empty when unknown
 */
async function eanSucheName(ean, doFetch, ms) {
    return (await eanSucheProduct(ean, doFetch, ms)).name;
}

/**
 * Name from Open EAN / GTIN database (opengtindb.org, free key needed). It answers with plain lines "key=value".
 *
 * @param {string} ean barcode
 * @param {string} key free query id of opengtindb.org
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @returns {Promise<{name: string, brand: string}>} name and brand, empty when unknown
 */
async function openGtinName(ean, key, doFetch, ms) {
    try {
        const r = await doFetch(`https://opengtindb.org/?ean=${ean}&cmd=query&queryid=${encodeURIComponent(key)}`, {
            headers: { 'User-Agent': UA },
            timeoutMs: ms,
        });
        if (!r.ok) {
            return { name: '', brand: '' };
        }
        const f = {};
        for (const line of String(await r.text()).split(/\r?\n/)) {
            const m = /^([a-z_]+)=(.*)$/.exec(line.trim());
            if (m) {
                f[m[1]] = m[2].trim();
            }
        }
        const name = f.error === '0' ? f.detailname || f.name || '' : '';
        return { name: decode(name), brand: decode(name ? f.vendor : '') };
    } catch {
        return { name: '', brand: '' };
    }
}

/**
 * Splits a line of comma separated values, a value in quotes may hold commas.
 *
 * @param {string} line the line
 * @param {string} [d] separator
 * @returns {string[]} values
 */
function csv(line, d = ',') {
    const q = d.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    return [...line.matchAll(new RegExp(`\\s*(?:"((?:[^"\\\\]|\\\\.)*)"|([^${q}]*))\\s*(?:${q}|$)`, 'g'))]
        .slice(0, -1)
        .map(m => (m[1] !== undefined ? m[1].replace(/\\(.)/g, '$1') : m[2].trim()));
}

/**
 * The first compact table of a TOON text ("products[2]{gtin,name}:" or with | as separator) with its rows.
 *
 * @param {string} text TOON text
 * @returns {null | {head: string[], rows: string[], delim: string}} column names, row lines and the separator
 */
function toonTable(text) {
    const m = /^[ \t]*[\w.-]*\[\d+[|\t]?\]\{([^}\n]+)\}:[ \t]*\n((?:[ \t]+.*(?:\n|$))+)/m.exec(text);
    if (!m) {
        return null;
    }
    const delim =
        !m[1].includes(',') && m[1].includes('|') ? '|' : !m[1].includes(',') && m[1].includes('\t') ? '\t' : ',';
    return {
        head: m[1].split(delim).map(h => h.trim().replace(/^"|"$/g, '')),
        rows: m[2].split('\n').filter(l => l.trim()),
        delim,
    };
}

/**
 * Product out of the answer of the dm server. It answers JSON or the compact TOON text, so both are read, without
 * relying on field names more than needed: the product that holds the barcode, its name and brand, every
 * picture address of products.dm-static.com.
 *
 * @param {unknown} data the structured answer, if there is one
 * @param {string} text the text of the answer
 * @param {string} ean barcode
 * @param {boolean} [loose] take the product although its data does not show the barcode (found by dm's own search)
 * @returns {null | {title: string, brand: string, images: string[]}} product, null when it is not in the answer
 */
function dmFromAnswer(data, text, ean, loose = false) {
    if (!loose && !text.includes(ean) && !JSON.stringify(data || '').includes(ean)) {
        return null;
    }
    let obj = data;
    if (!obj) {
        try {
            obj = JSON.parse(text);
        } catch {
            obj = null;
        }
    }
    // dm hands the answer in a field "result" that holds JSON or the TOON text
    let body = text;
    if (obj && typeof obj.result === 'string') {
        body = obj.result;
        try {
            obj = JSON.parse(body);
        } catch {
            obj = null;
        }
    }
    let title = '';
    let brand = '';
    let cellImage = '';
    let gtin = 0;
    let cats = [];
    let fields = [];
    const extra = { type: '', size: '', food: false };
    const CAT_KEY = /categor|breadcrumb|classif|taxonom|navigation|productgroup|warengruppe|sortiment/i;
    if (obj) {
        const list = [];
        const find = v => {
            if (Array.isArray(v)) {
                v.forEach(find);
            } else if (v && typeof v === 'object') {
                if (
                    !Array.isArray(Object.values(v)[0]) &&
                    (loose || JSON.stringify(v).includes(ean)) &&
                    (v.name || v.title)
                ) {
                    list.push(v);
                }
                Object.values(v).forEach(find);
            }
        };
        find(obj);
        const own = list.sort((x, y) => JSON.stringify(x).length - JSON.stringify(y).length)[0];
        if (own) {
            title = String(own.title || own.name || '');
            gtin = Number(own.gtin) || 0;
            brand = String(own.brandName || (own.brand && own.brand.name) || own.brand || '');
            const key = Object.keys(own).find(k => CAT_KEY.test(k) && own[k]);
            cats = key ? catSegments(own[key]) : [];
            fields = Object.keys(own);
            extra.type = String(own.productType || '');
            extra.size = String(own.volume || own.weight || '');
            extra.food = !!String(own.foodIngredients || '').trim();
        }
    } else {
        // TOON: a table "products[1]{gtin,name,brand}:" with the rows below, or "name: value" lines
        const table = toonTable(body);
        if (table) {
            const row = table.rows.find(l => (loose ? l.trim() : l.includes(ean)));
            if (row) {
                const cells = csv(row.trim(), table.delim);
                const at = key => cells[table.head.findIndex(h => h.toLowerCase() === key)] || '';
                // a row of a barcode dm does not know says found=false
                if (at('found').toLowerCase() !== 'false') {
                    title = at('productname') || at('title') || at('name');
                    brand = at('brandname') || at('brand');
                    cellImage = at('image');
                    gtin = Number(at('gtin')) || 0;
                    const at2 = table.head.findIndex((h, i) => CAT_KEY.test(h) && cells[i]);
                    cats = at2 >= 0 ? catSegments(cells[at2]) : [];
                    fields = table.head;
                    extra.type = at('producttype');
                    extra.size = at('volume') || at('weight');
                    extra.food = !!at('foodingredients').trim();
                }
            }
        }
        if (!title && !table) {
            const line = key =>
                (new RegExp(`^[ \\t-]*${key}[ \\t]*:[ \\t]*"?([^"\\n]+)"?[ \\t]*$`, 'mi').exec(body) || [])[1] || '';
            title = line('(?:title|name|productName)');
            brand = line('(?:brandName|brand)');
            cats = catSegments(line('(?:[a-z]*categor[a-z]*|breadcrumbs?)'));
        }
    }
    if (!title) {
        return null;
    }
    const images = [
        ...`${text} ${body} ${data ? JSON.stringify(data) : ''}`.matchAll(
            /https:\/\/products\.dm-static\.com\/images\/[^\s"'<>\\|]+/g,
        ),
    ]
        .map(m => m[0])
        .concat(/^https:\/\/[^\s"'<>\\|]+$/i.test(cellImage) ? [cellImage] : [])
        .map(u => u.replace(/\{width\}|%7Bwidth%7D/gi, '600').replace(/\{height\}|%7Bheight%7D/gi, '600'))
        .filter(u => !/logo|brand/i.test(u));
    return {
        title: decode(title),
        brand: decode(brand),
        categories: cats,
        ...(gtin ? { gtin } : {}),
        ...(extra.type ? { type: decode(extra.type).slice(0, 60) } : {}),
        ...(extra.size ? { size: extra.size.slice(0, 30) } : {}),
        ...(extra.food ? { food: true } : {}),
        fields: fields.map(f => String(f).slice(0, 24)).slice(0, 16),
        images: [...new Set(images)].slice(0, 4),
    };
}

/**
 * Product from the official MCP server of dm (https://mcp.dm.de/mcp, free, no key). MCP is JSON-RPC over HTTP:
 * initialize, tell it so, then call the tool getProductDetails with the barcode.
 *
 * @param {string} ean barcode
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @param {(msg: string) => void} [note] told what went wrong, for the trace
 * @param {'gtins' | 'dans'} [by] what the number is: a barcode or the article number of dm
 * @returns {Promise<null | {title: string, brand: string, images: string[]}>} product, null when dm does not know the number
 */
async function dmMcp(ean, doFetch, ms, note = () => {}, by = 'gtins') {
    const url = 'https://mcp.dm.de/mcp';
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'User-Agent': UA,
    };
    const post = async (body, extra = {}) =>
        doFetch(url, {
            method: 'POST',
            headers: { ...headers, ...extra },
            body: JSON.stringify(body),
            timeoutMs: ms,
        });
    // the answer is JSON or an event stream with the JSON in a data line
    const read = async r => {
        const text = await r.text();
        if (/event-stream/i.test(r.headers?.get?.('content-type') || '')) {
            const datas = [...text.matchAll(/^data:\s*(.+)$/gm)].map(m => m[1]);
            return JSON.parse(datas[datas.length - 1] || 'null');
        }
        return JSON.parse(text);
    };
    try {
        const init = await post({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2025-06-18',
                capabilities: {},
                clientInfo: { name: 'ioBroker.shelfmate', version: '1.0' },
            },
        });
        if (!init.ok) {
            note(`dm: HTTP ${init.status}`);
            return null;
        }
        const sid = init.headers?.get?.('mcp-session-id');
        const hello = await read(init);
        const extra = {
            'MCP-Protocol-Version': hello?.result?.protocolVersion || '2025-06-18',
            ...(sid ? { 'Mcp-Session-Id': sid } : {}),
        };
        await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, extra).catch(() => null);
        let product = null;
        // dm wants the barcodes as numbers (a text is refused: "string found, integer expected"), which also
        // makes a short barcode (EAN-8, UPC) the same as its padded form
        let last = '';
        const ask = async value => {
            const call = await post(
                {
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'tools/call',
                    params: { name: 'getProductDetails', arguments: { [by]: [value] } },
                },
                extra,
            );
            if (!call.ok) {
                note(`dm: HTTP ${call.status}`);
                return null;
            }
            const res = (await read(call))?.result;
            last = (Array.isArray(res?.content) ? res.content : []).map(c => String(c.text || '')).join('\n');
            return dmFromAnswer(res?.structuredContent, last, ean);
        };
        product = await ask(Number(ean));
        if (!product && by === 'dans' && /expected|invalid|schema|type/i.test(last)) {
            // the article numbers may be wanted as text
            product = await ask(String(ean));
        }
        if (!product && last.includes(ean) && !/\bfound\b/i.test(last)) {
            // an answer that names the barcode but has no "found" column and cannot be read
            note('dm: answer not understood');
        }
        return product;
    } catch (e) {
        note(`dm: ${e.message}`);
        return null;
    }
}

/**
 * One product of the product search of dm, in the form ShelfMate needs.
 *
 * @param {Record<string, unknown>} own the hit
 * @param {Record<string, unknown>[]} list all hits of the search
 * @param {Record<string, unknown>} j the answer
 * @returns {{title: string, brand: string, categories: string[], images: string[], dan: number, gtin: number}} product
 */
function dmShape(own, list, j) {
    const names = [];
    // the facet lists the categories of all hits, so it only counts when this product is the only one
    const facet = list.length === 1 && Array.isArray(j.facets) ? j.facets.find(f => f.key === 'categoryNames') : null;
    (facet?.values || []).forEach(v => names.push(String(v.name || '')));
    const tracked = own.tileData?.trackingData?.categories;
    (Array.isArray(tracked) ? tracked : []).forEach(v => names.push(String(v)));
    const images = (Array.isArray(own.tileData?.images) ? own.tileData.images : [])
        .filter(i => i && !i.isAiGenerated && /^https:\/\//.test(String(i.tileSrc || '')))
        .map(i => String(i.tileSrc))
        .slice(0, 4);
    return {
        title: String(own.title || own.tileData?.title?.tileHeadline || ''),
        brand: String(own.brandName || own.tileData?.brand?.name || ''),
        // "Babyshampoo, Badezusätze & Co." is two names, "Körper-, Dusch- & Badpflege" is one
        categories: catSegments(names.flatMap(n => n.split(/(?<!-),\s+/))),
        images,
        dan: Number(own.dan || own.tileData?.dan) || 0,
        gtin: Number(own.gtin || own.tileData?.gtin) || 0,
    };
}

/**
 * The product search of dm itself: it knows barcodes the MCP server does not, and it names the categories.
 *
 * @param {string} ean barcode
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @param {(m: string) => void} [note] gets the reason when nothing is found
 * @param {{country?: string, query?: string, key?: 'gtin' | 'dan'}} [opt] other country, other search words, and which number the hit has to carry
 * @returns {Promise<null | {title: string, brand: string, categories: string[], images: string[], dan: number, gtin: number}>} product with exactly this number
 */
async function dmSearch(ean, doFetch, ms, note = () => {}, opt = {}) {
    const country = opt.country || 'de';
    const key = opt.key || 'gtin';
    let why = 'no answer';
    const j = await getJson(
        doFetch,
        `https://product-search.services.dmtech.com/${country}/search?query=${opt.query || ean}&searchType=product`,
        ms,
        '',
        w => (why = w),
    );
    const list = Array.isArray(j?.products) ? j.products : [];
    const own = list.find(x => Number(x?.[key] ?? x?.tileData?.[key]) === Number(opt.query || ean));
    if (!own) {
        note(
            j
                ? `dm search${country === 'de' ? '' : ` ${country}`}: ${list.length} hits, none with the ${key === 'dan' ? 'article' : 'barcode'}`
                : `dm search${country === 'de' ? '' : ` ${country}`}: ${why}`,
        );
        return null;
    }
    return dmShape(own, list, j);
}

/**
 * The categories a shop page lists as breadcrumb trail (schema.org BreadcrumbList), from general to specific.
 *
 * @param {string} html page
 * @returns {string[]} names
 */
function breadcrumbs(html) {
    const out = [];
    const walk = n => {
        if (Array.isArray(n)) {
            n.forEach(walk);
        } else if (n && typeof n === 'object') {
            if ([].concat(n['@type'] || []).includes('BreadcrumbList') && Array.isArray(n.itemListElement)) {
                [...n.itemListElement]
                    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
                    .forEach(e => out.push(String(e.name || e.item?.name || '')));
            }
            walk(n['@graph']);
        }
    };
    for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
            walk(JSON.parse(m[1]));
        } catch {
            // broken JSON-LD
        }
    }
    return out.filter(Boolean);
}

/**
 * The pharmacy shop Shop Apotheke asked for the barcode: its search leads to the article (or straight to its page).
 * A page that shows the barcode counts for sure, otherwise only a search with one single hit does.
 *
 * @param {string} ean barcode
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @param {(msg: string) => void} note told what happened, for the trace
 * @returns {Promise<null | {name: string, brand: string, packageSize: string, images: string[], url: string, cat?: {tags?: string[], category?: string}, sure: boolean}>} article, null when the shop knows none
 */
async function apothekeFind(ean, doFetch, ms, note) {
    const base = 'https://www.shop-apotheke.com';
    const searchUrl = `${base}/search.htm?i=1&q=${encodeURIComponent(ean)}`;
    const html = await getHtml(doFetch, searchUrl, ms, '', w => note(`Shop Apotheke: ${w}`));
    if (!html) {
        return null;
    }
    const link = /^(?:https:\/\/www\.shop-apotheke\.com)?(\/[a-z0-9-]+\/[a-z]?\d{6,9}\/[^"'?#\s]+\.htm)$/i;
    const urls = [];
    // the search of a barcode may lead straight to the article
    const canon = /<link[^>]+rel=["']canonical["'][^>]*?href=["']([^"']+)["']/i.exec(html);
    if (canon && link.test(canon[1])) {
        urls.push(base + canon[1].replace(/^https:\/\/www\.shop-apotheke\.com/i, ''));
    }
    for (const m of html.matchAll(/href=["']([^"']+\.htm)(?:[?#][^"']*)?["']/gi)) {
        const u = decode(m[1]);
        if (link.test(u) && !urls.includes(base + u.replace(/^https:\/\/www\.shop-apotheke\.com/i, ''))) {
            urls.push(base + u.replace(/^https:\/\/www\.shop-apotheke\.com/i, ''));
        }
    }
    note(`Shop Apotheke: ${urls.length} article links`);
    for (const url of urls.slice(0, 3)) {
        const page = url === urls[0] && canon && link.test(canon[1]) ? html : await getHtml(doFetch, url, ms);
        const info = page ? pageInfo(page, url, ean, true) : null;
        if (!info?.name) {
            continue;
        }
        const sure = hasCode(page, ean);
        if (sure || urls.length === 1) {
            note(`Shop Apotheke: article found${sure ? ' (barcode on the page)' : ' (single hit)'}`);
            return { ...info, sure };
        }
    }
    return null;
}

/**
 * The price comparison vitality-fit.de has an open product API that knows barcodes and PZN (pharmacy number). It names
 * the article, the brand, the package size and a picture, but has no categories. Only a hit that lists exactly this
 * number counts.
 *
 * @param {string} code barcode or PZN
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @param {(msg: string) => void} note told what happened, for the trace
 * @returns {Promise<null | {name: string, brand: string, packageSize: string, images: string[], url: string}>} article, null when the shop knows none
 */
async function vitalityFind(code, doFetch, ms, note) {
    let list = [];
    try {
        const r = await doFetch(`https://vitality-fit.de/api/v1/products?q=${encodeURIComponent(code)}&limit=5`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            timeoutMs: ms,
        });
        if (!r.ok) {
            note(`vitality-fit: HTTP ${r.status || '?'}`);
            return null;
        }
        const j = JSON.parse(await r.text());
        list = Array.isArray(j?.products) ? j.products : [];
    } catch (e) {
        note(`vitality-fit: ${e?.name === 'TimeoutError' ? 'timeout' : 'no answer'}`);
        return null;
    }
    const num = String(code).replace(/^0+/, '');
    const same = k => /^(?:ean|pzn)_(\d+)$/.exec(String(k || ''))?.[1].replace(/^0+/, '') === num;
    for (const p of list) {
        const pack = same(p.matched_pack?.identity_key)
            ? p.matched_pack
            : (p.pack_sizes || []).find(x => same(x.identity_key));
        if (!pack || !p.title) {
            continue;
        }
        note('vitality-fit: article found');
        const named = cleanTitle(String(p.title), String(p.brand || ''));
        return {
            ...named,
            packageSize: /\d/.test(pack.label || '') && pack.label.length < 20 ? String(pack.label) : named.packageSize,
            images: /^https:\/\//i.test(p.image_url || '') ? [p.image_url] : [],
            url: /^https:\/\//i.test(p.url || '') ? p.url : 'https://vitality-fit.de/',
        };
    }
    note(`vitality-fit: ${list.length} hits, none with this number`);
    return null;
}

/**
 * dm sells the same article in several countries under the same article number (DAN), but the barcode changes now and
 * then: a product that is gone from the German catalogue under its old barcode may still be listed under it in the
 * shops of other countries. From there the article number leads to the German page, and to its new barcode.
 *
 * @param {string} ean old barcode
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @param {(m: string) => void} [note] told what happened, for the trace
 * @returns {Promise<null | {title: string, brand: string, categories: string[], images: string[], dan: number, gtin: number, via: string}>} the article as dm Germany or Austria lists it now
 */
async function dmOldBarcode(ean, doFetch, ms, note = () => {}) {
    const countries = ['at', 'sk', 'hr', 'cz', 'hu', 'si', 'bg', 'ro', 'rs', 'ba'];
    const hits = await Promise.all(countries.map(c => dmSearch(ean, doFetch, ms, () => {}, { country: c })));
    const at = hits.findIndex(h => h?.dan);
    if (at < 0) {
        note('dm other countries: none with the barcode');
        return null;
    }
    const dan = hits[at].dan;
    // the official server takes the article number as well
    const official = await dmMcp(String(dan), doFetch, ms, note, 'dans');
    if (official?.title) {
        let categories = official.categories;
        if (!categories.length && official.gtin) {
            categories = (await dmSearch(String(official.gtin), doFetch, ms, () => {}))?.categories || [];
        }
        note(`dm: article ${dan} found in ${countries[at]}, listed by dm with barcode ${official.gtin || '?'}`);
        return { ...official, categories, dan, gtin: official.gtin || 0, via: countries[at] };
    }
    for (const home of ['de', 'at']) {
        const now = await dmSearch(String(dan), doFetch, ms, note, {
            country: home,
            key: 'dan',
            query: String(dan),
        });
        if (now) {
            note(`dm: article ${dan} found in ${countries[at]}, listed in ${home} with barcode ${now.gtin}`);
            return { ...now, via: countries[at] };
        }
    }
    // the product page of the article: its address works with the article number alone
    for (const base of ['https://www.dm.de', 'https://www.dm.at']) {
        const url = `${base}/p/d/${dan}`;
        const tag = base.slice(-2);
        const html = await getHtml(doFetch, url, ms, '', w => note(`dm page ${tag}: ${w}`));
        if (!html) {
            continue;
        }
        const info = new RegExp(`(?<!\\d)${dan}(?!\\d)`).test(html) ? pageInfo(html, url, '', true) : null;
        if (info?.name) {
            note(`dm: article ${dan} found in ${countries[at]}, taken from the page of dm.${tag}`);
            return {
                title: info.name,
                brand: info.brand,
                categories: catSegments(breadcrumbs(html)),
                images: info.images.slice(0, 4),
                dan,
                gtin: 0,
                via: countries[at],
            };
        }
        const title = decode((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [])[1]).slice(0, 40);
        note(`dm page ${tag}: no product (${html.length} bytes, title "${title}")`);
    }
    note(`dm: article ${dan} found in ${countries[at]}, not in de or at`);
    return null;
}

/**
 * Categories of a product from the product search of dm itself (the MCP answer has none).
 *
 * @param {string} ean barcode
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @param {(m: string) => void} [note] gets the reason when nothing is found
 * @param {number} [dan] article number when it is known already
 * @param {boolean} [searched] the product search was asked already and named no category
 * @returns {Promise<string[]>} category names from general to specific, empty when unknown
 */
async function dmCategories(ean, doFetch, ms, note = () => {}, dan = 0, searched = false) {
    const found = searched ? null : await dmSearch(ean, doFetch, ms, note);
    if (found?.categories?.length) {
        return found.categories;
    }
    // the search names no category: the product page of the article lists them as breadcrumb trail
    const number = found?.dan || dan;
    if (!number) {
        return [];
    }
    const html = await getHtml(doFetch, `https://www.dm.de/p/d/${number}`, ms, '', w => note(`dm page: ${w}`));
    if (!html) {
        return [];
    }
    const names = catSegments(breadcrumbs(html));
    if (!names.length) {
        note(`dm page: no categories (${html.length} bytes)`);
    }
    return names;
}

/**
 * @param {string} text any text
 * @returns {string} lower case without accents
 */
function plain(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/ß/g, 'ss')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Pictures of the DuckDuckGo image search (the page hands out a token first, then the result list).
 *
 * @param {string} query search words
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @param {{ddg: string, bing: string}} [loc] search settings of the language of the app
 * @returns {Promise<{url: string, text: string}[]>} pictures with the text around them
 */
async function duckImages(query, doFetch, ms, loc = localeOf('de')) {
    const page = await getHtml(
        doFetch,
        `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
        ms,
    );
    const vqd = (/vqd=["']?([\d-]+)/.exec(page) || [])[1];
    if (!vqd) {
        return [];
    }
    const j = await getJson(
        doFetch,
        `https://duckduckgo.com/i.js?l=${loc.ddg}&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,,,&p=1`,
        ms,
        'https://duckduckgo.com/',
    );
    return (j && Array.isArray(j.results) ? j.results : [])
        .filter(r => r && typeof r.image === 'string')
        .map(r => ({ url: r.image, text: `${r.title || ''} ${r.url || ''} ${r.source || ''}` }));
}

/**
 * Pictures of the Bing image search.
 *
 * @param {string} query search words
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @param {{ddg: string, bing: string}} [loc] search settings of the language of the app
 * @returns {Promise<{url: string, text: string}[]>} pictures with the text around them
 */
async function bingImages(query, doFetch, ms, loc = localeOf('de')) {
    const field = (blob, key) => {
        const m = new RegExp(`${key}&quot;:&quot;(.*?)&quot;(?:,|\\})`).exec(blob);
        return m ? m[1] : '';
    };
    const parse = html =>
        [...html.matchAll(/\{[^{}]*?murl&quot;[^{}]*\}/g)].map(m => ({
            url: field(m[0], 'murl').replace(/\\\//g, '/'),
            text: `${field(m[0], 't')} ${field(m[0], 'desc')} ${field(m[0], 'purl')}`,
        }));
    const q = encodeURIComponent(query);
    // the list the page itself loads for its picture grid: whole result list, no advertisements; the page is the fallback
    const list = parse(
        await getHtml(doFetch, `https://www.bing.com/images/async?q=${q}&first=1&count=35&adlt=strict&${loc.bing}`, ms),
    );
    return list.length
        ? list
        : parse(
              await getHtml(
                  doFetch,
                  `https://www.bing.com/images/search?q=${q}&form=HDRSC2&first=1&adlt=strict&${loc.bing}`,
                  ms,
              ),
          );
}

/**
 * The part of a long shop title that identifies the product ("Autan Protection Plus Zeckenschutz Insektenschutz, zum
 * Schutz vor Zecken und heimischen Mücken, Travel Essentials, (1er Pack)" becomes "Autan Protection Plus
 * Zeckenschutz Insektenschutz"). Image searches find nothing for a whole sales text.
 *
 * @param {string} name product name
 * @returns {string} short search words, at most seven
 */
function searchName(name) {
    const parts = String(name || '')
        .replace(/\([^)]*\)/g, ' ')
        .split(/\s*(?:,|\s[-–—|]\s)\s*/)
        .map(x => x.trim())
        .filter(Boolean);
    let words = (parts[0] || '').split(/\s+/);
    if (words.length < 3 && parts[1]) {
        words = words.concat(parts[1].split(/\s+/));
    }
    return words.slice(0, 7).join(' ');
}

/**
 * Pictures for a product name from the image search of DuckDuckGo and Bing. Only pictures whose title,
 * page or file name hold at least two words of the product name are kept, as the search otherwise
 * drifts to unrelated pictures.
 *
 * @param {string} longName product name, shortened for the search
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @param {string} [size] package size, only used for the loose search
 * @param {(engine: string, found: number, kept: number) => void} [note] told how many pictures each search had and how many were kept
 * @param {string} [ean] barcode, searched last when the name finds nothing
 * @param {{ddg: string, bing: string}} [loc] search settings of the language of the app
 * @returns {Promise<{url: string, source: string}[]>} pictures with the site they come from
 */
async function imageSearch(longName, doFetch, ms, size = '', note = () => {}, ean = '', loc = localeOf('de')) {
    const name = searchName(longName) || longName;
    const words = [...new Set(plain(name).match(/[a-z0-9]{4,}/g) || [])].slice(0, 5);
    const need = Math.min(2, words.length);
    const searches = [
        ['DuckDuckGo', () => duckImages(name, doFetch, ms, loc)],
        ['Bing', () => bingImages(`"${name}"`, doFetch, ms, loc)],
        ['Bing loose', () => bingImages(`${name} ${size}`.trim(), doFetch, ms, loc)],
        // the barcode alone gets product pictures of shops that list it; they still have to name the product
        ...(ean ? [['Bing barcode', () => bingImages(ean, doFetch, ms, loc)]] : []),
    ];
    for (const [engine, run] of searches) {
        const found = await run();
        const out = [];
        for (const f of found) {
            try {
                const u = new URL(decode(f.url));
                if (
                    u.protocol === 'https:' &&
                    !/\.(svg|gif)$/i.test(u.pathname) &&
                    !ADULT.test(`${f.text} ${u.href}`) &&
                    words.filter(w => plain(decode(`${f.text} ${u.href}`)).includes(w)).length >= need &&
                    !out.some(o => o.url === u.href)
                ) {
                    out.push({ url: u.href, source: u.hostname.replace(/^www\./, '') });
                }
            } catch {
                // not a usable entry
            }
        }
        note(engine, found.length, out.length);
        if (out.length) {
            return out.slice(0, 8);
        }
    }
    return [];
}

/** Countries of the barcode prefixes (GS1), in German as the searches are. */
const PREFIXES = [
    [0, 139, 'USA'],
    [300, 379, 'Frankreich'],
    [400, 440, 'Deutschland'],
    [450, 459, 'Japan'],
    [490, 499, 'Japan'],
    [460, 469, 'Russland'],
    [500, 509, 'Großbritannien'],
    [520, 521, 'Griechenland'],
    [539, 539, 'Irland'],
    [540, 549, 'Belgien'],
    [560, 560, 'Portugal'],
    [570, 579, 'Dänemark'],
    [590, 590, 'Polen'],
    [640, 649, 'Finnland'],
    [690, 699, 'China'],
    [700, 709, 'Norwegen'],
    [730, 739, 'Schweden'],
    [754, 755, 'Kanada'],
    [760, 769, 'Schweiz'],
    [789, 790, 'Brasilien'],
    [800, 839, 'Italien'],
    [840, 849, 'Spanien'],
    [868, 869, 'Türkei'],
    [870, 879, 'Niederlande'],
    [880, 880, 'Südkorea'],
    [900, 919, 'Österreich'],
    [930, 939, 'Australien'],
];

/**
 * @param {string} ean barcode
 * @returns {string} country the prefix of the barcode belongs to, empty when unknown
 */
function countryOf(ean) {
    const n = Number(ean.padStart(13, '0').slice(0, 3));
    const hit = PREFIXES.find(([a, b]) => n >= a && n <= b);
    return hit ? hit[2] : '';
}

/**
 * Keeps only pictures that can really be loaded and are not tiny (icons, tracking pixels).
 *
 * @param {{url: string, source: string}[]} list pictures
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms timeout
 * @returns {Promise<{url: string, source: string}[]>} loadable pictures
 */
async function loadable(list, doFetch, ms) {
    const ok = await Promise.all(
        list.map(async i => {
            try {
                const r = await doFetch(i.url, {
                    headers: { 'User-Agent': UA, Accept: 'image/*' },
                    timeoutMs: ms,
                });
                if (!r.ok) {
                    // shops often refuse scripts while the phone loads the picture fine: only a missing one counts
                    return r.status !== 404 && r.status !== 410;
                }
                const type = r.headers?.get?.('content-type') || 'image/jpeg';
                const size = Number(r.headers?.get?.('content-length') || 99999);
                return /^image\//i.test(type) && size > 3000;
            } catch {
                return false;
            }
        }),
    );
    return list.filter((_, n) => ok[n]);
}

/**
 * @param {string} url address
 * @param {string} [lang] language of the page
 * @param {{lang: string, tlds: string[]}} [loc] language of the app and the country endings that count as home
 * @returns {boolean} true for pages of other countries (a Polish shop for the same Rossmann brand, say)
 */
function foreign(url, lang = '', loc = localeOf('de')) {
    const tld = (/\.([a-z]{2})$/i.exec(new URL(url).hostname) || [])[1];
    return (!!tld && !loc.tlds.includes(tld.toLowerCase())) || (!!lang && ![loc.lang, 'en'].includes(lang));
}

/**
 * @param {{url: string, lang?: string}} page page
 * @param {{lang: string, tlds: string[]}} [loc] language of the app and the country endings that count as home
 * @returns {number} -1 for the German pharmacy shop, 0 for shops of the home country, 1 for other
 */
function rank(page, loc = localeOf('de')) {
    // the German pharmacy shop knows medicines best (status, active ingredient), it stays in front
    if (/(^|\.)shop-apotheke\.com$/i.test(new URL(page.url).hostname)) {
        return -1;
    }
    const tld = (/\.([a-z]{2})$/i.exec(new URL(page.url).hostname) || [])[1];
    return (tld && loc.tlds.includes(tld.toLowerCase())) || page.lang === loc.lang ? 0 : 1;
}

/**
 * Pictures for a name only (the "find picture" button of an editor that already has the name): the image search of
 * DuckDuckGo and Bing, only usable pictures.
 *
 * @param {string} name product name
 * @param {{fetch?: typeof fetch, timeoutMs?: number, ean?: string, lang?: string}} [opt] options (lang: language of the app)
 * @returns {Promise<{trace: string, images: {url: string, source: string}[]}>} pictures and what the searches did
 */
async function nameImages(name, opt = {}) {
    const doFetch = gate(opt.fetch || globalThis.fetch);
    const ms = opt.timeoutMs || 4500;
    const trace = [];
    const found = await imageSearch(
        String(name || '').slice(0, 150),
        doFetch,
        ms,
        '',
        (e, n, k) => trace.push(`${e} images: ${n} hits, ${k} fit`),
        /^\d{8,14}$/.test(String(opt.ean || '')) ? String(opt.ean) : '',
        localeOf(opt.lang),
    );
    const images = await loadable(found, doFetch, ms);
    trace.push(`pictures: ${found.length} found, ${images.length} usable`);
    return { trace: trace.join('; '), images };
}

/**
 * Find a product by its barcode on the web: search engines first (a hit only counts when the page or the
 * search snippet shows the barcode), then the free barcode databases for the name. Pictures come from the pages
 * that show the barcode, then from pages of the same product, last from the image search.
 *
 * @param {string} ean barcode (8-14 digits)
 * @param {{fetch?: typeof fetch, timeoutMs?: number, eanSearchToken?: string, openGtinKey?: string, dmOnly?: boolean, dmDeep?: boolean, lang?: string}} [opt] options (dmOnly: ask dm and nothing else, dmDeep: with dmOnly also the shops of other countries for an old barcode, lang: language of the app, decides the search sites and the language of the names)
 * @returns {Promise<{reached: boolean, trace: string, product: null | {name: string, brand: string, packageSize: string, image: string, images: {url: string, source: string}[], source: string, url: string}}>} result
 */
async function webLookup(ean, opt = {}) {
    const doFetch = gate(opt.fetch || globalThis.fetch);
    const ms = opt.timeoutMs || 4500;
    const t0 = Date.now();
    const left = () => Math.min(ms, Math.max(1000, 20000 - (Date.now() - t0)));
    const loc = localeOf(opt.lang);
    const trace = [];
    let reached = false;
    const host = u => new URL(u).hostname.replace(/^www\./, '');
    // pages of the search hits, kept for their pictures
    const pool = [];

    /**
     * Pictures of a product the pages do not show with its barcode: pages that name the same product, then the image search.
     *
     * @param {string} name product name
     * @param {string} size package size
     * @param {string} brand brand, has to be on the page that lends a picture
     * @returns {Promise<{url: string, source: string}[]>} pictures
     */
    const pictures = async (name, size, brand = '') => {
        const words = plain(name).match(/[a-z0-9]{4,}/g) || [];
        // the brand has to be on the page too, otherwise the same product of another brand lends its picture
        const mark = (plain(brand).match(/[a-z0-9]{3,}/) || [])[0] || '';
        const need = Math.min(2, words.length);
        const list = [];
        for (const pg of pool) {
            const info = words.length ? pageInfo(pg.html, pg.url, ean, true) : null;
            const hay = info ? plain(`${info.name} ${info.brand} ${pg.url}`) : '';
            if (
                info &&
                info.name &&
                !foreign(pg.url, info.lang, loc) &&
                !looksForeign(info.name, loc.lang) &&
                (!mark || hay.includes(mark)) &&
                words.filter(w => hay.includes(w)).length >= need
            ) {
                list.push(...info.images.slice(0, 2).map(u => ({ url: u, source: info.source })));
            }
        }
        const fromPages = (await loadable(list, doFetch, left())).slice(0, 8);
        trace.push(`pictures of similar pages: ${list.length} found, ${fromPages.length} usable`);
        if (fromPages.length) {
            return fromPages;
        }
        const found = await imageSearch(
            brand && !plain(name).includes(plain(brand)) ? `${brand} ${name}` : name,
            doFetch,
            left(),
            size,
            (e, n, k) => trace.push(`${e} images: ${n} hits, ${k} fit`),
            ean,
            loc,
        );
        return loadable(found, doFetch, left());
    };

    /**
     * @param {{name: string, brand: string, packageSize: string}} info product data
     * @param {{url: string, source: string}[]} images pictures from pages that show the barcode
     * @param {string} source where the data comes from
     * @param {string} url page of the source
     * @returns {Promise<object>} result for the app
     */
    const done = async (info, images, source, url) => {
        const list = images.length ? images : await pictures(info.name, info.packageSize, info.brand);
        return {
            reached,
            trace: trace.join('; '),
            product: { ...info, image: list[0]?.url || '', images: list, source, url },
        };
    };

    // 1. dm: the official MCP server answers by the barcode with name, brand and pictures
    let dm = await dmMcp(ean, doFetch, left(), m => trace.push(m));
    if (!dm) {
        // the MCP server does not know every barcode that the shop sells: the product search may
        const found = await dmSearch(ean, doFetch, left(), m => trace.push(m));
        if (found?.title) {
            trace.push('dm: found by the search');
            dm = { ...found, fields: [], searched: true };
        } else if (!opt.dmOnly || opt.dmDeep) {
            // dm Germany may have changed the barcode of the article: the shops of other countries still know it
            // (not for the quick question at the start of a search: the Open Facts databases are asked before)
            const old = await dmOldBarcode(ean, doFetch, left(), m => trace.push(m));
            if (old?.title) {
                dm = { fields: [], ...old };
            }
        }
    }
    if (dm) {
        reached = true;
        const named = cleanTitle(dm.title, dm.brand);
        // the MCP answer has no category: dm's own product search names them (facet "categoryNames")
        const segs = dm.categories?.length
            ? dm.categories
            : await dmCategories(ean, doFetch, left(), m => trace.push(m), dm.dan || 0, !!dm.searched);
        trace.push(
            segs.length
                ? 'dm: name found'
                : `dm: name found, no category (${(dm.fields || []).join('|')}${dm.type ? `; productType=${dm.type}` : ''})`,
        );
        // productType says FOOD or NON_FOOD (a list of food ingredients also says food)
        const nonFood = /^non[_ -]?food$/i.test(dm.type || '');
        const food = !nonFood && (dm.food || /^food$/i.test(dm.type || ''));
        let kind = food ? 'Lebensmittel' : catInfo([...segs, named.name]).category;
        if (nonFood && kind === 'Lebensmittel') {
            kind = 'Drogerie';
        }
        const cat = { ...(segs.length ? { tags: segs } : {}), category: kind };
        if (!named.packageSize && /\d/.test(dm.size || '')) {
            named.packageSize = dm.size;
        }
        return done(
            { ...named, ...cat },
            dm.images.map(u => ({ url: u, source: 'dm.de' })),
            'dm.de',
            `https://www.dm.de/search?query=${ean}`,
        );
    }
    trace.push('dm: unknown');
    // medicines: the pharmacy shop knows them best, so it is asked before the barcode databases and the web search
    if (!opt.dmOnly) {
        const ap = await apothekeFind(ean, doFetch, left(), m => trace.push(m));
        if (ap) {
            reached = true;
            const own = (
                await loadable(
                    ap.images.map(u => ({ url: u, source: 'shop-apotheke.com' })),
                    doFetch,
                    left(),
                )
            ).slice(0, 6);
            return done(
                { name: ap.name, brand: ap.brand, packageSize: ap.packageSize, ...(ap.cat || {}) },
                own,
                'shop-apotheke.com',
                ap.url,
            );
        }
    }
    // the open product API of vitality-fit.de: exact by barcode, but no tags
    if (!opt.dmOnly) {
        const vf = await vitalityFind(ean, doFetch, left(), m => trace.push(m));
        if (vf) {
            reached = true;
            const own = (
                await loadable(
                    vf.images.map(u => ({ url: u, source: 'vitality-fit.de' })),
                    doFetch,
                    left(),
                )
            ).slice(0, 4);
            return done(
                { name: vf.name, brand: vf.brand, packageSize: vf.packageSize },
                own,
                'vitality-fit.de',
                vf.url,
            );
        }
    }
    if (opt.dmOnly) {
        return { reached, trace: trace.join('; '), product: null };
    }

    // 2. barcode databases: the name is enough, the pictures are looked for afterwards
    /**
     * @param {string} label database for the trace
     * @param {string} raw name from the database
     * @param {string} brand brand from the database
     * @param {string} source name of the source
     * @param {string} url page of the source
     * @returns {Promise<object>} result for the app
     */
    const fromDatabase = (label, raw, brand, source, url) => {
        reached = true;
        trace.push(`${label}: name found`);
        return done(cleanTitle(raw, brand), [], source, url);
    };
    if (opt.eanSearchToken) {
        const raw = await eanApiName(ean, String(opt.eanSearchToken), doFetch, left());
        if (raw) {
            return fromDatabase('ean-search API', raw, '', 'ean-search.org', `https://www.ean-search.org/?q=${ean}`);
        }
        trace.push('ean-search API: unknown');
    }
    const suche = await eanSucheProduct(ean, doFetch, left());
    if (suche.name) {
        reached = true;
        trace.push('ean-suche.net: name found');
        const own = await loadable(
            suche.images.map(u => ({ url: u, source: 'ean-suche.net' })),
            doFetch,
            left(),
        );
        trace.push(`ean-suche.net pictures: ${suche.images.length} found, ${own.length} usable`);
        return done(cleanTitle(suche.name, ''), own, 'ean-suche.net', `https://ean-suche.net/ean/${ean}`);
    }
    trace.push('ean-suche.net: unknown');
    if (!opt.eanSearchToken) {
        const site = await getHtml(doFetch, `https://www.ean-search.org/?q=${ean}`, left());
        const raw = site ? eanSiteName(site, ean) : '';
        if (raw) {
            return fromDatabase('ean-search.org', raw, '', 'ean-search.org', `https://www.ean-search.org/?q=${ean}`);
        }
        trace.push(site ? 'ean-search.org: unknown' : 'ean-search.org: no answer (blocked?)');
        reached ||= !!site;
    }
    if (opt.openGtinKey) {
        const g = await openGtinName(ean, String(opt.openGtinKey), doFetch, left());
        if (g.name) {
            return fromDatabase(
                'Open EAN',
                g.name,
                g.brand,
                'opengtindb.org',
                `https://opengtindb.org/?ean=${ean}&cmd=query`,
            );
        }
        trace.push('Open EAN: unknown');
    }

    // 3. last resort, the search engines
    const searchTheWeb = async () => {
        // the way it works by hand: "ean", the barcode in quotes and the country of its prefix
        const country = countryOf(ean);
        const form = text => `q=${encodeURIComponent(text)}&b=&kl=${loc.ddg}`;
        const withEan = `ean "${ean}" ${country}`.trim();
        const attempts = [
            ['DuckDuckGo', 'https://html.duckduckgo.com/html/', form(withEan)],
            ['Bing', `https://www.bing.com/search?q=${encodeURIComponent(withEan)}&${loc.bing}`, ''],
            // the plain number, the way it is typed in by hand: the engine then ranks differently than with quotes
            ['Bing (plain)', `https://www.bing.com/search?q=${ean}&${loc.bing}`, ''],
            // INCI Beauty names cosmetics by barcode, but its page does not show the number to a script
            [
                'Bing (INCI)',
                `https://www.bing.com/search?q=${encodeURIComponent(`"${ean}" site:incibeauty.com`)}&${loc.bing}`,
                '',
            ],
            // Rossmann keeps the barcode at the end of the product address, its pages are closed to scripts
            ...(loc.lang === 'de'
                ? [
                      [
                          'Bing (Rossmann)',
                          `https://www.bing.com/search?q=${encodeURIComponent(`"${ean}" site:rossmann.de`)}&${loc.bing}`,
                          '',
                      ],
                      [
                          'Mojeek (Rossmann)',
                          `https://www.mojeek.com/search?q=${encodeURIComponent(`"${ean}" site:rossmann.de`)}`,
                          '',
                      ],
                  ]
                : []),
            ['DuckDuckGo (number)', 'https://html.duckduckgo.com/html/', form(ean)],
            ['Bing (number)', `https://www.bing.com/search?q=${encodeURIComponent(`"${ean}"`)}&${loc.bing}`, ''],
        ];
        // the pages of one search, as the product they describe: first the name, then the pictures of all pages
        const finish = async good => {
            const first = good[0];
            const candidates = good.flatMap(g => g.images.slice(0, 2).map(u => ({ url: u, source: g.source })));
            const images = (await loadable(candidates, doFetch, left())).slice(0, 8);
            trace.push(`pictures of the pages: ${candidates.length} found, ${images.length} usable`);
            const info = {
                name: first.name,
                brand: first.brand || good.find(g => g.brand)?.brand || '',
                packageSize: first.packageSize || good.find(g => g.packageSize)?.packageSize || '',
                ...(first.cat || {}),
            };
            return done(info, images, first.source, first.url);
        };
        // a name in English is only taken when no search finds a German one
        let english = null;
        let duckBlocked = false;
        for (const [name, url, body] of attempts) {
            if (Date.now() - t0 > 12000) {
                break;
            }
            if (duckBlocked && name.startsWith('DuckDuckGo')) {
                continue;
            }
            const html = await getHtml(doFetch, url, left(), body);
            if (!html) {
                trace.push(`${name}: no answer`);
                duckBlocked ||= name.startsWith('DuckDuckGo');
                continue;
            }
            reached = true;
            const hits = searchResults(html).filter(h => !ADULT.test(`${h.url} ${h.title} ${h.snippet}`));
            if (!hits.length) {
                trace.push(`${name}: 0 hits`);
                if (/anomaly|captcha|unfortunately, bots/i.test(html)) {
                    trace.push(`${name}: blocked by the engine`);
                    duckBlocked ||= name.startsWith('DuckDuckGo');
                }
                continue;
            }
            const top = hits.slice(0, 8);
            const pages = await Promise.all(top.map(h => getHtml(doFetch, h.url, left())));
            const withCode = top.filter((h, i) => pages[i] && hasCode(pages[i], ean)).length;
            const closed = pages.filter(pg => !pg).length;
            trace.push(`${name}: ${hits.length} hits, ${withCode} with barcode${closed ? `, ${closed} closed` : ''}`);
            top.forEach(
                (h, i) => pages[i] && !pool.some(pg => pg.url === h.url) && pool.push({ url: h.url, html: pages[i] }),
            );
            const good = top
                .map((h, i) => (pages[i] ? pageInfo(pages[i], h.url, ean) : null))
                .filter(g => g && !foreign(g.url, g.lang, loc) && !looksForeign(g.name, loc.lang))
                .sort((x, y) => rank(x, loc) - rank(y, loc));
            if (!good.length) {
                // shops often block scripts: the search snippet then has to show the barcode
                // or the address of the hit ends with the barcode (Rossmann: /de/<name>/p/4305615827759), which its
                // protected page cannot show to a script
                const ownUrl = h => new RegExp(`/p/0*${ean.replace(/^0+/, '')}(?:[/?#]|$)`).test(h.url);
                // a hit of a search that was limited to the barcode and one cosmetics site counts without the number on its page
                const trusted = h =>
                    name === 'Bing (INCI)' && /(^|\.)incibeauty\.com$/i.test(new URL(h.url).hostname) && !!h.title;
                // the page of a hit: its language counts too, a shop outside Germany has to say that it is German
                const german = h => {
                    if (trusted(h) || ownUrl(h)) {
                        return true;
                    }
                    const pg = pages[top.indexOf(h)];
                    const lang = pg ? pageLang(pg, new URL(h.url)) : '';
                    const tld = (/\.([a-z]{2})$/i.exec(new URL(h.url).hostname) || [])[1];
                    return (
                        !foreign(h.url, lang, loc) &&
                        ((!!tld && loc.tlds.includes(tld.toLowerCase())) || lang === loc.lang)
                    );
                };
                let seen = null;
                let info = { name: '' };
                for (const h of top) {
                    if (
                        foreign(h.url, '', loc) ||
                        !(ownUrl(h) || trusted(h) || (h.title && hasCode(`${h.title} ${h.snippet}`, ean))) ||
                        !(h.title || ownUrl(h)) ||
                        !german(h)
                    ) {
                        continue;
                    }
                    let cand = junkTitle(h.title) ? { name: '' } : cleanTitle(h.title, '');
                    if ((!cand.name || /^\W*(rossmann(\.de)?|dm(\.de)?)\W*$/i.test(cand.name)) && ownUrl(h)) {
                        cand = cleanTitle(slugName(h.url), '');
                    }
                    if (cand.name && !looksForeign(cand.name, loc.lang)) {
                        seen = h;
                        info = cand;
                        break;
                    }
                }
                if (!seen) {
                    continue;
                }
                if (!info.brand) {
                    // "Bevola Milch & Honig Cremeseife …": the snippet starts with the brand in front of the title
                    const at = String(seen.snippet || '')
                        .toLowerCase()
                        .indexOf(info.name.toLowerCase().slice(0, 15));
                    const lead = at > 0 ? String(seen.snippet).slice(0, at).trim() : '';
                    if (/^[A-ZÄÖÜ][\wÄÖÜäöüß&'.-]{1,24}$/.test(lead)) {
                        info.brand = lead;
                    }
                }
                // the page of a trusted hit still has its own picture
                const page = pages[top.indexOf(seen)];
                let own = [];
                try {
                    const og = page ? meta(page, 'og:image') : '';
                    own = og ? [new URL(og, seen.url).href] : [];
                } catch {
                    own = [];
                }
                good.push({
                    ...info,
                    images: own,
                    source: host(seen.url),
                    url: seen.url,
                    cat: { ...rossmannCat(seen.url), ...(page ? pharmacyCat(page, seen.url) : {}) },
                });
            }
            const native = good.filter(g => !looksEnglish(g.name, g.lang, loc.lang));
            if (!native.length) {
                trace.push('only an English name');
                english ||= good;
                continue;
            }
            return finish(native);
        }

        return english ? finish(english) : null;
    };
    const web = await searchTheWeb();
    if (web) {
        return web;
    }
    return { reached, trace: trace.join('; '), product: null };
}

module.exports = {
    gate,
    localeOf,
    nameLang,
    webLookup,
    nameImages,
    imageSearch,
    countryOf,
    openGtinName,
    dmMcp,
    dmFromAnswer,
    looksForeign,
    looksEnglish,
    pageLang,
    dmCategories,
    dmSearch,
    dmOldBarcode,
    apothekeFind,
    vitalityFind,
    rossmannCat,
    pharmacyCat,
    catSegments,
    catInfo,
    csv,
    eanSucheName,
    eanSucheProduct,
    resetSuche,
    searchName,
    eanApiName,
    searchLinks,
    searchResults,
    pageInfo,
    cleanTitle,
    eanSiteName,
};
