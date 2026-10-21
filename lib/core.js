'use strict';

const crypto = require('node:crypto');
const { unitAmount } = require('./scanner');
const { guessShelfLife } = require('../www/shelfLife');

const DEFAULT_AREAS = ['Speisekammer'];
const SEED = {
    de: ['Speisekammer', 'Regal 1', 'Nudeln', 'Teigwaren', 'Packung'],
    en: ['Pantry', 'Shelf 1', 'Pasta', 'Pasta', 'Pack'],
    ru: ['Кладовая', 'Полка 1', 'Макароны', 'Макаронные изделия', 'Упаковка'],
    pt: ['Despensa', 'Prateleira 1', 'Massa', 'Massas', 'Pacote'],
    nl: ['Voorraadkast', 'Plank 1', 'Pasta', 'Pasta', 'Pak'],
    fr: ['Garde-manger', 'Étagère 1', 'Pâtes', 'Pâtes', 'Paquet'],
    it: ['Dispensa', 'Scaffale 1', 'Pasta', 'Pasta', 'Confezione'],
    es: ['Despensa', 'Estante 1', 'Pasta', 'Pasta', 'Paquete'],
    pl: ['Spiżarnia', 'Półka 1', 'Makaron', 'Makarony', 'Opakowanie'],
    uk: ['Комора', 'Полиця 1', 'Макарони', 'Макаронні вироби', 'Упаковка'],
    'zh-cn': ['储藏室', '1号架', '意面', '面食', '包'],
};
const LOCATION_ID = 'speisekammer-regal-1';

/**
 * Default data (area and location) in the given language.
 *
 * @param {string} [lang] language code
 */
function defaultData(lang) {
    const [group, name] = SEED[lang] || SEED.en;
    return { areas: [group], locations: { [LOCATION_ID]: { id: LOCATION_ID, group, name, qr: `${group}\n${name}` } } };
}
const MAX_HISTORY = 1000;
const UNDO_KEEP = 20;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a best-before date.
 *
 * @param {unknown} v date as YYYY-MM-DD or empty
 * @returns {string} the date or an empty string
 */
function cleanDate(v) {
    const t = clean(v, 10);
    if (!t) {
        return '';
    }
    assert(DATE_RE.test(t) && !Number.isNaN(Date.parse(`${t}T00:00:00Z`)), 'Invalid best-before date');
    return t;
}

/**
 * Trim and shorten a value to a string.
 *
 * @param {unknown} x value
 * @param {number} [max] maximum length
 */
function clean(x, max = 160) {
    return String(x ?? '')
        .trim()
        .slice(0, max);
}

/**
 * Create a short unique id.
 */
function uuid() {
    return `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`;
}

/**
 * Normalise a product name for the shopping list (same rules as the web app).
 *
 * @param {unknown} name product or group name
 */
function listName(name) {
    return String(name ?? '')
        .replace(/[-–—/]/g, ' ')
        .replace(/[^\p{L}\p{N} ]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * @param {boolean} condition must be true
 * @param {string} message error text otherwise
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * Date in a number of days, as YYYY-MM-DD.
 *
 * @param {number} days days from now
 * @param {Date} [now] current time
 */
function addDays(days, now = new Date()) {
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/**
 * Whole days within limits, 0 when invalid.
 *
 * @param {unknown} v value
 * @param {number} max upper limit
 */
function days(v, max) {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n > 0 && n <= max ? n : 0;
}

/**
 * First meaningful word of a product name, used to find products that belong together.
 *
 * @param {string} name product name
 * @returns {string} lower case key, empty when there is none
 */
function nameKey(name) {
    const base = String(name || '')
        .replace(/[([{][^)\]}]*[)\]}]/g, ' ')
        .split(/\s[-–—]\s|,/)[0];
    const word = base.toLowerCase().match(/[\p{L}]{3,}/u);
    return word ? word[0] : '';
}

/**
 * Pure inventory logic. No I/O, so it can be tested without ioBroker.
 */
class Inventory {
    /**
     * @param {object} [data] stored data
     * @param {string} [lang] language for the example data
     */
    constructor(data, lang) {
        this.lang = lang || 'en';
        this.bbMode = 'off';
        this.autoShelf = true;
        this.data = Inventory.normalize(data ?? defaultData(this.lang));
        if (!data) {
            this.addExample();
        }
    }

