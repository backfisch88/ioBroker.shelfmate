'use strict';

/**
 * Booking by an external barcode scanner without the app (headless mode).
 *
 * Product, then location code within the time limit: stock in.
 * Product twice: take out the item with the nearest best-before date.
 * Product twice, then location code: take out of exactly that location.
 * A location code without a waiting product starts stocking mode: every product scanned afterwards is stocked in at
 * that location, the same location code (or time) ends it.
 * Control codes: SM:QTY:<n> (quantity of the next booking), SM:CANCEL, SM:UNDO (take back the last scan),
 * SM:SPOIL (the next take-out counts as spoiled) and SM:OPEN (the next product scanned is marked as opened).
 */

const MAX_QTY = 999;
const QTY_VALID_MS = 60000;
const SESSION_MS = 300000;

const TEXT = {
    en: {
        sessionStart: '{1}: stocking started, scan the products, scan the location again to finish',
        sessionAdd: '{1} ×{2} in {3} ({4} in total)',
        sessionEnd: '{1}: stocking finished, {2} items',
        unknown: 'Unknown code: {1}',
        rule: '{1}x: ',
        noLast: '{1}: no last location known, scan a location',
        emptied: '{1}: stock set to 0 ({2} taken out)',
        shopAdded: '{1}: put on the shopping list',
        shopRemoved: '{1}: removed from the shopping list',
        closed: '{1} closed again in {2}',
        sessionDate: 'Best-before date {1} for all following products',
        sessionDateOff: 'Best-before date off for the following products',
        copySet: 'Scan the product whose best-before date is to be copied',
        copyNone: '{1} has no best-before date',
        copyDone: '{1}: date {2} copied for the following products',
        copyApply: '{1}: date {2} copied, scan the product that gets it',
        created: 'New product created: {1}. ',
        createdIncomplete: 'Not in the database, created as incomplete: {1} (complete it in the app). ',
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
        undone: 'Undone: {1}',
        nothingUndo: 'Nothing to undo',
        undoChanged: 'The last booking has changed, cannot undo',
        spoilSet: 'The next take-out counts as spoiled',
        openSet: 'Scan the product that was opened',
        dateSet: 'Scan the product to date: best before in {1} days',
        dateClear: 'Scan the product to remove its best-before date',
        dated: '{1}: best before {2} for all stock',
        dateCleared: '{1}: best-before date removed',
        nothingDate: '{1} has no unopened stock',
        opened: '{1} opened in {2}',
        nothingOpen: 'Nothing left to open of {1}',
        spoiledNote: '(spoiled)',
        noAmount: '{1} has no package size in g or ml, book it in the app',
        error: 'Error: {1}',
    },
    de: {
        sessionStart: '{1}: Einräumen gestartet, Produkte scannen, zum Beenden den Lagerort nochmal scannen',
        sessionAdd: '{1} ×{2} in {3} (insgesamt {4})',
        sessionEnd: '{1}: Einräumen beendet, {2} Stück',
        unknown: 'Unbekannter Code: {1}',
        rule: '{1}x: ',
        noLast: '{1}: kein letzter Lagerort bekannt, bitte Lagerort scannen',
        emptied: '{1}: Bestand auf 0 gesetzt ({2} entnommen)',
        shopAdded: '{1}: auf die Einkaufsliste gesetzt',
        shopRemoved: '{1}: von der Einkaufsliste entfernt',
        closed: '{1} wieder geschlossen in {2}',
        sessionDate: 'MHD {1} für alle folgenden Produkte',
        sessionDateOff: 'MHD für die folgenden Produkte aus',
        copySet: 'Produkt scannen, dessen MHD übernommen werden soll',
        copyNone: '{1} hat kein MHD',
        copyDone: '{1}: MHD {2} für die folgenden Produkte übernommen',
        copyApply: '{1}: MHD {2} übernommen, jetzt das Produkt scannen, das es bekommt',
        created: 'Neues Produkt angelegt: {1}. ',
        createdIncomplete: 'Nicht in der Datenbank, unvollständig angelegt: {1} (in der App vervollständigen). ',
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
        undone: 'Rückgängig: {1}',
        nothingUndo: 'Nichts zum Rückgängigmachen',
        undoChanged: 'Die letzte Buchung hat sich geändert, nicht rückgängig zu machen',
        spoilSet: 'Die nächste Entnahme zählt als verdorben',
        openSet: 'Das geöffnete Produkt scannen',
        dateSet: 'Produkt scannen: MHD in {1} Tagen',
        dateClear: 'Produkt scannen: MHD entfernen',
        dated: '{1}: MHD {2} für den ganzen Bestand',
        dateCleared: '{1}: MHD entfernt',
        nothingDate: '{1} hat keinen ungeöffneten Bestand',
        opened: '{1} geöffnet in {2}',
        nothingOpen: 'Von {1} ist nichts mehr zum Öffnen da',
        spoiledNote: '(verdorben)',
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
        .toLowerCase()
        .normalize('NFC')
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Short form of a location id for printed codes.
 *
 * @param {string} id location id
 */
function shortId(id) {
    return String(id ?? '')
        .replace(/^loc-/, '')
        .replace(/-/g, '')
        .slice(0, 8);
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
 * Date a number of days from today.
 *
 * @param {number} days days, 0 for no date
 * @returns {string} YYYY-MM-DD, empty for 0
 */
function isoIn(days) {
    if (!days) {
        return '';
    }
    const t = new Date(Date.now() + days * 86400000);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
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
        this.windowMs = opt.windowMs || 3000;
        this.rules = new Map();
        for (const r of Array.isArray(opt.rules) ? opt.rules : []) {
            const n = Math.floor(Number(r && r.count));
            if (n >= 3 && n <= 20 && r.action && r.action !== 'none') {
                this.rules.set(n, { action: String(r.action), value: String(r.value ?? '').trim() });
            }
        }
        this.pending = null;
        this.session = null;
        this.qty = 0;
        this.qtyUntil = 0;
        this.cur = [];
        this.undoStack = [];
        this.mark = null;
        this.now = 0;
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
        if (this.pending) {
            return this.pending.deadline;
        }
        return this.session ? this.session.until : 0;
    }

    /**
     * @param {string} code scanned text
     */
    findLocation(code) {
        const n = norm(code);
        return Object.values(this.inv.data.locations).find(
            l =>
                (l.qr && norm(l.qr) === n) ||
                norm(`${l.group} ${l.name}`) === n ||
                `sm:l:${l.id}` === n ||
                `sm:l:${shortId(l.id)}` === n,
        );
    }

    /**
     * True for a barcode that is neither a product nor a location nor a control code yet.
     *
     * @param {string} code scanned text
     */
    isNewBarcode(code) {
        const c = String(code ?? '').trim();
        return /^\d{8,14}$/.test(c) && !this.findProduct(c) && !this.findLocation(c);
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
     * @param {string} [kind] booking kind, for example spoiled
     * @param {string} [date] best-before date of stock that is stocked in
     */
    book(productId, locationId, delta, kind, date) {
        this.exec({
            action: 'changeStock',
            productId,
            locationId,
            delta,
            device: this.device,
            ...(kind ? { kind } : {}),
            ...(date ? { bestBefore: date } : {}),
        });
    }

    /**
     * Run a command and remember its history entry for SM:UNDO.
     *
     * @param {object} cmd command
     */
    exec(cmd) {
        const r = this.run(cmd);
        if (r && r.historyId) {
            this.cur.push(r.historyId);
        }
        return r;
    }

    /**
     * The spoiled code applies to the next take-out only.
     *
     * @returns {string} booking kind, empty for a normal take-out
     */
    takeKind() {
        const m = this.mark;
        if (m && m.kind === 'spoil') {
            this.mark = null;
            if (this.now <= m.until) {
                return 'spoiled';
            }
        }
        return '';
    }

    /**
     * Take back the last scan.
     */
    undo() {
        this.pending = null;
        const ids = this.undoStack.pop();
        if (!ids) {
            return { ok: false, action: 'undo', text: this.say('nothingUndo') };
        }
        const names = [];
        for (let i = ids.length - 1; i >= 0; i--) {
            try {
                const r = this.run({ action: 'undo', historyId: ids[i], device: this.device });
                if (r && r.undone && !names.includes(r.undone.name)) {
                    names.push(r.undone.name);
                }
            } catch {
                return { ok: false, action: 'undo', text: this.say('undoChanged') };
            }
        }
        return { ok: true, action: 'undo', text: this.say('undone', names.join(', ')) };
    }

    /**
     * Mark one package of a product as opened.
     *
     * @param {object} p product
     */
    openProduct(p) {
        const order = this.outOrder(p.id);
        if (!order.length) {
            return { ok: false, action: 'open', text: this.say('none', p.name) };
        }
        for (const o of order) {
            try {
                const r = this.exec({ action: 'openUnit', productId: p.id, locationId: o.id, device: this.device });
                return {
                    ok: true,
                    action: 'open',
                    productId: p.id,
                    locationId: o.id,
                    text: this.say('opened', p.name, this.locName(o.id)) + (r && r.until ? ` (${r.until})` : ''),
                };
            } catch {
                // nothing left to open here, try the next location
            }
        }
        return { ok: false, action: 'open', text: this.say('nothingOpen', p.name) };
    }

    /**
     * Set one best-before date for all unopened stock of a product.
     *
     * @param {object} p product
     * @param {number} days days from today, 0 removes the date
     * @param {string} [fixed] date to set instead of days from today
     */
    dateProduct(p, days, fixed) {
        const to = fixed || isoIn(days);
        let n = 0;
        for (const o of this.outOrder(p.id)) {
            try {
                this.exec({ action: 'setAllDates', productId: p.id, locationId: o.id, to, device: this.device });
                n++;
            } catch {
                // only opened stock here
            }
        }
        if (!n) {
            return { ok: false, action: 'date', text: this.say('nothingDate', p.name) };
        }
        return {
            ok: true,
            action: 'date',
            productId: p.id,
            text: to ? this.say('dated', p.name, to) : this.say('dateCleared', p.name),
        };
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
        const kind = this.takeKind();
        const places = [];
        for (const o of order) {
            if (rest <= 0) {
                break;
            }
            const take = Math.min(rest, o.stock);
            this.book(p.id, o.id, -take, kind);
            places.push(this.locName(o.id));
            rest = Math.round((rest - take) * 1000) / 1000;
        }
        return {
            ok: true,
            action: 'out',
            productId: p.id,
            text:
                this.say('takenOut', p.name, qty, places.join(', ')) +
                (kind ? ` ${this.say('spoiledNote')}` : '') +
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
        const kind = out ? this.takeKind() : '';
        this.book(p.id, l.id, out ? -amount : amount, kind);
        return {
            ok: true,
            action: out ? 'out' : 'in',
            productId: p.id,
            locationId: l.id,
            text:
                this.say(out ? 'takenOut' : 'stockedIn', p.name, qty, l.name) +
                (kind ? ` ${this.say('spoiledNote')}` : ''),
        };
    }

    /** End stocking mode, everything scanned is booked already. */
    endSession() {
        const w = this.session;
        this.session = null;
        return { ok: true, action: 'sessionEnd', text: this.say('sessionEnd', this.locName(w.locationId), w.n) };
    }

    /**
     * Stock in a scanned product in stocking mode.
     *
     * @param {object} p product
     * @param {number} now time in ms
     */
    sessionAdd(p, now) {
        const w = this.session;
        const per = unitAmount(p);
        if (!per) {
            return { ok: false, action: 'in', text: this.say('noAmount', p.name) };
        }
        const qty = this.takeQty(now);
        this.book(p.id, w.locationId, qty * per, '', w.date);
        w.n += qty;
        w.until = now + SESSION_MS;
        return {
            ok: true,
            action: 'in',
            productId: p.id,
            locationId: w.locationId,
            text: this.say('sessionAdd', p.name, qty, this.locName(w.locationId), w.n) + (w.date ? ` (${w.date})` : ''),
        };
    }

    /**
     * Location where the product was stocked in last.
     *
     * @param {string} productId product id
     * @returns {string} location id, empty when none is known
     */
    lastLocation(productId) {
        const d = this.inv.data;
        const mine = d.history.filter(h => h.productId === productId && h.kind !== 'undo' && !h.undone);
        for (const want of [h => h.delta > 0, () => true]) {
            for (let i = mine.length - 1; i >= 0; i--) {
                if (want(mine[i]) && d.locations[mine[i].locationId]) {
                    return mine[i].locationId;
                }
            }
        }
        const o = this.outOrder(productId)[0];
        return o ? o.id : '';
    }

    /**
     * Action for a repeated scan of a product (three scans or more).
     *
     * @param {object} p product
     * @param {{action: string, value: string}} rule rule
     * @param {number} n number of scans
     * @param {number} now time in ms
     * @param {string} [locationId] location that was scanned afterwards
     */
    applyRule(p, rule, n, now, locationId) {
        const d = this.inv.data;
        let r;
        if (rule.action === 'stockLast' || rule.action === 'stockQty') {
            const loc = d.locations[locationId || this.lastLocation(p.id)];
            if (!loc) {
                this.qty = 0;
                r = { ok: false, action: 'in', text: this.say('noLast', p.name) };
            } else {
                const own = rule.action === 'stockQty' ? Math.floor(Number(rule.value)) || n : 0;
                this.qty = 0;
                r = this.atLocation(p, loc, own || this.takeQty(now), false);
            }
        } else if (rule.action === 'empty') {
            const order = this.outOrder(p.id);
            const per = unitAmount(p) || 1;
            if (!order.length) {
                r = { ok: false, action: 'out', text: this.say('none', p.name) };
            } else {
                let sum = 0;
                for (const o of order) {
                    this.book(p.id, o.id, -o.stock);
                    sum += o.stock;
                }
                r = {
                    ok: true,
                    action: 'out',
                    productId: p.id,
                    text: this.say('emptied', p.name, Math.round((sum / per) * 100) / 100),
                };
            }
        } else if (rule.action === 'open') {
            // the same code again closes the opened package
            const hit = Object.entries(d.batches[p.id] || {}).find(
                ([id, list]) => d.locations[id] && list.some(b => b.o && b.q > 0),
            );
            if (hit) {
                this.exec({ action: 'closeUnit', productId: p.id, locationId: hit[0], device: this.device });
                r = {
                    ok: true,
                    action: 'close',
                    productId: p.id,
                    locationId: hit[0],
                    text: this.say('closed', p.name, this.locName(hit[0])),
                };
            } else {
                r = this.openProduct(p);
            }
        } else if (rule.action === 'shopAdd' || rule.action === 'shopRemove') {
            const add = rule.action === 'shopAdd';
            const name = p.group || p.name;
            r = {
                ok: true,
                action: 'shop',
                productId: p.id,
                shop: {
                    op: add ? 'add' : 'remove',
                    name: add && rule.value ? `${name}, ${rule.value}` : name,
                    names: [p.name, p.group],
                },
                text: this.say(add ? 'shopAdded' : 'shopRemoved', p.name),
            };
        } else {
            r = this.autoOut(p, this.takeQty(now));
        }
        return { ...r, rule: n, text: this.say('rule', n) + r.text };
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
        const rule = w.n >= 3 ? this.rules.get(w.n) : null;
        return rule ? this.applyRule(p, rule, w.n, now) : this.autoOut(p, this.takeQty(now));
    }

    /**
     * Call when the deadline has passed.
     *
     * @param {number} [now] time in ms
     */
    flush(now = Date.now()) {
        this.now = now;
        this.cur = [];
        const r = this.flushDue(now);
        this.commit();
        return r;
    }

    /** Remember the bookings of the last scan for SM:UNDO. */
    commit() {
        if (this.cur.length) {
            this.undoStack.push(this.cur);
            if (this.undoStack.length > 20) {
                this.undoStack.shift();
            }
        }
        this.cur = [];
    }

    /**
     * @param {number} now time in ms
     */
    flushDue(now) {
        if (this.session && !this.pending && now >= this.session.until) {
            return this.endSession();
        }
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
        this.now = now;
        this.cur = [];
        try {
            const earlier = this.flushDue(now);
            const r = this.process(String(raw ?? '').trim(), now);
            return earlier ? { ...r, earlier } : r;
        } catch (e) {
            this.pending = null;
            return { ok: false, action: 'error', text: this.say('error', e.message) };
        } finally {
            this.commit();
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
        if (/^sm:undo$/i.test(code)) {
            return this.undo();
        }
        if (/^sm:(spoil|open)$/i.test(code)) {
            const kind = code.slice(3).toLowerCase();
            this.mark = { kind, until: now + QTY_VALID_MS };
            return { ok: true, action: 'mark', text: this.say(kind === 'open' ? 'openSet' : 'spoilSet') };
        }
        const dm = /^sm:date:(\d{1,4})$/i.exec(code);
        if (dm) {
            const n = Number(dm[1]);
            if (n > 3650) {
                return { ok: false, action: 'date', text: this.say('unknown', code) };
            }
            if (this.session && !this.pending) {
                this.session.date = isoIn(n);
                this.session.until = now + SESSION_MS;
                return {
                    ok: true,
                    action: 'mark',
                    text: n ? this.say('sessionDate', this.session.date) : this.say('sessionDateOff'),
                };
            }
            this.mark = { kind: 'date', days: n, until: now + QTY_VALID_MS };
            return { ok: true, action: 'mark', text: this.say(n ? 'dateSet' : 'dateClear', n) };
        }
        if (/^sm:copy$/i.test(code)) {
            this.mark = { kind: 'copy', until: now + QTY_VALID_MS };
            return { ok: true, action: 'mark', text: this.say('copySet') };
        }
        if (/^sm:cancel$/i.test(code)) {
            this.pending = null;
            this.session = null;
            this.mark = null;
            this.qty = 0;
            return { ok: true, action: 'cancel', text: this.say('cancel') };
        }
        const loc = this.findLocation(code);
        if (loc) {
            const w = this.pending;
            if (!w) {
                const ended = this.session && this.session.locationId === loc.id ? this.endSession() : null;
                if (ended) {
                    return ended;
                }
                const earlier = this.session ? this.endSession() : null;
                this.session = { locationId: loc.id, n: 0, until: now + SESSION_MS };
                const r = { ok: true, action: 'sessionStart', text: this.say('sessionStart', loc.name) };
                return earlier ? { ...r, earlier } : r;
            }
            const p = this.inv.data.products[w.productId];
            this.pending = null;
            const rule = w.n >= 3 ? this.rules.get(w.n) : null;
            if (rule && ['stockLast', 'stockQty'].includes(rule.action)) {
                return this.applyRule(p, rule, w.n, now, loc.id);
            }
            return this.atLocation(p, loc, this.takeQty(now), w.n >= 2);
        }
        const p = this.findProduct(code);
        if (!p) {
            return { ok: false, action: 'ignored', text: this.say('unknown', code) };
        }
        if (this.mark && this.mark.kind === 'open') {
            const live = now <= this.mark.until;
            this.mark = null;
            if (live) {
                this.pending = null;
                return this.openProduct(p);
            }
        }
        if (this.mark && this.mark.kind === 'copy') {
            const live = now <= this.mark.until;
            this.mark = null;
            if (live) {
                this.pending = null;
                const d = this.inv.data;
                const date = this.outOrder(p.id).find(o => o.date)?.date || d.products[p.id].bestBefore || '';
                if (!date) {
                    return { ok: false, action: 'copy', text: this.say('copyNone', p.name) };
                }
                if (this.session) {
                    this.session.date = date;
                    this.session.until = now + SESSION_MS;
                    return { ok: true, action: 'copy', text: this.say('copyDone', p.name, date) };
                }
                this.mark = { kind: 'apply', date, until: now + QTY_VALID_MS };
                return { ok: true, action: 'copy', text: this.say('copyApply', p.name, date) };
            }
        }
        if (this.mark && this.mark.kind === 'apply') {
            const m = this.mark;
            this.mark = null;
            if (now <= m.until) {
                this.pending = null;
                return this.dateProduct(p, 0, m.date);
            }
        }
        if (this.mark && this.mark.kind === 'date') {
            const m = this.mark;
            this.mark = null;
            if (now <= m.until) {
                this.pending = null;
                return this.dateProduct(p, m.days);
            }
        }
        if (this.session && !this.pending) {
            return this.sessionAdd(p, now);
        }
        const w = this.pending;
        if (w && w.productId === p.id && this.rules.size && w.n >= 2 && now - w.last > this.windowMs) {
            // the third scan counts only in quick succession, otherwise it starts over
            const earlier = this.resolvePending(now);
            this.pending = { productId: p.id, n: 1, last: now, deadline: now + this.timeoutMs };
            const r = { ok: true, action: 'wait', productId: p.id, text: this.say('askLocation', p.name) };
            return earlier ? { ...r, earlier } : r;
        }
        if (w && w.productId === p.id) {
            w.n += 1;
            w.last = now;
            w.deadline = now + (this.rules.size && w.n >= 3 ? this.windowMs : this.timeoutMs);
            return { ok: true, action: 'wait', productId: p.id, text: this.say('askAgain', p.name, this.qty || 1) };
        }
        const earlier = w ? this.resolvePending(now) : null;
        this.pending = { productId: p.id, n: 1, last: now, deadline: now + this.timeoutMs };
        const r = { ok: true, action: 'wait', productId: p.id, text: this.say('askLocation', p.name) };
        return earlier ? { ...r, earlier } : r;
    }
}

module.exports = { ScanEngine, unitAmount, norm, shortId };
