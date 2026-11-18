'use strict';

const { gate } = require('./netGate');
const { isbnOf, issnOf, kindOf } = require('../www/scanCodes');

const CATEGORY = 'Bücher';

/**
 * @param {string} s text
 * @returns {string} one line without surplus blanks
 */
function line(s) {
    return String(s ?? '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * @param {string} url picture address
 * @returns {string} https address, empty for anything else
 */
function https(url) {
    const u = String(url ?? '').replace(/^http:\/\//i, 'https://');
    return /^https:\/\//i.test(u) ? u : '';
}

/**
 * A title as the catalogues of the libraries write it, made readable: no leading "[Name] ; ", no statement of
 * responsibility after " / ", no sorting marks, " : " before the subtitle becomes " – ".
 *
 * @param {string} s title
 * @returns {string} title
 */
function titleOf(s) {
    const t = line(s)
        .replace(/[\u00ac\u0098\u009c]|<<|>>/g, '')
        .replace(/^\[[^\]]{1,60}\]\s*;\s*/, '')
        .replace(/\s+\/\s+.*$/, '')
        .replace(/\s+:\s+/g, ' – ')
        .replace(/\s*[;,.]$/, '');
    return line(t) || line(s);
}

/**
 * Authors as "First Last": library entries are "Last, First [Verfasser]"; illustrators, translators and the like are
 * only taken when nobody else is named.
 *
 * @param {string[]} list entries
 * @returns {string} up to two names, separated by commas
 */
function authorsOf(list) {
    const all = (list || [])
        .map(line)
        .filter(Boolean)
        .map(a => {
            const role = (/\[([^\]]+)\]/.exec(a) || [])[1] || '';
            let name = line(a.replace(/\s*\[[^\]]*\]/g, '').replace(/\s*\([^)]*\)\s*$/, ''));
            const parts = name.split(',').map(x => x.trim());
            if (parts.length === 2 && parts[0] && parts[1]) {
                name = `${parts[1]} ${parts[0]}`;
            }
            return { name, main: !role || /verfasser|autor|author|komponist|herausgeb/i.test(role) };
        })
        .filter(a => a.name);
    const main = all.filter(a => a.main);
    return [...new Set((main.length ? main : all).map(a => a.name))].slice(0, 2).join(', ');
}

const GENRES = [
    [/kinder|juvenile|children|bilderbuch|vorlese|picture book/i, 'Kinderbuch'],
    [/jugend|young adult/i, 'Jugendbuch'],
    [/krimi|thriller|detective|mystery/i, 'Krimi'],
    [/fantasy|science fiction|science-fiction/i, 'Fantasy'],
    [/comic|graphic novel|manga/i, 'Comic'],
    [/koch|backen|cooking|cookery/i, 'Kochbuch'],
    [/lexikon|wörterbuch|dictionary|encyclop/i, 'Nachschlagewerk'],
    [/ratgeber|self-help/i, 'Ratgeber'],
    [/lyrik|gedicht|poetry/i, 'Lyrik'],
    [/sachbuch|non-?fiction/i, 'Sachbuch'],
    [/roman|fiction|novel|erzählung|belletristik/i, 'Roman'],
];

/**
 * The well-known genres in front of the subject words, so the cut after a few tags never drops a genre that only
 * the second catalogue named.
 *
 * @param {string[]} list tags
 * @returns {string[]} tags, genres first, otherwise in the same order
 */
function genresFirst(list) {
    const known = new Set([...GENRES.map(g => g[1]), 'Noten', 'Zeitschrift']);
    return [...list.filter(t => known.has(t)), ...list.filter(t => !known.has(t))];
}

/**
 * Tags from the subjects of a catalogue entry: a few well-known genres in German, and (only for the German catalogue)
 * its own subject words.
 *
 * @param {unknown[]} subjects subject words as the catalogue gives them
 * @param {boolean} raw take over the subject words themselves (German catalogues only)
 * @returns {string[]} tags, at most five
 */
