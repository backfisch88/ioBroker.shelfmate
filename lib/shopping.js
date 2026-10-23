'use strict';

const { listName } = require('./core');
const { BringSpecial } = require('./bringSpecial');

/**
 * Shopping list connector. Mode "off" does nothing, mode "script" writes the item name to any
 * foreign state (for example a script or another adapter) and optionally reads the list from another
 * state, mode "bring" adds items to a list channel of the Bring! adapter unless they are already on it, and mode "bringSpecial" merges quantities into the specification of items that are already on the list.
 */
class Shopping {
    /**
     * @param {ioBroker.Adapter} adapter the adapter
     */
    constructor(adapter) {
        this.adapter = adapter;
        const c = adapter.config;
        const mode = c.shoppingMode === 'datapoint' ? 'script' : c.shoppingMode;
        this.mode = ['script', 'bring', 'bringSpecial'].includes(mode) ? mode : 'off';
        this.special = null;
        this.sleepers = new Set();
        this.addId = '';
        this.removeId = '';
        this.removeOnRestock = !!c.removeOnRestock;
        this.removeOnUncheck = c.removeOnUncheck !== false;
        this.contentId = '';
        if (this.mode === 'script') {
            this.addId = String(c.shoppingAddItemId || '').trim();
            this.contentId = String(c.shoppingContentId || '').trim();
            this.removeId = String(c.shoppingRemoveItemId || '').trim();
        } else if (this.mode === 'bring' || this.mode === 'bringSpecial') {
            const list = String(c.bringListId || '')
                .trim()
                .replace(/\.(content|saveItem)$/, '');
            if (list) {
                this.addId = `${list}.saveItem`;
                this.contentId = `${list}.content`;
                this.removeId = `${list}.removeItem`;
            }
        }
        if (this.mode !== 'off' && !this.addId) {
            adapter.log.warn(
                'Shopping list mode is enabled but no target state is configured - shopping list disabled',
            );
            this.mode = 'off';
        }
        if (this.mode === 'bringSpecial') {
            this.special = new BringSpecial({
                read: async () => {
                    const state = await adapter.getForeignStateAsync(this.contentId);
                    return { items: await this.content(), ts: (state && state.ts) || 0 };
                },
                save: text => adapter.setForeignStateAsync(this.addId, { val: text, ack: false }).then(() => undefined),
                log: (level, msg) => adapter.log[level](msg),
                sleep: ms => this.sleep(ms),
            });
        }
    }

    /**
     * Sleep that ends early when the shopping list connector is stopped.
     *
     * @param {number} ms milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => {
            const entry = { resolve, handle: null };
            entry.handle = this.adapter.setTimeout(() => {
                this.sleepers.delete(entry);
                resolve();
            }, ms);
            this.sleepers.add(entry);
        });
    }

    /**
     * Stop waiting work.
     */
    stop() {
        this.special?.stop();
        for (const entry of this.sleepers) {
            this.adapter.clearTimeout(entry.handle);
            entry.resolve();
        }
        this.sleepers.clear();
    }

    /**
     * @returns {string[]} foreign state ids that must be subscribed
     */
    subscriptions() {
        return this.contentId ? [this.contentId] : [];
    }

    /**
     * Current list content as stored by the source (Bring! JSON array of objects with a name).
     */
    async content() {
        if (!this.contentId) {
            return [];
        }
        const state = await this.adapter.getForeignStateAsync(this.contentId);
        try {
            const arr = JSON.parse(String(state?.val ?? '[]'));
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    /**
     * Find the list entry for one of the names. Without a readable list (script mode without a list state)
     * the first name is used as it is.
     *
     * @param {string[]} names candidate names
     * @returns {Promise<{name: string} | null>} entry or null
     */
    async findItem(names) {
        const wanted = names.map(n => listName(n).toLowerCase()).filter(Boolean);
        if (!wanted.length) {
            return null;
        }
        if (!this.contentId) {
            return { name: listName(names[0]) };
        }
        const items = await this.content();
        return items.find(x => wanted.includes(listName(x && x.name).toLowerCase())) || null;
    }

    /**
     * Remove an item from the shopping list after the stock was refilled (only if enabled and the item is on the list).
     *
     * @param {string} rawName item name
     * @returns {Promise<boolean>} true when a removal was requested
     */
    async remove(rawName) {
        if (!this.removeOnRestock || !this.removeId) {
            return false;
        }
        const item = await this.findItem([rawName]);
        if (!item) {
            return false;
        }
        this.special?.forget(item.name);
        await this.adapter.setForeignStateAsync(this.removeId, { val: String(item.name), ack: false });
        return true;
    }

    /**
     * Remove an item on request of the user (tap in the app). Needs a remove target (Bring! modes, or script mode with a remove state).
     *
     * @param {string[]} names candidate names, the first one found on the list is removed
     * @returns {Promise<{ok: boolean, removed: boolean}>} result
     */
    async removeNow(names) {
        if (!this.removeId || !this.removeOnUncheck) {
            return { ok: true, removed: false };
        }
        const item = await this.findItem(names);
        if (!item) {
            return { ok: true, removed: false };
        }
        this.special?.forget(item.name);
        await this.adapter.setForeignStateAsync(this.removeId, { val: String(item.name), ack: false });
        return { ok: true, removed: true };
    }

    /**
     * Add an item unless it is already on the list.
     *
     * @param {string} rawName item name
     * @returns {Promise<{ok: boolean, added?: boolean, name?: string, error?: string}>} result
     */
    async add(rawName) {
        const [first, ...rest] = String(rawName ?? '').split(/,(?!\d)/);
        const name = listName(first);
        if (!name) {
            return { ok: false, error: 'Empty name' };
        }
        if (this.mode === 'off') {
            return { ok: false, error: 'Shopping list is disabled in the adapter settings' };
        }
        if (this.special) {
            // "Cherrytomaten, bunt, 500g": the parts after the name are merged into the specification
            this.special.enqueue([name, ...rest.map(x => x.trim()).filter(Boolean)].join(', '));
            return { ok: true, added: true, name };
        }
        const spec = rest.map(x => x.trim()).filter(Boolean);
        if (this.mode === 'script' && this.adapter.config.shoppingQuantity && spec.length) {
            // the script receives "Name, amount" every time and adds the amounts up itself
            await this.adapter.setForeignStateAsync(this.addId, { val: [name, ...spec].join(', '), ack: false });
            return { ok: true, added: true, name };
        }
        const wanted = name.toLowerCase();
        const existing = (await this.content()).some(x => listName(x && x.name).toLowerCase() === wanted);
        if (existing) {
            return { ok: true, added: false, name };
        }
        await this.adapter.setForeignStateAsync(this.addId, { val: name, ack: false });
        return { ok: true, added: true, name };
    }
}

module.exports = { Shopping };