    /**
     * Put one example product into an empty inventory so a first start is not blank.
     */
    addExample() {
        const [, , group, category, unit] = SEED[this.lang] || SEED.en;
        const r = this.handle({
            action: 'saveProduct',
            product: {
                name: 'Fusilli No. 98',
                brand: 'Barilla',
                ean: '8076802085981',
                category,
                group,
                nutriscore: 'a',
                unit,
                packageSize: '500 g',
                image: 'https://images.openfoodfacts.org/images/products/807/680/208/5981/front_de.4132.200.jpg',
                source: 'off',
            },
        });
        this.handle({ action: 'changeStock', productId: r.productId, locationId: LOCATION_ID, delta: 2 });
        this.data.history = [];
    }

    /**
     * @param {object} data raw stored data
     */
    static normalize(data) {
        const d = data && typeof data === 'object' ? data : {};
        const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
        const areas = Array.isArray(d.areas) ? d.areas.map(a => clean(a, 80)).filter(Boolean) : [];
        return {
            products: obj(d.products),
            inventory: obj(d.inventory),
            batches: obj(d.batches),
            locations: obj(d.locations),
            history: Array.isArray(d.history) ? d.history.slice(-MAX_HISTORY) : [],
            areas: areas.length ? areas : [...DEFAULT_AREAS],
        };
    }

    /**
     * @param {string} productId product id
     */
    stockOf(productId) {
        return Object.values(this.data.inventory[productId] || {}).reduce((s, n) => s + Number(n || 0), 0);
    }

    /**
     * Products that count together: same group and same unit type, else the product itself.
     *
     * @param {object} product product
     */
    members(product) {
        const { products } = this.data;
        return Object.values(products).filter(x =>
            product.group ? x.group === product.group && x.type === product.type : x.id === product.id,
        );
    }

    /**
     * @param {object} product product
     */
    isLow(product) {
        const members = this.members(product);
        const min = Math.max(0, ...members.map(x => Number(x.minStock) || 0));
        return min > 0 && members.reduce((s, x) => s + this.stockOf(x.id), 0) <= min;
    }

    /**
     * Names (group or product) of everything at or below the minimum stock, without duplicates.
     */
    lowStockNames() {
        const names = new Set();
        for (const p of Object.values(this.data.products)) {
            if (this.isLow(p)) {
                const n = listName(p.group || p.name);
                if (n) {
                    names.add(n);
                }
            }
        }
        return [...names].sort((a, b) => a.localeCompare(b));
    }

    /**
     * Keep the best-before batches of one product and location in line with a stock change.
     * Removing takes the oldest dated batch first. Stock without a batch counts as "no date".
     *
     * @param {string} productId product id
     * @param {string} loc location id
     * @param {number} delta stock change
     * @param {number} next new stock
     * @param {string} date best-before date of added stock, may be empty
     */
    updateBatches(productId, loc, delta, next, date) {
        const all = this.data.batches;
        if (!all[productId]) {
            all[productId] = {};
        }
        let list = Array.isArray(all[productId][loc]) ? all[productId][loc] : [];
        if (next === 0) {
            list = [];
        } else if (delta > 0) {
            if (date) {
                const hit = list.find(b => b.d === date && !b.o);
                if (hit) {
                    hit.q = Math.round((hit.q + delta) * 1000) / 1000;
                } else {
                    list.push({ d: date, q: delta });
                }
            }
        } else {
            let left = -delta;
            // opened packages go first, then the nearest date
            list.sort((a, b) => (a.o ? 0 : 1) - (b.o ? 0 : 1) || a.d.localeCompare(b.d));
            for (const b of list) {
                const take = Math.min(b.q, left);
                b.q = Math.round((b.q - take) * 1000) / 1000;
                left -= take;
            }
            list = list.filter(b => b.q > 0);
        }
        // never track more than is in stock
        let sum = list.reduce((x, b) => x + b.q, 0);
        for (let i = list.length - 1; i >= 0 && sum > next + 1e-9; i--) {
            const cut = Math.min(list[i].q, sum - next);
            list[i].q = Math.round((list[i].q - cut) * 1000) / 1000;
            sum -= cut;
        }
        list = list.filter(b => b.q > 0).sort((a, b) => a.d.localeCompare(b.d));
        if (list.length) {
            all[productId][loc] = list;
        } else {
            delete all[productId][loc];
        }
        if (!Object.keys(all[productId]).length) {
            delete all[productId];
        }
    }