function tagsOf(subjects, raw) {
    // an entry that is a web address (lobid sometimes gives the address instead of the label) is no subject word
    const seen = new Set();
    const words = (Array.isArray(subjects) ? subjects : [])
        .flatMap(x => {
            const t = line(x);
            return /https?:\/\/|^www\./i.test(t) ? [] : t.split(/\s*[;/|]\s*/);
        })
        .filter(x => !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase()))
        .map(x => (raw ? x.replace(/^(?:\d{3}(?:\.\d+)?|[A-Z])\s+(?=\S)/, '') : x).replace(/^[-–\s]+|[\s,.]+$/g, ''))
        .filter(
            x => x.length >= 3 && x.length <= 40 && !/^[\d\s.,:-]+$/.test(x) && !/\b(?:DDC|Sachgruppe|GND)\b/i.test(x),
        );
    const tags = [];
    for (const [re, tag] of GENRES) {
        if (words.some(w => re.test(w)) && !tags.includes(tag)) {
            tags.push(tag);
        }
    }
    if (tags.some(t => t === 'Kinderbuch' || t === 'Jugendbuch')) {
        tags.splice(tags.indexOf('Roman') >= 0 ? tags.indexOf('Roman') : tags.length, 1);
        // "mystery" or "detective" in the subjects of a children's fantasy book does not make it a crime novel
        const k = tags.indexOf('Krimi');
        if (k >= 0 && tags.includes('Fantasy') && !words.some(w => /krimi|kriminal|thriller/i.test(w))) {
            tags.splice(k, 1);
        }
    }
    if (raw) {
        for (const w of words) {
            if (
                tags.length < 5 &&
                !tags.some(t => t.toLowerCase() === w.toLowerCase()) &&
                !GENRES.some(([re]) => re.test(w))
            ) {
                tags.push(w);
            }
        }
    }
    return tags.slice(0, 5);
}

/**
 * @param {unknown} s text such as "96 Seiten : Illustrationen"
 * @returns {number} number of pages, 0 if none
 */
function pagesOf(s) {
    const m = /(\d{1,5})\s*(?:Seiten|S\.|Bl[aä]tt|pages|p\.)/i.exec(line(s));
    return m ? Number(m[1]) : 0;
}

/**
 * @param {{name: string, authors: string[], publisher: string, pages?: number, image: string, subjects?: unknown[], raw?: boolean}} b book data
 * @param {string} source where it comes from
 * @param {string[]} tags tags
 * @returns {object} product data
 */
function product(b, source, tags) {
    return {
        name: titleOf(b.name).slice(0, 120),
        brand: authorsOf(b.authors).slice(0, 80),
        packageSize: b.pages ? `${b.pages} S.` : '',
        image: https(b.image),
        category: CATEGORY,
        tags: [...new Set([...tags, ...tagsOf(b.subjects, b.raw)])].slice(0, 6),
        source,
    };
}

/**
 * @param {typeof fetch} doFetch fetch
 * @param {string} url address
 * @param {number} ms time limit
 * @param {(msg: string) => void} [note] told what happened, for the log
 * @param {string} [who] name of the source, for the log
 * @returns {Promise<object | null>} parsed answer, null on any problem
 */
async function getJson(doFetch, url, ms, note = () => {}, who = '') {
    try {
        const r = await doFetch(url, { headers: { Accept: 'application/json' }, timeoutMs: ms });
        if (!r.ok) {
            note(`${who}: HTTP ${r.status || '?'}`);
            return null;
        }
        return await r.json();
    } catch (e) {
        note(`${who}: ${e?.name === 'TimeoutError' ? 'timeout' : 'no answer'}`);
        return null;
    }
}

/**
 * Open Library: title, authors, publisher and cover by ISBN.
 *
 * @param {string} isbn ISBN-13
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms time limit
 * @param {(msg: string) => void} [note] told what happened
 */
async function openLibrary(isbn, doFetch, ms, note) {
    const j = await getJson(
        doFetch,
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
        ms,
        note,
        'Open Library',
    );
    const b = j && j[`ISBN:${isbn}`];
    if (!b || !line(b.title)) {
        note?.('Open Library: unknown');
        return null;
    }
    const name = b.subtitle ? `${line(b.title)} – ${line(b.subtitle)}` : b.title;
    return product(
        {
            name,
            authors: (b.authors || []).map(a => a.name),
            publisher: ((b.publishers || [])[0] || {}).name || '',
            pages: Number(b.number_of_pages) || 0,
            image: (b.cover && (b.cover.large || b.cover.medium || b.cover.small)) || '',
            subjects: (b.subjects || []).map(x => x && x.name),
        },
        'openlibrary.org',
        [],
    );
}

/**
 * The German National Library through lobid.org (its catalogue as JSON): good for German books and magazines.
 *
 * @param {string} query search, for example isbn:(9783161484100 OR 3161484100)
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms time limit
 * @param {string[]} tags tags of the product
 * @param {(msg: string) => void} [note] told what happened
 */
