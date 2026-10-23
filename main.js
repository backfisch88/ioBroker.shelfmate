'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const utils = require('@iobroker/adapter-core');
const { WebServer } = require('@iobroker/webserver');
const { createCertificate, NAMES } = require('./lib/cert');
const { Inventory, clean } = require('./lib/core');
const { Shopping } = require('./lib/shopping');
const { parseItems, checkItems } = require('./lib/pantryCheck');
const { texts } = require('./lib/i18n');
const { NOTIFY_ADAPTERS, TEXT: NOTIFY_TEXT, lowText, expiryText, msUntil, deliver } = require('./lib/notify');
const { ShelfMateServer } = require('./lib/server');
const { ScanEngine } = require('./lib/scanner');
const { lookupBarcode } = require('./lib/offLookup');
const { InputReader, listDevices } = require('./lib/inputDevice');

const DATA_FILE = 'shelfmate.json';
const SAVE_DELAY_MS = 500;

/**
 * @param {string} v text
 */
const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * @param {object[]} items inventory list
 * @param {Record<string, string>} t texts
 */
function inventoryHtml(items, t) {
    const rows = items
        .map(
            i =>
                `<tr><td>${esc(i.name)}</td><td>${i.amount} ${esc(i.unit)}</td><td>${esc(i.places.map(x => `${x.place} (${x.amount})`).join(', '))}</td></tr>`,
        )
        .join('');
    return `<table><thead><tr><th>${esc(t.product)}</th><th>${esc(t.amount)}</th><th>${esc(t.location)}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/**
 * @param {object[]} items expiring products
 * @param {Record<string, string>} t texts
 */
function expiringHtml(items, t) {
    const rows = items
        .map(
            i =>
                `<tr><td>${esc(i.name)}</td><td>${esc(i.date)}</td><td>${i.expired ? esc(t.expired) : `${i.days} ${esc(t.days)}`}</td><td>${i.amount}</td><td>${esc(i.place)}</td></tr>`,
        )
        .join('');
    return `<table><thead><tr><th>${esc(t.product)}</th><th>${esc(t.bestBefore)}</th><th>${esc(t.remaining)}</th><th>${esc(t.amount)}</th><th>${esc(t.location)}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/**
 * One line of the consumables text data point.
 *
 * @param {{amount: number, unit: string, name: string, opened: number, bestBefore?: string, expiring: boolean}} x item
 * @param {string} lang system language
 * @returns {string} line
 */
function consumableLine(x, lang) {
    const de = lang === 'de';
    const extra = [];
    if (x.opened > 0) {
        extra.push(`${x.opened} ${de ? 'geöffnet' : 'opened'}`);
    }
    if (x.bestBefore && x.expiring) {
        extra.push(`${de ? 'MHD' : 'best before'} ${x.bestBefore}`);
    }
    return `${x.amount} ${x.unit} ${x.name}${extra.length ? ` (${extra.join(', ')})` : ''}`;
}

class Shelfmate extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options] adapter options
     */
    constructor(options) {
        super({ ...options, name: 'shelfmate' });
        this.inv = new Inventory();
        this.dataPath = '';
        this.saveTimer = null;
        this.dirty = false;
        this.queue = Promise.resolve();
        this.seen = new Map();
        this.shopping = null;
        this.lastCheck = [];
        this.web = null;
        this.httpServer = null;
        this.closing = false;
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        await this.setState('info.connection', false, true);
        await this.createObjects();
        try {
            const sys = await this.getForeignObjectAsync('system.config');
            this.lang = (sys && sys.common && sys.common.language) || 'en';
        } catch {
            this.lang = 'en';
        }

        const port = Number(this.config.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            this.log.error(`Invalid port "${this.config.port}" - please check the instance settings`);
            return;
        }

        const dir = utils.getAbsoluteInstanceDataDir(this);
        await fs.promises.mkdir(dir, { recursive: true });
        this.dataPath = path.join(dir, DATA_FILE);
        await this.loadData();

        this.shopping = new Shopping(this);
        for (const id of this.shopping.subscriptions()) {
            await this.subscribeForeignStatesAsync(id);
        }
        await this.subscribeStatesAsync('shopping.addItem');
        await this.subscribeStatesAsync('check.request');
        await this.subscribeStatesAsync('check.addMissing');
        await this.subscribeStatesAsync('scanner.input');
        await this.subscribeStatesAsync('scanner.active');
        if ((await this.getStateAsync('scanner.active')) === null) {
            await this.setState('scanner.active', false, true);
        }
        const wait = Number(this.config.scannerTimeout);
        this.scanEngine = new ScanEngine(this.inv, {
            timeoutMs: (Number.isFinite(wait) && wait >= 3 && wait <= 120 ? wait : 10) * 1000,
            lang: this.lang,
            run: cmd => this.scanBook(cmd),
        });
        this.startScannerDevice();
        await this.updateStats();
        // expiry changes with the date, not only with bookings
        this.setInterval(() => this.updateStats().catch(e => this.log.debug(`Statistics: ${e.message}`)), 3600000);

        this.scheduleNotify();

        this.web = new ShelfMateServer({
            wwwDir: path.join(__dirname, 'www'),
            accessKey: this.config.accessKey ? String(this.config.accessKey) : '',
            snapshot: () => this.snapshot(),
            command: cmd => this.runCommand(cmd),
            addToList: name => this.addToList(name),
            removeFromList: names => this.removeFromList(names),
            certificate: () => this.deviceCertificate(),
            log: this.log,
        });
        if (this.closing) {
            return;
        }
        this.web.start((fn, ms) => this.setInterval(fn, ms));

        const webserver = new WebServer({
            adapter: this,
            app: this.web.handler,
            secure: !!this.config.secure,
            http2: false,
            usedResources: false,
        });
        try {
            this.httpServer = await webserver.init();
        } catch (e) {
            this.log.error(`Cannot create the web server: ${e.message}`);
            return;
        }
        this.httpServer.on('error', e => {
            this.log.error(
                `Web server error: ${e.code === 'EADDRINUSE' ? `port ${port} is already in use` : e.message}`,
            );
            this.setState('info.connection', false, true);
        });
        const bind = String(this.config.bind || '0.0.0.0');
        this.httpServer.listen(port, bind, () => {
            this.log.info(
                `ShelfMate is running on ${this.config.secure ? 'https' : 'http'}://${bind}:${port}/ (${Object.keys(this.inv.data.products).length} products)`,
            );
            this.connectionUp = true;
            this.setState('info.connection', true, true);
        });
    }

    async createObjects() {
        const states = [
            ['stats.products', 'Number of products', 'number', 'value', false],
            ['stats.locations', 'Number of storage locations', 'number', 'value', false],
            ['stats.lowStockCount', 'Products at or below minimum stock', 'number', 'value', false],
            ['stats.lowStockList', 'Names at or below minimum stock (JSON)', 'string', 'json', false],
            ['stats.inventory', 'Everything in stock (JSON)', 'string', 'json', false],
            ['stats.inventoryHtml', 'Everything in stock (HTML table for VIS)', 'string', 'html', false],
            ['stats.inventoryReminderStart', 'Start of the stocktaking reminder interval', 'number', 'date', false],
            ['stats.lastInventoryReminder', 'Time of the last stocktaking reminder', 'number', 'date', false],
            ['stats.consumption', 'Consumption of the last 30 days (JSON)', 'string', 'json', false],
            ['stats.expiringCount', 'Products expired or expiring soon', 'number', 'value', false],
            ['stats.expiring', 'Products expired or expiring soon (JSON)', 'string', 'json', false],
            ['stats.expiringHtml', 'Products expired or expiring soon (HTML table for VIS)', 'string', 'html', false],
            ['stats.consumables', 'Stock of locations marked as consumables (JSON)', 'string', 'json', false],
            [
                'stats.consumablesText',
                'Stock of locations marked as consumables (one line each)',
                'string',
                'text',
                false,
            ],
            ['shopping.addItem', 'Add an item to the shopping list', 'string', 'text', true],
            ['check.request', 'Ingredients to check against the stock (one per line, or JSON)', 'string', 'text', true],
            ['check.result', 'Result of the last check per ingredient (JSON)', 'string', 'json', false],
            ['check.available', 'Ingredients that are in stock (one line each, as they came)', 'string', 'text', false],
            [
                'check.missing',
                'Ingredients that are missing or not enough (one line each, as they came)',
                'string',
                'text',
                false,
            ],
            ['check.allAvailable', 'Everything of the last check is in stock', 'boolean', 'indicator', false],
            [
                'check.addMissing',
                'Put the missing ingredients of the last check on the shopping list',
                'boolean',
                'button',
                true,
            ],
            ['scanner.input', 'Scanned code (write a code here to simulate a scan)', 'string', 'text', true],
            ['scanner.lastCode', 'Last scanned code', 'string', 'text', false],
            ['scanner.result', 'Result of the last scan in scanner mode', 'string', 'text', false],
            ['scanner.active', 'Scanner mode: bookings by scanned codes without the app', 'boolean', 'switch', true],
        ];
        await this.setObjectNotExistsAsync('stats', { type: 'channel', common: { name: 'Statistics' }, native: {} });
        await this.setObjectNotExistsAsync('shopping', {
            type: 'channel',
            common: { name: 'Shopping list' },
            native: {},
        });
        await this.setObjectNotExistsAsync('check', {
            type: 'channel',
            common: { name: 'Ingredient check' },
            native: {},
        });
        await this.setObjectNotExistsAsync('scanner', { type: 'channel', common: { name: 'Scanner' }, native: {} });
        await Promise.all(
            states.map(([id, name, type, role, write]) =>
                this.setObjectNotExistsAsync(id, {
                    type: 'state',
                    common: { name, type, role, read: role !== 'button', write },
                    native: {},
                }),
            ),
        );
    }

    /**
     * Load the data file. Without a data file the adapter starts with the default areas and location.
     */
    async loadData() {
        try {
            const raw = await fs.promises.readFile(this.dataPath, 'utf8');
            this.inv = new Inventory(JSON.parse(raw), this.lang);
            return;
        } catch (e) {
            if (e.code !== 'ENOENT') {
                this.log.error(`Data file is damaged (${e.message}) - keeping a copy and starting empty`);
                await fs.promises.copyFile(this.dataPath, `${this.dataPath}.damaged`).catch(() => {});
            }
            this.inv = new Inventory(undefined, this.lang);
        }
    }

    scheduleSave() {
        this.dirty = true;
        if (!this.saveTimer) {
            this.saveTimer = this.setTimeout(() => {
                this.saveTimer = null;
                this.saveNow().catch(e => this.log.error(`Saving data failed: ${e.message}`));
            }, SAVE_DELAY_MS);
        }
    }

    async saveNow() {
        if (this.saveTimer) {
            this.clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        this.dirty = false;
        const tmp = `${this.dataPath}.tmp`;
        await fs.promises.writeFile(tmp, JSON.stringify(this.inv.data));
        await fs.promises.rename(tmp, this.dataPath);
    }

    async snapshot() {
        let bring = [];
        try {
            bring = this.shopping ? await this.shopping.content() : [];
        } catch (e) {
            this.log.debug(`Shopping list unavailable: ${e.message}`);
        }
        return {
            ...this.inv.data,
            ready: true,
            bring,
            shopping: !!this.shopping && this.shopping.mode !== 'off',
            config: {
                ...this.bestBeforeConfig(),
                lang: this.lang || 'en',
                labelButtons: this.labelButtons(),
                autoShelfLife: this.autoShelfMode() !== 'off',
                autoShelfMode: this.autoShelfMode(),
                autoShelfScope: this.config.autoShelfScope === 'dry' ? 'dry' : 'all',
                dateFormat: ['dmy', 'slash', 'iso'].includes(this.config.dateFormat) ? this.config.dateFormat : 'dmy',
                inventoryDays: this.inventoryDays(),
            },
        };
    }

    /**
     * Run a command from the web app. Commands run one after another and are idempotent per id.
     *
     * @param {object} cmd command
     */
    runCommand(cmd) {
        const run = this.queue.then(() => this.execute(cmd));
        this.queue = run.catch(() => {});
        return run;
    }

    /**
     * @param {object} cmd command
     */
    async execute(cmd) {
        const id = clean(cmd && cmd.id, 100);
        if (id && this.seen.has(id)) {
            return this.seen.get(id);
        }
        const before = JSON.stringify(this.inv.data);
        if (cmd && (cmd.action === 'importData' || cmd.action === 'resetData')) {
            await this.saveNow().catch(() => {});
            await fs.promises.copyFile(this.dataPath, `${this.dataPath}.bak`).catch(() => {});
        }
        let result;
        try {
            this.inv.bbMode = this.bestBeforeConfig().bestBeforeMode;
            this.applyAuto(true);
            const r = this.inv.handle(cmd);
            this.scheduleSave();
            result = {
                id,
                ok: true,
                changed: r.changed,
                productId: r.productId,
                locationId: r.locationId,
                total: r.total,
                suggestions: r.suggestions,
                report: r.report,
            };
            this.afterChange(r.reorder, r.restock, r.lower, r.qty).catch(e =>
                this.log.warn(`Post-processing failed: ${e.message}`),
            );
        } catch (e) {
            this.inv = new Inventory(JSON.parse(before), this.lang);
            result = { id, ok: false, error: e.message || String(e) };
            this.log.debug(`${clean(cmd && cmd.action, 40) || 'command'}: ${result.error}`);
        }
        if (id) {
            this.seen.set(id, result);
            if (this.seen.size > 500) {
                this.seen.delete(this.seen.keys().next().value);
            }
        }
        return result;
    }

    /**
     * Shopping list entry, event stream and statistics after a successful change.
     *
     * @param {string} reorder name to put on the shopping list, may be empty
     * @param {string} [restock] name to take off the shopping list again, may be empty
     * @param {string} [lower] name whose stock dropped further while already at or below the minimum
     * @param {number} [qty] amount to put on the list when the quantity option is on
     */
    async afterChange(reorder, restock, lower, qty) {
        const withQty = !!this.config.shoppingQuantity && qty > 0;
        const target = reorder || (withQty ? lower : '');
        if (reorder && this.config.notifyLow) {
            this.notify(lowText(this.lang, reorder), 'info');
        }
        if (target) {
            try {
                const added = await this.shopping?.add(withQty ? `${target}, ${qty}` : target);
                if (added && added.added) {
                    this.log.info(`Minimum stock reached - "${added.name}" added to the shopping list`);
                }
            } catch (e) {
                this.log.warn(`Could not add "${target}" to the shopping list: ${e.message}`);
            }
        }
        if (restock) {
            try {
                if (await this.shopping?.remove(restock)) {
                    this.log.info(`Stock refilled - "${restock}" removed from the shopping list`);
                }
            } catch (e) {
                this.log.warn(`Could not remove "${restock}" from the shopping list: ${e.message}`);
            }
        }
        this.web?.broadcast('data', await this.snapshot());
        await this.updateStats();
    }

    /**
     * Compare a list of ingredients with the stock and publish the result.
     *
     * @param {string} request ingredients
     */
    async runCheck(request) {
        const result = checkItems(this.inv.data, parseItems(request));
        this.lastCheck = result;
        const text = r => r.flatMap(x => x.lines || [x.name]).join('\n');
        await this.setState('check.result', JSON.stringify(result), true);
        await this.setState('check.available', text(result.filter(x => x.ok)), true);
        await this.setState('check.missing', text(result.filter(x => !x.ok)), true);
        await this.setState('check.allAvailable', result.length > 0 && result.every(x => x.ok), true);
        if (this.config.checkAddMissing) {
            await this.addMissingToList();
        }
    }

    /**
     * Put the ingredients of the last check that are missing on the shopping list.
     */
    async addMissingToList() {
        for (const x of this.lastCheck || []) {
            if (!x.ok) {
                for (const line of x.lines || [x.name]) {
                    const r = await this.addToList(line);
                    if (!r.ok) {
                        this.log.warn(`Ingredient check: ${x.name} not added: ${r.error}`);
                        return;
                    }
                }
            }
        }
    }

    /**
     * @param {string} name item name
     */
    async addToList(name) {
        if (!this.shopping) {
            return { ok: false, error: 'Not ready' };
        }
        try {
            return await this.shopping.add(name);
        } catch (e) {
            this.log.warn(`Shopping list: ${e.message}`);
            return { ok: false, error: e.message };
        }
    }

    /**
     * @param {string[]} names candidate item names
     */
    async removeFromList(names) {
        if (!this.shopping) {
            return { ok: false, error: 'Not ready' };
        }
        try {
            return await this.shopping.removeNow(names);
        } catch (e) {
            this.log.warn(`Shopping list: ${e.message}`);
            return { ok: false, error: e.message };
        }
    }

    /**
     * When the standard shelf life is filled in automatically.
     *
     * @returns {'always' | 'headless' | 'off'} mode
     */
    autoShelfMode() {
        return ['always', 'headless', 'off'].includes(this.config.autoShelfMode) ? this.config.autoShelfMode : 'always';
    }

    /**
     * Switches the automatic shelf life on or off for the next booking.
     *
     * @param {boolean} fromApp booking comes from the app (someone can type a date)
     */
    applyAuto(fromApp) {
        const mode = this.autoShelfMode();
        this.inv.autoShelf = mode !== 'off';
        this.inv.autoDate = fromApp ? mode === 'always' : mode !== 'off';
        this.inv.autoScope = this.config.autoShelfScope === 'dry' ? 'dry' : 'all';
    }

    /**
     * Best-before settings, validated.
     *
     * @returns {{bestBeforeMode: 'off' | 'product' | 'batch', bestBeforeWarnDays: number}} settings
     */
    bestBeforeConfig() {
        const mode = ['product', 'batch'].includes(this.config.bestBeforeMode) ? this.config.bestBeforeMode : 'off';
        const days = Math.floor(Number(this.config.bestBeforeWarnDays));
        return {
            bestBeforeMode: mode,
            bestBeforeWarnDays: Number.isFinite(days) && days >= 0 && days <= 365 ? days : 7,
        };
    }

    /**
     * Label buttons chosen in the settings.
     *
     * @returns {string[]} names of the enabled buttons
     */
    labelButtons() {
        const known = ['ean', 'qr', 'qrOnly', 'shelf', 'box', 'opened', 'freezer'];
        const a = Array.isArray(this.config.labelButtons) ? this.config.labelButtons : ['ean', 'qr'];
        return a.filter(x => known.includes(x));
    }

    async updateStats() {
        const low = this.inv.lowStockNames();
        const items = this.inv.inventoryList();
        const bb = this.bestBeforeConfig();
        const expiring = this.inv.expiryList(bb.bestBeforeMode, bb.bestBeforeWarnDays);
        const cons = this.inv.consumablesList(bb.bestBeforeMode, bb.bestBeforeWarnDays);
        await Promise.all([
            this.setState('stats.consumables', JSON.stringify(cons), true),
            this.setState('stats.consumablesText', cons.map(x => consumableLine(x, this.lang)).join('\n'), true),
            this.setState('stats.products', Object.keys(this.inv.data.products).length, true),
            this.setState('stats.locations', Object.keys(this.inv.data.locations).length, true),
            this.setState('stats.lowStockCount', low.length, true),
            this.setState('stats.lowStockList', JSON.stringify(low), true),
            this.setState('stats.inventory', JSON.stringify(items), true),
            this.setState('stats.inventoryHtml', inventoryHtml(items, texts(this.lang)), true),
            this.setState('stats.consumption', JSON.stringify(this.inv.consumption(30)), true),
            this.setState('stats.expiringCount', expiring.length, true),
            this.setState('stats.expiring', JSON.stringify(expiring), true),
            this.setState('stats.expiringHtml', expiringHtml(expiring, texts(this.lang)), true),
        ]);
    }

    /**
     * Certificate that devices have to trust, as DER for the .cer download.
     *
     * @returns {Promise<Buffer | null>} certificate or null
     */
    async deviceCertificate() {
        if (!this.config.secure) {
            return null;
        }
        try {
            const res = await this.getCertificatesAsync(
                this.config.certPublic || 'defaultPublic',
                this.config.certPrivate || 'defaultPrivate',
                this.config.certChained || '',
            );
            const certs = res && res[0];
            const pem = String((certs && (certs.ca || certs.cert)) || '');
            const blocks = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g);
            if (!blocks || !blocks.length) {
                return null;
            }
            return new crypto.X509Certificate(blocks[blocks.length - 1]).raw;
        } catch (e) {
            this.log.debug(`No device certificate: ${e.message}`);
            return null;
        }
    }

    /**
     * @param {string} id state id
     * @param {ioBroker.State | null | undefined} state state
     */
    async onStateChange(id, state) {
        if (!state || this.closing) {
            return;
        }
        const own = id.startsWith(`${this.namespace}.`);
        if (own) {
            if (id === `${this.namespace}.scanner.input` && !state.ack) {
                await this.handleScan(String(state.val ?? ''));
                await this.setState('scanner.input', state.val, true);
            } else if (id === `${this.namespace}.scanner.active` && !state.ack) {
                if (!state.val) {
                    this.scanEngine.handle('SM:CANCEL');
                    this.clearTimeout(this.scanTimer);
                }
                await this.setState('scanner.active', !!state.val, true);
            }
            if (id === `${this.namespace}.check.request` && !state.ack) {
                await this.runCheck(String(state.val ?? ''));
                await this.setState('check.request', '', true);
            } else if (id === `${this.namespace}.check.addMissing` && !state.ack) {
                await this.addMissingToList();
            }
            if (id === `${this.namespace}.shopping.addItem` && !state.ack) {
                const r = await this.addToList(String(state.val ?? ''));
                if (r.ok) {
                    await this.setState('shopping.addItem', state.val, true);
                }
            }
            return;
        }
        if (this.shopping && id === this.shopping.contentId && state.ack) {
            try {
                this.web?.broadcast('bring', await this.shopping.content());
            } catch (e) {
                this.log.debug(`Shopping list update failed: ${e.message}`);
            }
        }
    }

    /**
     * Booking made by the scanner mode: same follow-up as a booking from the app.
     *
     * @param {object} cmd command
     */
    scanBook(cmd) {
        this.inv.bbMode = this.bestBeforeConfig().bestBeforeMode;
        this.applyAuto(false);
        const r = this.inv.handle(cmd);
        this.scheduleSave();
        this.afterChange(r.reorder, r.restock, r.lower, r.qty).catch(e =>
            this.log.warn(`Post-processing failed: ${e.message}`),
        );
        return r;
    }

    /**
     * @param {string} code scanned code
     */
    async handleScan(code) {
        const text = code.trim().slice(0, 400);
        if (!text) {
            return;
        }
        await this.setState('scanner.lastCode', text, true);
        if ((await this.getStateAsync('scanner.active'))?.val !== true) {
            return;
        }
        this.scanEngine.inv = this.inv;
        // a barcode nobody knows yet is created first (Open Food Facts), then booked like any other
        const made = this.scanEngine.isNewBarcode(text) ? await this.createScannedProduct(text) : null;
        const r = this.scanEngine.handle(text);
        if (made) {
            r.text = this.scanEngine.say(made.incomplete ? 'createdIncomplete' : 'created', made.name) + r.text;
        }
        await this.publishScan(r);
        this.armScanTimer();
    }

    /**
     * New product from a scanned barcode: data from Open Food Facts, otherwise an incomplete placeholder
     * that shows up as a hint in the app.
     *
     * @param {string} ean barcode
     * @returns {Promise<{name: string, incomplete: boolean} | null>} the new product, null when it could not be saved
     */
    async createScannedProduct(ean) {
        let found = null;
        try {
            found = await lookupBarcode(ean, { lang: this.lang });
        } catch (e) {
            this.log.debug(`Open Food Facts lookup failed: ${e.message}`);
        }
        if (this.closing) {
            return null;
        }
        const product = found
            ? { ...found, ean, source: 'off', incomplete: false }
            : { name: `${this.lang === 'de' ? 'Neues Produkt' : 'New product'} ${ean}`, ean, incomplete: true };
        try {
            this.scanBook({ action: 'saveProduct', product });
            return { name: product.name, incomplete: product.incomplete };
        } catch (e) {
            this.log.warn(`Could not create product for ${ean}: ${e.message}`);
            return null;
        }
    }

    /**
     * @param {{text: string, ok: boolean, earlier?: object}} r result of the scan engine
     */
    async publishScan(r) {
        if (r.earlier) {
            await this.publishScan(r.earlier);
        }
        this.log.debug(`Scanner: ${r.text}`);
        await this.setState('scanner.result', r.text, true);
    }

    /** Reads the keyboard-like scanner chosen in the settings. */
    startScannerDevice() {
        const path = String(this.config.scannerDevice || '').trim();
        if (!path || !(path.startsWith('/dev/input/') || path.startsWith('name:'))) {
            return;
        }
        this.reader = new InputReader({
            path,
            prefix: String(this.config.scannerPrefix || ''),
            suffix: String(this.config.scannerSuffix || ''),
            layout: this.config.scannerLayout === 'de' ? 'de' : 'us',
            setTimeout: (fn, ms) => this.setTimeout(fn, ms),
            clearTimeout: h => h && this.clearTimeout(h),
            log: this.log,
            onScan: text => {
                if (!this.closing) {
                    // one scan after the other, a lookup of a new barcode must not overtake the next scan
                    this.scanChain = (this.scanChain || Promise.resolve())
                        .then(() => this.handleScan(text))
                        .catch(e => this.log.warn(`Scan failed: ${e.message}`));
                }
            },
        });
        this.reader.start();
    }

    armScanTimer() {
        this.clearTimeout(this.scanTimer);
        const at = this.scanEngine.deadline;
        if (!at || this.closing) {
            return;
        }
        this.scanTimer = this.setTimeout(
            async () => {
                this.scanEngine.inv = this.inv;
                const r = this.scanEngine.flush(Date.now());
                if (r) {
                    await this.publishScan(r);
                }
            },
            Math.max(0, at - Date.now()) + 50,
        );
    }

    /**
     * Creates a self-signed certificate and stores it in the ioBroker certificate collection.
     *
     * @returns {Promise<object>} answer for the admin UI
     */
    async makeCertificate() {
        try {
            const r = createCertificate();
            const obj = await this.getForeignObjectAsync('system.certificates');
            if (!obj) {
                return { error: 'Certificate collection not found' };
            }
            obj.native = obj.native || {};
            obj.native.certificates = obj.native.certificates || {};
            obj.native.certificates[NAMES.pub] = r.cert;
            obj.native.certificates[NAMES.priv] = r.key;
            await this.setForeignObjectAsync('system.certificates', obj);
            this.log.info(`Self-signed certificate created, valid until ${r.notAfter.toISOString().slice(0, 10)}`);
            return {
                result: `OK ${r.notAfter.toISOString().slice(0, 10)}: ${r.names.join(', ')}`,
                native: { secure: true, certPublic: NAMES.pub, certPrivate: NAMES.priv, certChained: '' },
            };
        } catch (e) {
            this.log.error(`Cannot create the certificate: ${e.message}`);
            return { error: e.message };
        }
    }

    /**
     * Answers the admin UI: list of the Bring! lists found in this installation.
     *
     * @param {ioBroker.Message} obj message
     */
    async onMessage(obj) {
        if (obj && obj.command === 'createCertificate' && obj.callback) {
            this.sendTo(obj.from, obj.command, await this.makeCertificate(), obj.callback);
            return;
        }
        if (obj && obj.command === 'getNotifAdapters' && obj.callback) {
            let adapters = [];
            try {
                const view = await this.getObjectViewAsync('system', 'instance', {
                    startkey: 'system.adapter.',
                    endkey: 'system.adapter.\u9999',
                });
                adapters = (view.rows || [])
                    .map(r => r.id.replace('system.adapter.', ''))
                    .filter(id => NOTIFY_ADAPTERS.some(n => id.startsWith(n)) || id.startsWith('telegrammenu2'))
                    .map(id => ({ label: id, value: id }));
            } catch (e) {
                this.log.warn(`Could not read the notification adapters: ${e.message}`);
            }
            this.sendTo(obj.from, obj.command, adapters, obj.callback);
            return;
        }
        if (obj && obj.command === 'testNotification' && obj.callback) {
            const msg = obj.message || {};
            if (!msg.notifyAdapter) {
                this.sendTo(obj.from, obj.command, { error: 'No notification adapter selected' }, obj.callback);
                return;
            }
            const clean = v => (v && v !== 'undefined' ? String(v) : '');
            deliver(
                this,
                { instance: String(msg.notifyAdapter), target: clean(msg.target), area: clean(msg.area) },
                (NOTIFY_TEXT[this.lang] || NOTIFY_TEXT.en).test,
            );
            this.sendTo(obj.from, obj.command, { result: 'OK' }, obj.callback);
            return;
        }
        if (obj && obj.command === 'getCertCollections' && obj.callback) {
            let collections = [];
            try {
                const certs = await this.getForeignObjectAsync('system.certificates');
                collections = Object.keys((certs && certs.native && certs.native.collections) || {}).map(name => ({
                    label: name,
                    value: name,
                }));
            } catch (e) {
                this.log.warn(`Could not read the certificate collections: ${e.message}`);
            }
            this.sendTo(obj.from, obj.command, collections, obj.callback);
            return;
        }
        if (obj && obj.command === 'getInputDevices' && obj.callback) {
            this.sendTo(obj.from, obj.command, listDevices(), obj.callback);
            return;
        }
        if (!obj || obj.command !== 'getBringLists' || !obj.callback) {
            return;
        }
        let lists = [];
        try {
            const view = await this.getObjectViewAsync('system', 'channel', {
                startkey: 'bring.',
                endkey: 'bring.\u9999',
            });
            lists = (view.rows || [])
                .filter(r => /^bring\.\d+\.[^.]+$/.test(r.id) && !r.id.endsWith('.info'))
                .map(r => {
                    const n = r.value && r.value.common && r.value.common.name;
                    const name = typeof n === 'object' ? n.en || Object.values(n)[0] : n;
                    return { label: name ? `${name} (${r.id})` : r.id, value: r.id };
                });
        } catch (e) {
            this.log.warn(`Could not read the Bring! lists: ${e.message}`);
        }
        this.sendTo(obj.from, obj.command, lists, obj.callback);
    }

    /**
     * Send a message through the selected notification adapter.
     *
     * @param {string} message text
     * @param {'info' | 'warn' | 'error'} severity telegrammenu2 message type
     */
    notify(message, severity = 'info') {
        const instance = String(this.config.notifyAdapter || '');
        if (!instance || !message) {
            return;
        }
        try {
            deliver(
                this,
                {
                    instance,
                    target: String(this.config.notifyTarget || ''),
                    area: String(this.config.notifyArea || ''),
                },
                message,
                severity,
            );
        } catch (e) {
            this.log.warn(`Could not send the notification: ${e.message}`);
        }
    }

    /**
     * Plan the daily message about expired and expiring products.
     */
    scheduleNotify() {
        if (this.notifyTimer) {
            this.clearTimeout(this.notifyTimer);
            this.notifyTimer = null;
        }
        const bb = this.bestBeforeConfig();
        const expiry = !!this.config.notifyExpiry && bb.bestBeforeMode !== 'off';
        if (!this.config.notifyAdapter || (!expiry && this.inventoryDays() <= 0)) {
            return;
        }
        this.notifyTimer = this.setTimeout(
            () => {
                this.notifyTimer = null;
                if (expiry) {
                    const list = this.inv.expiryList(bb.bestBeforeMode, bb.bestBeforeWarnDays);
                    const wording = k =>
                        String(this.config[k] || '')
                            .trim()
                            .slice(0, 300);
                    const message = expiryText(this.lang, list, {
                        line: wording('notifyExpiryLine'),
                        expiredTitle: wording('notifyExpiredTitle'),
                        soonTitle: wording('notifySoonTitle'),
                    });
                    this.notify(message, list.some(x => x.expired) ? 'warn' : 'info');
                }
                this.inventoryReminder().catch(e => this.log.debug(`Stocktaking reminder: ${e.message}`));
                if (!this.closing) {
                    this.scheduleNotify();
                }
            },
            msUntil(String(this.config.notifyTime || '08:00')),
        );
    }

    /**
     * Days between stocktaking reminders, 0 = off.
     *
     * @returns {number} days
     */
    inventoryDays() {
        const n = Math.floor(Number(this.config.notifyInventoryDays));
        return Number.isFinite(n) && n > 0 && n <= 365 ? n : 0;
    }

    /**
     * Remind about a stocktaking when the last one (or the last reminder) is older than the configured interval.
     */
    async inventoryReminder() {
        const days = this.inventoryDays();
        if (!days) {
            return;
        }
        const now = Date.now();
        const lastStock = Math.max(
            0,
            ...this.inv.data.history.filter(h => h.kind === 'stocktake').map(h => Date.parse(h.time)),
            ...Object.values(this.inv.data.locations).map(l => Date.parse(l.stocktake || '') || 0),
        );
        let start = Number((await this.getStateAsync('stats.inventoryReminderStart'))?.val) || 0;
        if (!start) {
            start = now;
            await this.setState('stats.inventoryReminderStart', start, true);
        }
        const due = (lastStock || start) + days * 86400000 - 3600000;
        const sent = Number((await this.getStateAsync('stats.lastInventoryReminder'))?.val) || 0;
        // one message per due stocktaking: nothing more until a stocktaking has been done
        if (now >= due && sent < due) {
            this.notify((NOTIFY_TEXT[this.lang] || NOTIFY_TEXT.en).inventory, 'info');
            await this.setState('stats.lastInventoryReminder', now, true);
        }
    }

    /**
     * @param {() => void} callback completion callback
     */
    async onUnload(callback) {
        try {
            this.closing = true;
            this.shopping?.stop();
            this.reader?.stop();
            if (this.notifyTimer) {
                this.clearTimeout(this.notifyTimer);
            }
            if (this.scanTimer) {
                this.clearTimeout(this.scanTimer);
            }
            this.web?.stop(h => this.clearInterval(h));
            if (this.httpServer) {
                this.httpServer.close();
                this.httpServer.closeAllConnections?.();
            }
            if (this.dirty && this.dataPath) {
                await this.saveNow();
            }
            // a second process that was started at the same time and stops itself must not reset the state of the one that runs
            if (this.connectionUp) {
                await this.setState('info.connection', false, true);
            }
        } catch (e) {
            this.log.error(`Error during unload: ${e.message}`);
        }
        callback();
    }
}

if (require.main !== module) {
    module.exports = options => new Shelfmate(options);
} else {
    new Shelfmate();
}
