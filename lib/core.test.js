'use strict';

const { expect } = require('chai');
const { Inventory, listName } = require('./core');

function setup() {
    const inv = new Inventory();
    const loc = inv.handle({ action: 'saveLocation', location: { group: 'Wohnung', name: 'Box 1', qr: 'Wohnung\nBox 1' } });
    return { inv, loc: loc.locationId };
}

describe('Inventory', () => {
    it('cleans names for the shopping list', () => {
        expect(listName('Mehl - Type/405 (1kg)!')).to.equal('Mehl Type 405 1kg');
    });

    it('rejects invalid barcodes and duplicate barcodes', () => {
        const { inv } = setup();
        expect(() => inv.handle({ action: 'saveProduct', product: { name: 'A', ean: '12' } })).to.throw(
            'Invalid barcode',
        );
        inv.handle({ action: 'saveProduct', product: { name: 'A', ean: '4001234567890' } });
        expect(() => inv.handle({ action: 'saveProduct', product: { name: 'B', ean: '4001234567890' } })).to.throw(
            'already belongs',
        );
    });

    it('books stock in and out and refuses to go below zero', () => {
        const { inv, loc } = setup();
        const { productId } = inv.handle({ action: 'saveProduct', product: { name: 'Salz' } });
        inv.handle({ action: 'changeStock', productId, locationId: loc, delta: 3 });
        expect(inv.stockOf(productId)).to.equal(3);
        expect(() => inv.handle({ action: 'changeStock', productId, locationId: loc, delta: -4 })).to.throw(
            'Not enough',
        );
        expect(() => inv.handle({ action: 'changeStock', productId, locationId: loc, delta: 0.5 })).to.throw('whole');
    });

    it('triggers reorder exactly when crossing the minimum stock, summing a group', () => {
        const { inv, loc } = setup();
        const a = inv.handle({
            action: 'saveProduct',
            product: { name: 'Mehl A', group: 'Mehl', minStock: 1 },
        }).productId;
        const b = inv.handle({ action: 'saveProduct', product: { name: 'Mehl B', group: 'Mehl' } }).productId;
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: 1 });
        inv.handle({ action: 'changeStock', productId: b, locationId: loc, delta: 2 });
        const r1 = inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: -1 });
        expect(r1.reorder).to.equal('');
        expect(inv.lowStockNames()).to.deep.equal([]);
        const r2 = inv.handle({ action: 'changeStock', productId: b, locationId: loc, delta: -1 });
        expect(r2.reorder).to.equal('Mehl');
        expect(inv.lowStockNames()).to.deep.equal(['Mehl']);
        const r3 = inv.handle({ action: 'changeStock', productId: b, locationId: loc, delta: 1 });
        expect(r3.reorder).to.equal('');
        expect(r3.restock).to.equal('Mehl');
        expect(inv.handle({ action: 'changeStock', productId: b, locationId: loc, delta: 1 }).restock).to.equal('');
    });

    it('lists everything in stock', () => {
        const inv = new Inventory();
        const loc = Object.keys(inv.data.locations)[0];
        const a = inv.handle({ action: 'saveProduct', product: { name: 'Zucker', minStock: 1 } }).productId;
        inv.handle({ action: 'saveProduct', product: { name: 'Leer' } });
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: 2 });
        const list = inv.inventoryList();
        expect(list.map(x => x.name)).to.deep.equal(['Zucker']);
        expect(list[0].amount).to.equal(2);
        expect(list[0].places).to.have.length(1);
    });

    it('tracks best-before batches and uses the oldest first', () => {
        const inv = new Inventory();
        const loc = Object.keys(inv.data.locations)[0];
        const a = inv.handle({ action: 'saveProduct', product: { name: 'Milch' } }).productId;
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: 2, bestBefore: '2026-11-10' });
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: 3, bestBefore: '2026-11-01' });
        expect(inv.data.batches[a][loc]).to.deep.equal([
            { d: '2026-11-01', q: 3 },
            { d: '2026-11-10', q: 2 },
        ]);
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: -4 });
        expect(inv.data.batches[a][loc]).to.deep.equal([{ d: '2026-11-10', q: 1 }]);
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: -1 });
        expect(inv.data.batches[a]).to.equal(undefined);
        expect(() =>
            inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: 1, bestBefore: 'soon' }),
        ).to.throw('Invalid best-before date');
    });

    it('lists expired and expiring products per mode', () => {
        const inv = new Inventory();
        const loc = Object.keys(inv.data.locations)[0];
        const a = inv.handle({ action: 'saveProduct', product: { name: 'Joghurt', bestBefore: '2026-10-12' } }).productId;
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: 2, bestBefore: '2026-10-30' });
        const now = new Date(2026, 9, 14);
        expect(inv.expiryList('off', 7, now)).to.deep.equal([]);
        const byProduct = inv.expiryList('product', 7, now);
        expect(byProduct).to.have.length(1);
        expect(byProduct[0].expired).to.equal(true);
        expect(inv.expiryList('batch', 7, now)).to.deep.equal([]);
        expect(inv.expiryList('batch', 20, now)[0].days).to.equal(16);
    });

    it('refuses to delete locations that still hold stock', () => {
        const { inv, loc } = setup();
        const { productId } = inv.handle({ action: 'saveProduct', product: { name: 'Reis' } });
        inv.handle({ action: 'changeStock', productId, locationId: loc, delta: 1 });
        expect(() => inv.handle({ action: 'deleteLocation', locationId: loc })).to.throw('still contains');
    });

    it('starts with the old defaults', () => {
        const inv = new Inventory();
        expect(inv.data.areas).to.deep.equal(['Wohnung', 'Keller']);
        expect(inv.data.locations['wohnung-box-5'].qr).to.equal('Wohnung\nBox 5');
    });

    it('imports a backup and rejects invalid files', () => {
        const { inv, loc } = setup();
        const backup = JSON.parse(JSON.stringify(inv.data));
        backup.products = { x1: { name: 'Zucker', type: 'count', ean: '' } };
        backup.exportedAt = 'now';
        const r = inv.handle({ action: 'importData', data: backup });
        expect(r.products).to.equal(1);
        expect(inv.data.products.x1.id).to.equal('x1');
        expect(inv.data.locations[loc]).to.not.equal(undefined);
        expect(() => inv.handle({ action: 'importData', data: { products: [] } })).to.throw('Not a ShelfMate backup');
        expect(() => inv.handle({ action: 'importData', data: { products: { a: {} }, locations: {} } })).to.throw('without a name');
    });

    it('survives garbage stored data', () => {
        const inv = new Inventory({ products: [], areas: 5, history: 'x' });
        expect(inv.data.areas.length).to.equal(2);
        expect(inv.data.history).to.deep.equal([]);
        expect(() => inv.handle({ action: 'nope' })).to.throw('Unknown action');
        expect(() => inv.handle(null)).to.throw('Invalid request');
    });
});