    /**
     * Stock and batches of one product at one location, to be able to undo a booking.
     *
     * @param {string} productId product id
     * @param {string} loc location id
     */
    snapshot(productId, loc) {
        return {
            s: Number(this.data.inventory[productId]?.[loc] || 0),
            b: JSON.parse(JSON.stringify(this.data.batches[productId]?.[loc] || [])),
        };
    }

    /**
     * Add a history entry, keep the history short and the undo data for the latest entries only.
     *
     * @param {object} entry history entry
     * @returns {string} id of the entry
     */
    logHistory(entry) {
        const h = this.data.history;
        h.push(entry);
        if (h.length > MAX_HISTORY) {
            this.data.history = h.slice(-MAX_HISTORY);
        }
        const old = this.data.history[this.data.history.length - 1 - UNDO_KEEP];
        if (old) {
            delete old.u;
        }
        return entry.id;
    }

    /**
     * Stock that was thrown away in the last days.
     *
     * @param {number} [days] period in days
     * @param {Date} [now] current time
     * @returns {{name: string, unit: string, n: number}[]} sorted by quantity
     */
    spoiled(days = 30, now = new Date()) {
        const since = now.getTime() - days * 86400000;
        const sum = {};
        for (const h of this.data.history) {
            if (
                h.kind === 'spoiled' &&
                !h.undone &&
                !h.nostat &&
                Date.parse(h.time) >= since &&
                this.data.products[h.productId]
            ) {
                sum[h.productId] = (sum[h.productId] || 0) - Number(h.delta || 0);
            }
        }
        return Object.entries(sum)
            .map(([id, n]) => ({ name: this.data.products[id].name, unit: this.data.products[id].unit || '', n }))
            .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    }

    /**
     * Standard shelf life of a product: its own value, otherwise a suggestion for dry goods (when switched on).
     *
     * @param {object} product product
     * @returns {number} days, 0 if none
     */
    shelfDays(product) {
        if (Number(product.shelfLifeDays) > 0) {
            return Number(product.shelfLifeDays);
        }
        if (!this.autoShelf) {
            return 0;
        }
        return guessShelfLife([product.name, product.category, product.group, ...(product.tags || [])].join(' '));
    }

    /**
     * Consumption of the last days from the history (moves between locations do not count).
     *
     * @param {number} [days] period in days
     * @param {Date} [now] current time
     * @returns {{name: string, unit: string, used: number, perWeek: number, suggestedMin: number}[]} sorted by use
     */
    consumption(days = 30, now = new Date()) {
        const since = now.getTime() - days * 86400000;
        const used = {};
        for (const h of this.data.history) {
            const d = Number(h.delta || 0);
            if (
                d < 0 &&
                !['move', 'stocktake', 'spoiled', 'undo'].includes(h.kind) &&
                !h.undone &&
                !h.nostat &&
                this.data.products[h.productId] &&
                Date.parse(h.time) >= since
            ) {
                used[h.productId] = (used[h.productId] || 0) - d;
            }
        }
        return Object.entries(used)
            .map(([id, n]) => {
                const p = this.data.products[id];
                const perWeek = Math.round((n / days) * 7 * 10) / 10;
                return {
                    name: p.name,
                    unit: p.unit || '',
                    used: Math.round(n * 100) / 100,
                    perWeek,
                    suggestedMin: Math.ceil(perWeek),
                };
            })
            .sort((a, b) => b.used - a.used || a.name.localeCompare(b.name));
    }

