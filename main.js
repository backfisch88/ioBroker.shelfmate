'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const utils = require('@iobroker/adapter-core');
const { WebServer } = require('@iobroker/webserver');
const { createCertificate, NAMES } = require('./lib/cert');
const { Inventory, clean } = require('./lib/core');
const { Shopping } = require('./lib/shopping');
const { texts } = require('./lib/i18n');
const { ShelfMateServer } = require('./lib/server');

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
        await this.updateStats();
        // expiry changes with the date, not only with bookings
        this.setInterval(() => this.updateStats().catch(e => this.log.debug(`Statistics: ${e.message}`)), 3600000);

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
            ['stats.expiringCount', 'Products expired or expiring soon', 'number', 'value', false],
            ['stats.expiring', 'Products expired or expiring soon (JSON)', 'string', 'json', false],
            ['stats.expiringHtml', 'Products expired or expiring soon (HTML table for VIS)', 'string', 'html', false],
            ['shopping.addItem', 'Add an item to the shopping list', 'string', 'text', true],
        ];
        await this.setObjectNotExistsAsync('stats', { type: 'channel', common: { name: 'Statistics' }, native: {} });
        await this.setObjectNotExistsAsync('shopping', {
            type: 'channel',
            common: { name: 'Shopping list' },
            native: {},
        });
        await Promise.all(
            states.map(([id, name, type, role, write]) =>
                this.setObjectNotExistsAsync(id, {
                    type: 'state',
                    common: { name, type, role, read: true, write },
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
            config: { ...this.bestBeforeConfig(), lang: this.lang || 'en' },
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
            const r = this.inv.handle(cmd);
            this.scheduleSave();
            result = {
                id,
                ok: true,
                changed: r.changed,
                productId: r.productId,
                locationId: r.locationId,
                total: r.total,
            };
            this.afterChange(r.reorder, r.restock).catch(e => this.log.warn(`Post-processing failed: ${e.message}`));
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
     */
    async afterChange(reorder, restock) {
        if (reorder) {
            try {
                const added = await this.shopping?.add(reorder);
                if (added && added.added) {
                    this.log.info(`Minimum stock reached - "${added.name}" added to the shopping list`);
                }
            } catch (e) {
                this.log.warn(`Could not add "${reorder}" to the shopping list: ${e.message}`);
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

    async updateStats() {
        const low = this.inv.lowStockNames();
        const items = this.inv.inventoryList();
        const bb = this.bestBeforeConfig();
        const expiring = this.inv.expiryList(bb.bestBeforeMode, bb.bestBeforeWarnDays);
        await Promise.all([
            this.setState('stats.products', Object.keys(this.inv.data.products).length, true),
            this.setState('stats.locations', Object.keys(this.inv.data.locations).length, true),
            this.setState('stats.lowStockCount', low.length, true),
            this.setState('stats.lowStockList', JSON.stringify(low), true),
            this.setState('stats.inventory', JSON.stringify(items), true),
            this.setState('stats.inventoryHtml', inventoryHtml(items, texts(this.lang)), true),
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
     * @param {() => void} callback completion callback
     */
    async onUnload(callback) {
        try {
            this.closing = true;
            this.shopping?.stop();
            this.web?.stop(h => this.clearInterval(h));
            if (this.httpServer) {
                this.httpServer.close();
                this.httpServer.closeAllConnections?.();
            }
            if (this.dirty && this.dataPath) {
                await this.saveNow();
            }
            await this.setState('info.connection', false, true);
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