async function lobid(query, doFetch, ms, tags, note) {
    const j = await getJson(
        doFetch,
        `https://lobid.org/resources/search?q=${encodeURIComponent(query)}&format=json&size=1`,
        ms,
        note,
        'lobid',
    );
    const m = j && Array.isArray(j.member) ? j.member[0] : null;
    if (!m || !line(m.title)) {
        note?.('lobid: unknown');
        return null;
    }
    // a magazine keeps its short subtitle ("Magazin für Computer-Technik"), the advertising line behind it goes
    const sub = m.otherTitleInformation && m.otherTitleInformation[0];
    let name = sub ? `${m.title} – ${sub}` : m.title;
    if (/^issn:/.test(query)) {
        // the catalogue writes the advertising line behind the subtitle with a colon or a dash
        name = String(name)
            .split(/\s+[–—:-]\s+/)
            .slice(0, 2)
            .join(' – ');
    }
    const authors = (m.contribution || []).map(c => (c.agent || {}).label).filter(Boolean);
    const subjects = (m.subject || []).map(x => (x && typeof x === 'object' ? x.label : x));
    const pages = pagesOf([].concat(m.extent || [])[0]);
    return product({ name, authors, publisher: '', image: '', pages, subjects, raw: true }, 'dnb.de', tags);
}

/**
 * @param {string} s text with XML entities
 * @returns {string} plain text
 */
function unxml(s) {
    return String(s)
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}

/**
 * The search interface (SRU) of the German National Library itself: title and authors by ISBN.
 *
 * @param {string} isbn ISBN-13
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms time limit
 * @param {string[]} tags tags of the product
 * @param {(msg: string) => void} [note] told what happened
 */
async function dnbSru(isbn, doFetch, ms, tags, note = () => {}) {
    let text = '';
    try {
        const r = await doFetch(
            `https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=${encodeURIComponent(`isbn=${isbn}`)}&recordSchema=oai_dc&maximumRecords=1`,
            { headers: { Accept: 'application/xml' }, timeoutMs: ms },
        );
        if (!r.ok) {
            note(`DNB: HTTP ${r.status || '?'}`);
            return null;
        }
        text = String(await r.text());
    } catch (e) {
        note(`DNB: ${e?.name === 'TimeoutError' ? 'timeout' : 'no answer'}`);
        return null;
    }
    const title = /<dc:title[^>]*>([^<]+)<\/dc:title>/.exec(text);
    if (!title || !line(unxml(title[1]))) {
        note('DNB: unknown');
        return null;
    }
    const authors = [...text.matchAll(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/g)].map(m => unxml(m[1]));
    const subjects = [...text.matchAll(/<dc:subject[^>]*>([^<]+)<\/dc:subject>/g)].map(m => unxml(m[1]));
    const fmt = /<dc:format[^>]*>([^<]+)<\/dc:format>/.exec(text);
    return product(
        {
            name: unxml(title[1]),
            authors,
            publisher: '',
            image: '',
            pages: pagesOf(fmt && unxml(fmt[1])),
            subjects,
            raw: true,
        },
        'dnb.de',
        tags,
    );
}

/**
 * Google Books, as the last resort.
 *
 * @param {string} isbn ISBN-13
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms time limit
 * @param {(msg: string) => void} [note] told what happened
 */
async function googleBooks(isbn, doFetch, ms, note) {
    const j = await getJson(
        doFetch,
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
        ms,
        note,
        'Google Books',
    );
    const v = j && Array.isArray(j.items) && j.items[0] ? j.items[0].volumeInfo : null;
    if (!v || !line(v.title)) {
        note?.('Google Books: unknown');
        return null;
    }
    const name = v.subtitle ? `${line(v.title)} – ${line(v.subtitle)}` : v.title;
    return product(
        {
            name,
            authors: v.authors || [],
            publisher: v.publisher || '',
            pages: Number(v.pageCount) || 0,
            image: (v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || '',
            subjects: v.categories || [],
        },
        'books.google.com',
        [],
    );
}

/**
 * The cover by ISBN, asked only if no catalogue gave a picture: the cover service of the German National Library and
 * the covers of Open Library (they answer with an error when there is none). The pictures are fetched here because
 * the service of the National Library sits behind a bot protection that lets a browser through only after a check, so
 * a phone could not load the address itself. A small JPEG is taken over as it is (a data address, so it also works
 * offline); a larger one comes back as coverData, to be made small by the app.
 *
 * @param {string} isbn ISBN-13
 * @param {typeof fetch} doFetch fetch
 * @param {number} ms time limit
 * @param {(msg: string) => void} note told what happened
 * @returns {Promise<{image: string, coverData: string}>} the picture, empty if there is none
 */
async function coverOf(isbn, doFetch, ms, note) {
    const dnb = ['DNB', `https://portal.dnb.de/opac/mvb/cover?isbn=${isbn}`, false];
    const open = ['Open Library', `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`, true];
    for (const [who, url, hotlink] of /^9783/.test(isbn) ? [dnb, open] : [open, dnb]) {
        try {
            const r = await doFetch(url, { headers: { Accept: 'image/*' }, timeoutMs: ms });
            if (!r.ok) {
                note(`cover ${who}: HTTP ${r.status || '?'}`);
                continue;
            }
            if (typeof r.arrayBuffer !== 'function') {
                return { image: url, coverData: '' };
            }
            const bytes = Buffer.from(await r.arrayBuffer());
            const jpeg = bytes.length > 600 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
            if (!jpeg) {
                note(`cover ${who}: no picture`);
                continue;
            }
            note(`cover ${who}: found, ${bytes.length} bytes`);
            const data = `data:image/jpeg;base64,${bytes.toString('base64')}`;
            // the app keeps pictures up to about 36 kB as they are
            if (bytes.length <= 36000) {
                return { image: data, coverData: '' };
            }
            return { image: hotlink ? url : '', coverData: bytes.length <= 300000 ? data : '' };
        } catch (e) {
            note(`cover ${who}: ${e?.name === 'TimeoutError' ? 'timeout' : 'no answer'}`);
        }
    }
    return { image: '', coverData: '' };
}

/**
 * The ISBN-10 of an ISBN-13 that starts with 978.
 *
 * @param {string} isbn ISBN-13
 * @returns {string} ISBN-10, empty for 979
 */
function isbn10Of(isbn) {
    if (!/^978\d{10}$/.test(isbn)) {
        return '';
    }
    const d = isbn.slice(3, 12);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += (10 - i) * Number(d[i]);
    }
    const c = (11 - (sum % 11)) % 11;
    return `${d}${c === 10 ? 'X' : c}`;
}