    /**
     * Products whose best-before date is expired or within the warning period.
     *
     * @param {'off' | 'product' | 'batch'} mode best-before mode
     * @param {number} warnDays warning period in days
     * @param {Date} [now] current time
     * @returns {object[]} entries sorted by date
     */
    expiryList(mode, warnDays, now = new Date()) {
        if (mode !== 'product' && mode !== 'batch') {
            return [];
        }
        const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const out = [];
        const add = (p, date, amount, place, opened = false) => {
            const days = Math.round((Date.parse(`${date}T00:00:00Z`) - today) / 86400000);
            if (days <= warnDays) {
                out.push({
                    name: p.name,
                    date,
                    days,
                    expired: days < 0,
                    amount,
                    place,
                    ...(opened ? { opened: true } : {}),
                });
            }
        };
        for (const p of Object.values(this.data.products)) {
            const amount = this.stockOf(p.id);
            if (amount <= 0) {
                continue;
            }
            if (mode === 'product') {
                if (p.bestBefore) {
                    add(p, p.bestBefore, amount, '');
                }
                continue;
            }
            for (const [loc, list] of Object.entries(this.data.batches[p.id] || {})) {
                const l = this.data.locations[loc];
                for (const b of list) {
                    if (b.d) {
                        add(p, b.d, b.q, l ? (l.group ? `${l.group} · ${l.name}` : l.name) : '', !!b.o);
                    }
                }
            }
        }
        return out.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
    }

    /**
     * Overview of everything that is in stock (for the inventory data point).
     *
     * @returns {object[]} items sorted by name
     */
    inventoryList() {
        const { products, locations, inventory } = this.data;
        const list = [];
        for (const p of Object.values(products)) {
            const places = Object.entries(inventory[p.id] || {})
                .filter(([id, n]) => Number(n) > 0 && locations[id])
                .map(([id, n]) => {
                    const l = locations[id];
                    return { place: l.group ? `${l.group} · ${l.name}` : l.name, amount: Number(n) };
                });
            const amount = places.reduce((sum, x) => sum + x.amount, 0);
            if (amount > 0) {
                list.push({
                    name: p.name,
                    brand: p.brand || '',
                    category: p.category || '',
                    amount,
                    unit: p.type === 'weight' ? 'g' : p.type === 'volume' ? 'ml' : p.unit || 'Stück',
                    minStock: Number(p.minStock) || 0,
                    low: this.isLow(p),
                    places,
                });
            }
        }
        return list.sort((x, y) => x.name.localeCompare(y.name));
    }

