'use strict';

const assert = require('node:assert');
const { lookupBarcode } = require('./offLookup');

const reply = body => async () => ({ ok: true, json: async () => body });

describe('lookupBarcode', () => {
    it('turns categories into tags: local names first, no generic top categories, three at most', async () => {
        const r = await lookupBarcode('4067517001728', {
            lang: 'de',
            fetch: reply({
                status: 1,
                product: {
                    product_name: 'Spaghetti',
                    categories_tags: ['en:plant-based-foods', 'en:pastas'],
                },
            }),
        });
        assert.deepStrictEqual(r.tags, ['Nudeln']);
    });

    it('maps a product of the first database', async () => {
        const r = await lookupBarcode('4067517001728', {
            lang: 'de',
            fetch: reply({
                status: 1,
                product: {
                    product_name_de: 'Nudeln',
                    brands: 'Marke',
                    quantity: '500 g',
                    image_front_small_url: 'https://images.openfoodfacts.org/a.jpg',
                    nutriscore_grade: 'B',
                },
            }),
        });
        assert.deepStrictEqual(r, {
            name: 'Nudeln',
            brand: 'Marke',
            packageSize: '500 g',
            image: 'https://images.openfoodfacts.org/a.jpg',
            category: 'Lebensmittel',
            nutriscore: 'b',
            tags: [],
        });
    });

    it('tries the sister databases and uses the category of the one that knows it', async () => {
        let n = 0;
        const r = await lookupBarcode('4067517001728', {
            fetch: async () => {
                n++;
                return { ok: true, json: async () => (n === 2 ? { status: 1, product: { product_name: 'Seife' } } : { status: 0 }) };
            },
        });
        assert.strictEqual(r.name, 'Seife');
        assert.strictEqual(r.category, 'Drogerie');
    });

    it('asks the other source right after the first database and before the sister databases', async () => {
        const hosts = [];
        let asked = 0;
        const r = await lookupBarcode('4067517001728', {
            fetch: async url => {
                hosts.push(new URL(url).hostname);
                return { ok: true, json: async () => ({ status: 0 }) };
            },
            afterFirst: async () => {
                asked = hosts.length;
                return { name: 'Shampoo', category: 'Drogerie', source: 'dm.de' };
            },
        });
        assert.strictEqual(r.name, 'Shampoo');
        assert.strictEqual(asked, 1);
        assert.deepStrictEqual(hosts, ['world.openfoodfacts.org']);
    });

    it('does not ask the other source when the first database knows the barcode', async () => {
        let asked = false;
        const r = await lookupBarcode('4067517001728', {
            fetch: reply({ status: 1, product: { product_name: 'Nudeln' } }),
            afterFirst: async () => {
                asked = true;
                return null;
            },
        });
        assert.strictEqual(r.name, 'Nudeln');
        assert.strictEqual(asked, false);
    });

    it('carries on with the sister databases when the other source knows nothing or fails', async () => {
        let n = 0;
        const fetch = async () => {
            n++;
            return { ok: true, json: async () => (n === 3 ? { status: 1, product: { product_name: 'Futter' } } : { status: 0 }) };
        };
        for (const afterFirst of [async () => null, async () => Promise.reject(new Error('down'))]) {
            n = 0;
            const r = await lookupBarcode('4067517001728', { fetch, afterFirst });
            assert.strictEqual(r.name, 'Futter');
            assert.strictEqual(r.category, 'Tierbedarf');
        }
    });

    it('returns null for unknown codes and unreachable databases', async () => {
        assert.strictEqual(await lookupBarcode('4067517001728', { fetch: reply({ status: 0 }) }), null);
        const down = async () => {
            throw new Error('offline');
        };
        assert.strictEqual(await lookupBarcode('4067517001728', { fetch: down }), null);
    });
});
