'use strict';

/**
 * Booking by an external barcode scanner without the app (headless mode).
 *
 * Product, then location code within the time limit: stock in.
 * Product twice: take out the item with the nearest best-before date.
 * Product twice, then location code: take out of exactly that location.
 * Control codes: SM:QTY:<n> (quantity of the next booking) and SM:CANCEL.
 */

const MAX_QTY = 999;
const QTY_VALID_MS = 60000;

const TEXT = {
    en: {
        needProduct: 'Scan a product first',
        unknown: 'Unknown code: {1}',
        askLocation: '{1}: scan a location to stock in, scan again to take out',
        askAgain: '{1} ×{2}: scan a location to take out of it, or wait to take out automatically',
        stockedIn: '{1} ×{2} stocked in at {3}',
        takenOut: '{1} ×{2} taken out of {3}',
        none: '{1} is not in stock',
        notThere: '{1} is not in {2}',
        notEnough: 'Not enough of {1} in {2}',
        timeout: 'Time is up, nothing booked',
        qty: 'Quantity {1} for the next booking',
        cancel: 'Cancelled',
        noAmount: '{1} has no package size in g or ml, book it in the app',
        error: 'Error: {1}',
    },
    de: {
        needProduct: 'Erst ein Produkt scannen',
        unknown: 'Unbekannter Code: {1}',
        askLocation: '{1}: Lagerort scannen zum Einlagern, nochmal scannen zum Entnehmen',
        askAgain: '{1} ×{2}: Lagerort scannen zum Entnehmen dort, oder warten für automatische Entnahme',
        stockedIn: '{1} ×{2} eingelagert in {3}',
        takenOut: '{1} ×{2} entnommen aus {3}',
        none: '{1} ist nicht auf Lager',
        notThere: '{1} liegt nicht in {2}',
        notEnough: 'Von {1} ist in {2} nicht genug da',
        timeout: 'Zeit abgelaufen, nichts gebucht',
        qty: 'Menge {1} für die nächste Buchung',
        cancel: 'Abgebrochen',
        noAmount: '{1} hat keine Packungsgröße in g oder ml, bitte in der App buchen',
        error: 'Fehler: {1}',
    },
};

/**
 * @param {string} s text
 */