    /**
     * Execute a command and mutate the data. The caller must roll back on error.
     *
     * @param {object} cmd command from the web app
     * @returns {{changed: string[], [key: string]: object}} result
     */
    handle(cmd) {
        assert(cmd && typeof cmd === 'object', 'Invalid request');
        const d = this.data;
        switch (cmd.action) {
            case 'saveProduct': {
                const p = cmd.product || {};
                const name = clean(p.name, 180);
                const ean = clean(p.ean, 40);
                const type = ['count', 'weight', 'volume'].includes(p.type) ? p.type : 'count';
                assert(name.length > 0, 'Product name missing');
                assert(!ean || /^\d{8,14}$/.test(ean), 'Invalid barcode');
                if (ean) {
                    for (const x of Object.values(d.products)) {
                        if (x.ean === ean && x.id !== p.id) {
                            throw new Error(`Barcode already belongs to ${x.name}`);
                        }
                    }
                }
                const id = p.id && d.products[p.id] ? p.id : `p-${uuid()}`;
                const previous = d.products[id];
                const wasOff =
                    !!previous &&
                    (previous.source === 'off' ||
                        /\.open(food|beauty|petfood|products)facts\./i.test(previous.image || ''));
                if (wasOff && previous.ean && ean !== previous.ean) {
                    throw new Error('The barcode of Open Food Facts products cannot be changed');
                }
                if (
                    previous &&
                    previous.type !== type &&
                    Object.values(d.inventory[id] || {}).some(q => Number(q) > 0)
                ) {
                    throw new Error('Change the stock type only when the stock is zero');
                }
                const rawImage = typeof p.image === 'string' ? p.image.trim() : '';
                const uploaded = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(rawImage);
                assert(!uploaded || rawImage.length <= 48000, 'Image is too large');
                const image = uploaded ? rawImage : clean(p.image, 800);
                assert(!image || uploaded || /^https:\/\//i.test(image), 'Image URL must use HTTPS');
                const tags = Array.isArray(p.tags)
                    ? [...new Set(p.tags.map(t => clean(t, 60)).filter(Boolean))].slice(0, 30)
                    : previous?.tags || [];
                const minRaw = p.minStock === undefined ? previous?.minStock : p.minStock;
                const min = Math.floor(Number(minRaw));
                let nutriscore = previous?.nutriscore || '';
                if (/^[a-e]$/.test(p.nutriscore)) {
                    nutriscore = p.nutriscore;
                } else if (p.nutriscore === '') {
                    nutriscore = '';
                }
                d.products[id] = {
                    id,
                    name,
                    ean,
                    brand: clean(p.brand),
                    category: clean(p.category),
                    tags,
                    group: p.group === undefined ? previous?.group || '' : clean(p.group, 60),
                    minStock: Number.isFinite(min) && min > 0 && min <= 100000 ? min : 0,
                    nutriscore,
                    image,
                    source: wasOff || p.source === 'off' ? 'off' : '',
                    type,
                    unit: clean(p.unit, 30) || 'Stück',
                    packageSize: clean(p.packageSize, 50),
                    bestBefore: p.bestBefore === undefined ? previous?.bestBefore || '' : cleanDate(p.bestBefore),
                    shelfLifeDays: days(
                        p.shelfLifeDays === undefined ? previous?.shelfLifeDays : p.shelfLifeDays,
                        36500,
                    ),
                    openedDays: days(p.openedDays === undefined ? previous?.openedDays : p.openedDays, 3650),
                    incomplete: p.incomplete === undefined ? !!previous?.incomplete : !!p.incomplete,
                    createdAt: previous?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                return { changed: ['products'], productId: id };
            }
            case 'saveLocation': {
                const l = cmd.location || {};
                const group = clean(l.group, 80);
                const name = clean(l.name, 80);
                const qr = clean(l.qr, 400);
                assert(group && name, 'Area and name missing');
                const id = l.id && d.locations[l.id] ? l.id : `loc-${uuid()}`;
                const n = s =>
                    String(s || '')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .toLocaleLowerCase('de');
                assert(
                    !qr || !Object.values(d.locations).some(x => x.id !== id && n(x.qr) === n(qr)),
                    'QR code is already assigned to another location',
                );
                d.locations[id] = {
                    id,
                    group,
                    name,
                    qr,
                    ...(d.locations[id]?.stocktake ? { stocktake: d.locations[id].stocktake } : {}),
                };
                if (!d.areas.includes(group)) {
                    d.areas.push(group);
                }
                return { changed: ['locations', 'areas'], locationId: id };
            }
            case 'fillShelfLife': {
                let filled = 0;
                for (const p of Object.values(d.products)) {
                    if (!(Number(p.shelfLifeDays) > 0)) {
                        const guess = guessShelfLife([p.name, p.category, p.group, ...(p.tags || [])].join(' '));
                        if (guess > 0) {
                            p.shelfLifeDays = guess;
                            filled++;
                        }
                    }
                }
                // stock without a date gets the stocking day plus the shelf life
                let dated = 0;
                let open = 0;
                if (this.bbMode === 'batch') {
                    for (const [pid, locs] of Object.entries(d.inventory)) {
                        const p = d.products[pid];
                        const life = p ? Number(p.shelfLifeDays) : 0;
                        if (!(life > 0)) {
                            continue;
                        }
                        for (const [loc, have] of Object.entries(locs)) {
                            const list = (d.batches[pid]?.[loc] || []).map(x => ({ ...x }));
                            let left = Math.round((Number(have) - list.reduce((n, x) => n + x.q, 0)) * 1000) / 1000;
                            const arrivals = d.history.filter(
                                h =>
                                    h.productId === pid &&
                                    h.locationId === loc &&
                                    Number(h.delta) > 0 &&
                                    !h.undone &&
                                    !['stocktake', 'undo'].includes(h.kind),
                            );
                            for (let i = arrivals.length - 1; i >= 0 && left > 0; i--) {
                                const take = Math.min(left, Number(arrivals[i].delta));
                                const date = addDays(life, new Date(arrivals[i].time));
                                const hit = list.find(x => x.d === date && !x.o);
                                if (hit) {
                                    hit.q = Math.round((hit.q + take) * 1000) / 1000;
                                } else {
                                    list.push({ d: date, q: take });
                                }
                                left = Math.round((left - take) * 1000) / 1000;
                                dated++;
                            }
                            if (left > 0) {
                                open++;
                            }
                            if (list.length) {
                                d.batches[pid] = {
                                    ...d.batches[pid],
                                    [loc]: list.sort((x, y) => x.d.localeCompare(y.d)),
                                };
                            }
                        }
                    }
                }
                return { changed: filled || dated ? ['products', 'batches'] : [], filled, dated, open };
            }
            case 'resetStats': {
                for (const h of d.history) {
                    h.nostat = true;
                }
                return { changed: ['history'] };
            }
            case 'markStocktake': {
                const id = clean(cmd.locationId);
                assert(d.locations[id], 'Location not found');
                d.locations[id].stocktake = new Date().toISOString();
                return { changed: ['locations'] };
            }
            case 'changeStock': {
                const id = clean(cmd.productId);
                const loc = clean(cmd.locationId);
                const delta = Number(cmd.delta);
                const product = d.products[id];
                assert(product, 'Product not found');
                assert(d.locations[loc], 'Location not found');
                assert(Number.isFinite(delta) && delta !== 0 && Math.abs(delta) <= 1e7, 'Invalid quantity');
                assert(product.type !== 'count' || Number.isInteger(delta), 'Counts must be whole numbers');
                assert(cmd.kind !== 'spoiled' || delta < 0, 'Only taken out stock can be spoiled');
                const existing = Number(d.inventory[id]?.[loc] || 0);
                const next = Math.round((existing + delta) * 1000) / 1000;
                assert(next >= 0, 'Not enough stock');
                const snapshot = this.snapshot(id, loc);
                let date = cleanDate(cmd.bestBefore);
                if (
                    !date &&
                    delta > 0 &&
                    this.bbMode === 'batch' &&
                    this.shelfDays(product) > 0 &&
                    !['move', 'stocktake'].includes(cmd.kind)
                ) {
                    date = addDays(this.shelfDays(product));
                }
                const before = this.members(product).reduce((s, x) => s + this.stockOf(x.id), 0);
                if (!d.inventory[id]) {
                    d.inventory[id] = {};
                }
                if (next === 0) {
                    delete d.inventory[id][loc];
                } else {
                    d.inventory[id][loc] = next;
                }
                this.updateBatches(id, loc, delta, next, date);
                const historyId = this.logHistory({
                    id: `h-${uuid()}`,
                    time: new Date().toISOString(),
                    productId: id,
                    name: product.name,
                    locationId: loc,
                    delta,

                    ...(['move', 'stocktake', 'spoiled'].includes(cmd.kind) ? { kind: cmd.kind } : {}),
                    u: snapshot,
                    ...(clean(cmd.device, 60) ? { device: clean(cmd.device, 60) } : {}),
                });
                const members = this.members(product);
                const min = Math.max(0, ...members.map(x => Number(x.minStock) || 0));
                const after = members.reduce((s, x) => s + this.stockOf(x.id), 0);
                const reorder = min > 0 && before > min && after <= min ? listName(product.group || product.name) : '';
                const restock = min > 0 && before <= min && after > min ? listName(product.group || product.name) : '';
                return { changed: ['inventory', 'batches', 'history'], total: next, reorder, restock, historyId };
            }
            case 'openUnit': {
                const id = clean(cmd.productId);
                const loc = clean(cmd.locationId);
                const product = d.products[id];
                assert(product, 'Product not found');
                assert(d.locations[loc], 'Location not found');
                const per = product.type === 'count' ? 1 : unitAmount(product);
                assert(per > 0, 'Package size missing');
                const have = Number(d.inventory[id]?.[loc] || 0);
                const list = (d.batches[id]?.[loc] || []).map(b => ({ ...b }));
                const opened = list.filter(b => b.o).reduce((s, b) => s + b.q, 0);
                const amount = Math.min(per, Math.round((have - opened) * 1000) / 1000);
                assert(amount > 0, 'Nothing left to open');
                const snapshot = this.snapshot(id, loc);
                let need = amount;
                let from = '';
                for (const b of list.filter(x => !x.o).sort((a, b) => a.d.localeCompare(b.d))) {
                    const take = Math.min(b.q, need);
                    if (take > 0 && !from) {
                        from = b.d;
                    }
                    b.q = Math.round((b.q - take) * 1000) / 1000;
                    need = Math.round((need - take) * 1000) / 1000;
                }
                const limit = product.openedDays > 0 ? addDays(product.openedDays) : '';
                const date = limit && from ? (limit < from ? limit : from) : limit || from;
                const same = list.find(b => b.o && b.d === date && (b.f || '') === from);
                if (same) {
                    same.q = Math.round((same.q + amount) * 1000) / 1000;
                } else {
                    list.push({ d: date, q: amount, o: 1, ...(from ? { f: from } : {}) });
                }
                const kept = list.filter(b => b.q > 0).sort((a, b) => a.d.localeCompare(b.d));
                if (!d.batches[id]) {
                    d.batches[id] = {};
                }
                d.batches[id][loc] = kept;
                const historyId = this.logHistory({
                    id: `h-${uuid()}`,
                    time: new Date().toISOString(),
                    productId: id,
                    name: product.name,
                    locationId: loc,
                    delta: 0,
                    kind: 'open',
                    ...(clean(cmd.device, 60) ? { device: clean(cmd.device, 60) } : {}),
                    u: snapshot,
                });
                return {
                    changed: ['batches', 'history'],
                    productId: id,
                    locationId: loc,
                    opened: amount,
                    until: date,
                    historyId,
                };
            }
            case 'closeUnit': {
                const id = clean(cmd.productId);
                const loc = clean(cmd.locationId);
                const product = d.products[id];
                assert(product, 'Product not found');
                const list = (d.batches[id]?.[loc] || []).map(b => ({ ...b }));
                const open = list.find(b => b.o);
                assert(open, 'Nothing opened here');
                const per = product.type === 'count' ? 1 : unitAmount(product) || open.q;
                const amount = Math.min(per, open.q);
                const back = open.f || '';
                open.q = Math.round((open.q - amount) * 1000) / 1000;
                const target = list.find(b => !b.o && b.d === back);
                if (target) {
                    target.q = Math.round((target.q + amount) * 1000) / 1000;
                } else {
                    list.push({ d: back, q: amount });
                }
                d.batches[id][loc] = list.filter(b => b.q > 0).sort((a, b) => a.d.localeCompare(b.d));
                return { changed: ['batches'], productId: id, locationId: loc, closed: amount };
            }
            case 'undo': {
                // entries that were taken back already do not count, so several undos go further back
                let at = d.history.length - 1;
                while (at >= 0 && (d.history[at].kind === 'undo' || d.history[at].undone)) {
                    at--;
                }
                const last = d.history[at];
                assert(last && last.u && !last.undone && last.kind !== 'undo', 'Nothing to undo');
                assert(!cmd.historyId || cmd.historyId === last.id, 'The last booking has changed');
                assert(!['move', 'stocktake'].includes(last.kind), 'Moves and stocktakes cannot be undone');
                assert(d.products[last.productId] && d.locations[last.locationId], 'Product or location is gone');
                const { productId: id, locationId: loc } = last;
                if (last.u.s > 0) {
                    d.inventory[id] = { ...d.inventory[id], [loc]: last.u.s };
                } else if (d.inventory[id]) {
                    delete d.inventory[id][loc];
                }
                if (d.inventory[id] && !Object.keys(d.inventory[id]).length) {
                    delete d.inventory[id];
                }
                if (last.u.b.length) {
                    d.batches[id] = { ...d.batches[id], [loc]: last.u.b };
                } else if (d.batches[id]) {
                    delete d.batches[id][loc];
                    if (!Object.keys(d.batches[id]).length) {
                        delete d.batches[id];
                    }
                }
                last.undone = true;
                delete last.u;
                this.logHistory({
                    id: `h-${uuid()}`,
                    time: new Date().toISOString(),
                    productId: id,
                    name: last.name,
                    locationId: loc,
                    delta: -Number(last.delta || 0),
                    kind: 'undo',
                    undoOf: last.id,
                    ...(clean(cmd.device, 60) ? { device: clean(cmd.device, 60) } : {}),
                });
                return {
                    changed: ['inventory', 'batches', 'history'],
                    productId: id,
                    locationId: loc,
                    undone: { name: last.name, delta: last.delta, kind: last.kind || '' },
                };
            }
            case 'deleteProduct': {
                const id = clean(cmd.productId);
                assert(d.products[id], 'Product not found');
                delete d.products[id];
                delete d.inventory[id];
                delete d.batches[id];
                return { changed: ['products', 'inventory'] };
            }
            case 'deleteLocation': {
                const id = clean(cmd.locationId);
                assert(d.locations[id], 'Location not found');
                for (const inv of Object.values(d.inventory)) {
                    assert(!(Number(inv?.[id] || 0) > 0), 'Location still contains stock');
                }
                for (const inv of Object.values(d.inventory)) {
                    if (inv && id in inv) {
                        delete inv[id];
                    }
                }
                for (const b of Object.values(d.batches)) {
                    if (b && id in b) {
                        delete b[id];
                    }
                }
                delete d.locations[id];
                return { changed: ['locations', 'inventory'] };
            }
            case 'saveArea': {
                const name = clean(cmd.name, 80);
                const old = clean(cmd.oldName, 80);
                assert(name, 'Area name missing');
                const n = s =>
                    String(s || '')
                        .trim()
                        .toLocaleLowerCase('de');
                assert(!d.areas.some(a => a !== old && n(a) === n(name)), 'Area already exists');
                if (old) {
                    const i = d.areas.indexOf(old);
                    if (i >= 0) {
                        d.areas[i] = name;
                    } else {
                        d.areas.push(name);
                    }
                    for (const l of Object.values(d.locations)) {
                        if (l.group === old) {
                            l.group = name;
                        }
                    }
                } else {
                    d.areas.push(name);
                }
                return { changed: ['areas', 'locations'] };
            }
            case 'deleteArea': {
                const name = clean(cmd.name, 80);
                assert(!Object.values(d.locations).some(l => l.group === name), 'Area still contains locations');
                d.areas = d.areas.filter(a => a !== name);
                return { changed: ['areas'] };
            }
            case 'suggestGroups': {
                const clusters = {};
                for (const p of Object.values(d.products)) {
                    const key = nameKey(p.name);
                    if (key) {
                        (clusters[`${key}|${p.type}`] ||= []).push(p);
                    }
                }
                const suggestions = Object.entries(clusters)
                    .filter(
                        ([, list]) => list.length > 1 && !(list[0].group && list.every(x => x.group === list[0].group)),
                    )
                    .map(([key, list]) => {
                        const existing = list.find(x => x.group)?.group;
                        const word = String(list.slice().sort((a, b) => a.name.length - b.name.length)[0].name)
                            .replace(/[([{].*$/, '')
                            .split(/\s[-–—]\s|,/)[0]
                            .trim();
                        return {
                            key,
                            group: existing || clean(word || key, 60),
                            products: list.map(x => ({ id: x.id, name: x.name, group: x.group || '' })),
                        };
                    })
                    .sort((a, b) => a.group.localeCompare(b.group));
                return { changed: [], suggestions };
            }
            case 'resetData': {
                this.data = Inventory.normalize(defaultData(this.lang));
                this.addExample();
                return { changed: ['products', 'inventory', 'batches', 'locations', 'history', 'areas'] };
            }
            case 'importData': {
                const src = cmd.data;
                const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
                assert(isObj(src) && isObj(src.products) && isObj(src.locations), 'Not a ShelfMate backup');
                const next = Inventory.normalize(src);
                for (const [id, p] of Object.entries(next.products)) {
                    assert(isObj(p) && clean(p.name), 'Backup contains a product without a name');
                    p.id = id;
                }
                for (const [id, l] of Object.entries(next.locations)) {
                    assert(isObj(l) && clean(l.name) && clean(l.group), 'Backup contains an incomplete location');
                    l.id = id;
                }
                this.data = next;
                return {
                    changed: ['products', 'inventory', 'batches', 'locations', 'history', 'areas'],
                    products: Object.keys(next.products).length,
                };
            }
            default:
                throw new Error(`Unknown action: ${clean(cmd.action, 40)}`);
        }
    }
}

module.exports = { Inventory, clean, listName, uuid, assert };