/**
 * Look up a book, magazine or piece of sheet music by the number on its barcode. The catalogues are asked at the same
 * time, the answer of the one that comes first in the list of preference counts.
 *
 * @param {string} code barcode (ISBN, 977… magazine, 9790… ISMN) or ISBN-10
 * @param {{fetch?: typeof fetch, lang?: string, timeoutMs?: number, note?: (msg: string) => void}} [opt] options
 * @returns {Promise<object | null>} product data, null when the number is none of these or nobody knows it
 */
async function bookLookup(code, opt = {}) {
    const doFetch = gate(opt.fetch || globalThis.fetch);
    const ms = opt.timeoutMs || 5000;
    const note = opt.note || (() => {});
    const isbn = isbnOf(code);
    const text = String(code ?? '').replace(/\D/g, '');
    if (isbn) {
        const tags = kindOf(isbn) === 'ismn' ? ['Noten'] : [];
        // books of the German language area (978-3) are best known to the German National Library
        const german = /^9783/.test(isbn);
        const ten = isbn10Of(isbn);
        const query = `isbn:(${isbn}${ten ? ` OR ${ten}` : ''})`;
        const dnb = [() => lobid(query, doFetch, ms, tags, note), () => dnbSru(isbn, doFetch, ms, tags, note)];
        const open = () => openLibrary(isbn, doFetch, ms, note);
        const steps = german ? [...dnb, open] : [open, ...dnb];
        steps.push(() => googleBooks(isbn, doFetch, ms, note));
        // the cover is asked for in the same breath, and never holds the answer back for long
        let timer;
        const cover = Promise.race([
            coverOf(isbn, doFetch, ms, note).catch(() => ({ image: '', coverData: '' })),
            new Promise(resolve => {
                timer = setTimeout(() => resolve({ image: '', coverData: '' }), ms + 1500);
                timer.unref?.();
            }),
        ]);
        const all = await Promise.all(steps.map(s => s().catch(() => null)));
        const r = all.find(Boolean);
        if (!r) {
            clearTimeout(timer);
            return null;
        }
        // what the first catalogue lacks (cover, page count, genres) is taken from the others
        const rest = all.filter(x => x && x !== r);
        const missing = !r.image && !rest.some(x => x.image);
        const found = missing ? await cover : { image: '', coverData: '' };
        clearTimeout(timer);
        return {
            ...r,
            image: r.image || rest.map(x => x.image).find(Boolean) || found.image,
            ...(found.coverData ? { coverData: found.coverData } : {}),
            packageSize: r.packageSize || rest.map(x => x.packageSize).find(Boolean) || '',
            tags: genresFirst([...new Set([...tags, ...r.tags, ...rest.flatMap(x => x.tags)])]).slice(0, 6),
        };
    }
    const issn = issnOf(text);
    if (issn) {
        return lobid(`issn:${issn}`, doFetch, ms, ['Zeitschrift'], note);
    }
    return null;
}

module.exports = { bookLookup, isbn10Of, CATEGORY, tagsOf, genresFirst };