function norm(s) {
    return String(s ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

/**
 * @param {string} s barcode
 */
function digits(s) {
    return String(s ?? '')
        .replace(/\D/g, '')
        .replace(/^0+/, '');
}

/**
 * Amount in the base unit that one scan stands for: 1 for counted products, the package size for weight and volume.
 *
 * @param {object} p product
 * @returns {number} 0 when it cannot be derived
 */
function unitAmount(p) {
    if (p.type === 'count') {
        return 1;
    }
    const m = /(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\b/i.exec(String(p.packageSize || ''));
    if (!m) {
        return 0;
    }
    const n = Number(m[1].replace(',', '.'));
    const f = { kg: 1000, g: 1, l: 1000, cl: 10, ml: 1 }[m[2].toLowerCase()];
    if (p.type === 'weight' && !/g/i.test(m[2])) {
        return 0;
    }
    if (p.type === 'volume' && !/l/i.test(m[2])) {
        return 0;
    }
    return Math.round(n * f * 1000) / 1000;
}

/**
 * Booking state machine of the scanner mode.
 */
class ScanEngine {
    /**
     * @param {{data: object, handle: (cmd: object) => object}} inv Inventory
     * @param {{timeoutMs?: number, device?: string, lang?: string, run?: (cmd: object) => object}} [opt] options
     */
    constructor(inv, opt = {}) {
        this.inv = inv;
        this.timeoutMs = opt.timeoutMs || 10000;
        this.device = opt.device || 'scanner';
        this.t = TEXT[opt.lang] || TEXT.en;
        this.run = opt.run || (cmd => this.inv.handle(cmd));
        this.pending = null;
        this.qty = 0;
        this.qtyUntil = 0;
    }

    /**
     * @param {string} key text key
     * @param {...(string | number)} args values for {1}, {2}, ...
     */
    say(key, ...args) {
        return args.reduce((s, a, i) => s.replace(`{${i + 1}}`, String(a)), this.t[key]);
    }

    /** Time at which the waiting scan runs out, 0 when nothing waits. */
    get deadline() {
        return this.pending ? this.pending.deadline : 0;
    }

    /**
     * @param {string} code scanned text
     */
    findLocation(code) {
        const n = norm(code);
        return Object.values(this.inv.data.locations).find(
            l => (l.qr && norm(l.qr) === n) || norm(`${l.group} ${l.name}`) === n || `sm:l:${l.id}` === n,
        );
    }

    /**
     * @param {string} code scanned text
     */
    findProduct(code) {
        const c = digits(code);
        if (!c) {
            return undefined;
        }
        return Object.values(this.inv.data.products).find(
            p => digits(p.ean) === c || (Array.isArray(p.barcodes) && p.barcodes.some(b => digits(b) === c)),
        );
    }

    /**
     * Quantity for the booking, the quantity code counts once.
     *
     * @param {number} now time in ms
     */
    takeQty(now) {
        const q = this.qty && now <= this.qtyUntil ? this.qty : 1;
        this.qty = 0;
        return q;
    }

    /**
     * Book a stock change.
     *
     * @param {string} productId product id
     * @param {string} locationId location id
     * @param {number} delta change of the stock
     */
    book(productId, locationId, delta) {
        this.run({ action: 'changeStock', productId, locationId, delta, device: this.device });
    }

    /**
     * Locations with stock, the one with the nearest best-before date first, then the biggest stock.
     *
     * @param {string} productId product
     */
    outOrder(productId) {
        const d = this.inv.data;
        return Object.entries(d.inventory[productId] || {})
            .filter(([id, n]) => Number(n) > 0 && d.locations[id])
            .map(([id, n]) => {
                const dates = ((d.batches[productId] || {})[id] || [])
                    .filter(b => b.q > 0 && b.d)
                    .map(b => b.d)
                    .sort();
                return { id, stock: Number(n), date: dates[0] || '' };
            })
            .sort((a, b) => {
                if (a.date && b.date && a.date !== b.date) {
                    return a.date < b.date ? -1 : 1;
                }
                if (!!a.date !== !!b.date) {
                    return a.date ? -1 : 1;
                }
                return b.stock - a.stock;
            });
    }

    /**
     * Name of a location.
     *
     * @param {string} id location id
     */
    locName(id) {
        const l = this.inv.data.locations[id];
        return l ? l.name : id;
    }

    /**
     * Take out without a location, over several locations when one is not enough.
     *
     * @param {object} p product
     * @param {number} qty quantity in scans
     */
    autoOut(p, qty) {
        const per = unitAmount(p);
        if (!per) {
            return { ok: false, action: 'out', text: this.say('noAmount', p.name) };
        }
        const order = this.outOrder(p.id);
        if (!order.length) {
            return { ok: false, action: 'out', text: this.say('none', p.name) };
        }
        let rest = qty * per;
        const places = [];
        for (const o of order) {
            if (rest <= 0) {
                break;
            }
            const take = Math.min(rest, o.stock);
            this.book(p.id, o.id, -take);
            places.push(this.locName(o.id));
            rest = Math.round((rest - take) * 1000) / 1000;
        }
        return {
            ok: true,
            action: 'out',
            productId: p.id,
            text:
                this.say('takenOut', p.name, qty, places.join(', ')) +
                (rest > 0 ? ` (${this.say('none', p.name)})` : ''),
        };
    }

    /**
     * @param {object} p product
     * @param {object} l location
     * @param {number} qty quantity in scans
     * @param {boolean} out take out instead of stock in
     */
    atLocation(p, l, qty, out) {
        const per = unitAmount(p);
        if (!per) {
            return { ok: false, action: out ? 'out' : 'in', text: this.say('noAmount', p.name) };
        }
        const amount = qty * per;
        if (out) {
            const have = Number(this.inv.data.inventory[p.id]?.[l.id] || 0);
            if (have <= 0) {
                return { ok: false, action: 'out', text: this.say('notThere', p.name, l.name) };
            }
            if (have < amount) {
                return { ok: false, action: 'out', text: this.say('notEnough', p.name, l.name) };
            }
        }
        this.book(p.id, l.id, out ? -amount : amount);
        return {
            ok: true,
            action: out ? 'out' : 'in',
            productId: p.id,
            locationId: l.id,
            text: this.say(out ? 'takenOut' : 'stockedIn', p.name, qty, l.name),
        };
    }

    /**
     * Finish a waiting scan without a location.
     *
     * @param {number} now time in ms
     */
    resolvePending(now) {
        const w = this.pending;
        this.pending = null;
        if (!w) {
            return null;
        }
        const p = this.inv.data.products[w.productId];
        if (w.n < 2 || !p) {
            this.qty = 0;
            return { ok: false, action: 'timeout', text: this.say('timeout') };
        }
        return this.autoOut(p, this.takeQty(now));
    }

    /**
     * Call when the deadline has passed.
     *
     * @param {number} [now] time in ms
     */
    flush(now = Date.now()) {
        if (!this.pending || now < this.pending.deadline) {
            return null;
        }
        try {
            return this.resolvePending(now);
        } catch (e) {
            return { ok: false, action: 'error', text: this.say('error', e.message) };
        }
    }

    /**
     * @param {string} raw scanned text
     * @param {number} [now] time in ms
     */
    handle(raw, now = Date.now()) {
        try {
            const earlier = this.flush(now);
            const r = this.process(String(raw ?? '').trim(), now);
            return earlier ? { ...r, earlier } : r;
        } catch (e) {
            this.pending = null;
            return { ok: false, action: 'error', text: this.say('error', e.message) };
        }
    }

    /**
     * Handle one trimmed code.
     *
     * @param {string} code scanned text
     * @param {number} now time in ms
     */
    process(code, now) {
        const q = /^sm:qty:(\d{1,3})$/i.exec(code);
        if (q) {
            const n = Number(q[1]);
            if (n < 1 || n > MAX_QTY) {
                return { ok: false, action: 'qty', text: this.say('unknown', code) };
            }
            this.qty = n;
            this.qtyUntil = now + QTY_VALID_MS;
            return { ok: true, action: 'qty', text: this.say('qty', n) };
        }
        if (/^sm:cancel$/i.test(code)) {
            this.pending = null;
            this.qty = 0;
            return { ok: true, action: 'cancel', text: this.say('cancel') };
        }
        const loc = this.findLocation(code);
        if (loc) {
            const w = this.pending;
            if (!w) {
                return { ok: false, action: 'ignored', text: this.say('needProduct') };
            }
            const p = this.inv.data.products[w.productId];
            this.pending = null;
            return this.atLocation(p, loc, this.takeQty(now), w.n >= 2);
        }
        const p = this.findProduct(code);
        if (!p) {
            return { ok: false, action: 'ignored', text: this.say('unknown', code) };
        }
        const w = this.pending;
        if (w && w.productId === p.id) {
            w.n += 1;
            w.deadline = now + this.timeoutMs;
            return { ok: true, action: 'wait', productId: p.id, text: this.say('askAgain', p.name, this.qty || 1) };
        }
        const earlier = w ? this.resolvePending(now) : null;
        this.pending = { productId: p.id, n: 1, deadline: now + this.timeoutMs };
        const r = { ok: true, action: 'wait', productId: p.id, text: this.say('askLocation', p.name) };
        return earlier ? { ...r, earlier } : r;
    }
}

module.exports = { ScanEngine, unitAmount, norm };
