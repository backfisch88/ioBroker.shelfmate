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

    it('returns null for unknown codes and unreachable databases', async () => {
        assert.strictEqual(await lookupBarcode('4067517001728', { fetch: reply({ status: 0 }) }), null);
        const down = async () => {
            throw new Error('offline');
        };
        assert.strictEqual(await lookupBarcode('4067517001728', { fetch: down }), null);
    });
});
