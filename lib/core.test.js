'use strict';

const { expect } = require('chai');
const { Inventory, listName } = require('./core');

function setup() {
    const inv = new Inventory();
    const loc = inv.handle({ action: 'saveLocation', location: { group: 'Wohnung', name: 'Box 1', qr: 'Wohnung\nBox 1' } });
    return { inv, loc: loc.locationId };
}

describe('Inventory', () => {
    it('keeps the barcode of Open Food Facts products', () => {
        const { inv } = setup();
        const r = inv.handle({
            action: 'saveProduct',
            product: { name: 'Mehl', ean: '4006363114947', source: 'off' },
        });
        const id = r.productId;
        expect(() =>
            inv.handle({ action: 'saveProduct', product: { id, name: 'Mehl', ean: '4006363114948' } }),
        ).to.throw('cannot be changed');
        inv.handle({ action: 'saveProduct', product: { id, name: 'Mehl 405', ean: '4006363114947' } });
        expect(inv.data.products[id].source).to.equal('off');
        const own = inv.handle({ action: 'saveProduct', product: { name: 'Marmelade', ean: '2045891539893' } });
        inv.handle({ action: 'saveProduct', product: { id: own.productId, name: 'Marmelade', ean: '2045891539894' } });
        expect(inv.data.products[own.productId].ean).to.equal('2045891539894');
        const legacy = inv.handle({
            action: 'saveProduct',
            product: { name: 'Nudeln', ean: '4001234567890', image: 'https://images.openfoodfacts.org/x.jpg' },
        });
        expect(() =>
            inv.handle({ action: 'saveProduct', product: { id: legacy.productId, name: 'Nudeln', ean: '4001234567891' } }),
        ).to.throw('cannot be changed');
    });

    it('resets all data to the state of a new installation', () => {
        const { inv, loc } = setup();
        const r = inv.handle({ action: 'saveProduct', product: { name: 'Mehl', ean: '4006363114947' } });
        inv.handle({ action: 'changeStock', productId: r.productId, locationId: loc, delta: 2 });
        inv.handle({ action: 'resetData' });
        expect(Object.values(inv.data.products).map(p => p.name)).to.deep.equal(['Fusilli No. 98']);
        expect(inv.data.history).to.have.length(0);
                expect(inv.data.locations['speisekammer-regal-1']).to.be.an('object');
    });

    it('accepts a small uploaded jpeg and rejects other data urls', () => {
        const { inv } = setup();
        const ok = `data:image/jpeg;base64,${'A'.repeat(100)}`;
        const r = inv.handle({ action: 'saveProduct', product: { name: 'Bild', ean: '', image: ok } });
        expect(inv.data.products[r.productId].image).to.equal(ok);
        expect(() =>
            inv.handle({ action: 'saveProduct', product: { name: 'X', image: 'data:image/svg+xml;base64,AAAA' } }),
        ).to.throw('HTTPS');
        expect(() =>
            inv.handle({
                action: 'saveProduct',
                product: { name: 'Y', image: `data:image/jpeg;base64,${'A'.repeat(50000)}` },
            }),
        ).to.throw('too large');
    });

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

    it('computes the consumption without moves and tags the device', () => {
        const { inv, loc } = setup();
        const a = inv.handle({ action: 'saveProduct', product: { name: 'Reis' } }).productId;
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: 10 });
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: -3, device: 'iPhone von Henrik' });
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: -1, kind: 'move' });
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: -2, kind: 'stocktake' });
        const list = inv.consumption(30);
        expect(list).to.have.length(1);
        expect(list[0].used).to.equal(3);
        expect(list[0].perWeek).to.equal(0.7);
        expect(list[0].suggestedMin).to.equal(1);
        expect(inv.data.history.filter(h => h.device === 'iPhone von Henrik')).to.have.length(1);
    });

    it('suggests products that belong in one group', () => {
        const { inv } = setup();
        const save = (name, extra = {}) => inv.handle({ action: 'saveProduct', product: { name, ...extra } });
        save('Mehl');
        save('Mehl (Typ 405)');
        save('Mehl - Bio Dinkel');
        save('Zucker');
        save('Reis (Basmati)');
        save('Reis', { type: 'weight' });
        const r = inv.handle({ action: 'suggestGroups' });
        expect(r.suggestions).to.have.length(1);
        expect(r.suggestions[0].group).to.equal('Mehl');
        expect(r.suggestions[0].products).to.have.length(3);
        for (const x of r.suggestions[0].products) {
            inv.handle({ action: 'saveProduct', product: { ...inv.data.products[x.id], group: 'Mehl' } });
        }
        expect(inv.handle({ action: 'suggestGroups' }).suggestions).to.have.length(0);
    });

    it('marks a stocktaking and keeps the mark when the location is edited', () => {
        const { inv, loc } = setup();
        inv.handle({ action: 'markStocktake', locationId: loc });
        const t = inv.data.locations[loc].stocktake;
        expect(t).to.be.a('string');
        inv.handle({ action: 'saveLocation', location: { id: loc, group: 'Wohnung', name: 'Box 1', qr: 'Wohnung\nBox 1' } });
        expect(inv.data.locations[loc].stocktake).to.equal(t);
        expect(() => inv.handle({ action: 'markStocktake', locationId: 'x' })).to.throw('Location not found');
    });

    it('lists everything in stock', () => {
        const inv = new Inventory();
        const loc = Object.keys(inv.data.locations)[0];
        const a = inv.handle({ action: 'saveProduct', product: { name: 'Zucker', minStock: 1 } }).productId;
        inv.handle({ action: 'saveProduct', product: { name: 'Leer' } });
        inv.handle({ action: 'changeStock', productId: a, locationId: loc, delta: 2 });
        const list = inv.inventoryList().filter(x => x.name === 'Zucker');
        expect(list).to.have.length(1);
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

    it('starts with an example area, location and product in the system language', () => {
        const inv = new Inventory(undefined, 'de');
        expect(inv.data.areas).to.deep.equal(['Speisekammer']);
        expect(inv.data.locations['speisekammer-regal-1'].qr).to.equal('Speisekammer\nRegal 1');
        expect(Object.values(inv.data.products)[0].group).to.equal('Nudeln');
        const en = new Inventory(undefined, 'en');
        expect(en.data.areas).to.deep.equal(['Pantry']);
        expect(en.handle({ action: 'resetData' }).changed).to.include('products');
        expect(en.data.locations['speisekammer-regal-1'].name).to.equal('Shelf 1');
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
        expect(inv.data.areas.length).to.equal(1);
        expect(inv.data.history).to.deep.equal([]);
        expect(() => inv.handle({ action: 'nope' })).to.throw('Unknown action');
        expect(() => inv.handle(null)).to.throw('Invalid request');
    });

    it('keeps the incomplete flag until a product is saved as complete', () => {
        const inv = new Inventory(undefined, 'en');
        const r = inv.handle({ action: 'saveProduct', product: { name: 'Unknown', incomplete: true } });
        expect(inv.data.products[r.productId].incomplete).to.equal(true);
        inv.handle({ action: 'saveProduct', product: { id: r.productId, name: 'Unknown 2' } });
        expect(inv.data.products[r.productId].incomplete).to.equal(true);
        inv.handle({ action: 'saveProduct', product: { id: r.productId, name: 'Known', incomplete: false } });
        expect(inv.data.products[r.productId].incomplete).to.equal(false);
    });

    describe('shelf life, undo, spoiled and opened', () => {
        const setup = (extra = {}) => {
            const inv = new Inventory(undefined, 'en');
            const loc = Object.keys(inv.data.locations)[0];
            const r = inv.handle({ action: 'saveProduct', product: { name: 'Pasta', type: 'count', ...extra } });
            return { inv, loc, id: r.productId };
        };
        const ymd = days => {
            const t = new Date();
            const x = new Date(t.getFullYear(), t.getMonth(), t.getDate() + days);
            return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
        };

        it('uses the standard shelf life when stocking in without a date', () => {
            const { inv, loc, id } = setup({ shelfLifeDays: 365 });
            inv.bbMode = 'batch';
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 2 });
            expect(inv.data.batches[id][loc]).to.deep.equal([{ d: ymd(365), q: 2 }]);
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 1, bestBefore: '2030-01-01' });
            expect(inv.data.batches[id][loc].map(b => b.d)).to.deep.equal([ymd(365), '2030-01-01'].sort());
        });

        it('does not add a date in other modes or for moves', () => {
            const { inv, loc, id } = setup({ shelfLifeDays: 30 });
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 1 });
            expect(inv.data.batches[id]).to.equal(undefined);
            inv.bbMode = 'batch';
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 1, kind: 'move' });
            expect(inv.data.batches[id]).to.equal(undefined);
        });

        it('undoes the last booking with stock and batches', () => {
            const { inv, loc, id } = setup();
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 3, bestBefore: '2030-01-01' });
            const before = JSON.stringify([inv.data.inventory, inv.data.batches]);
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: -2 });
            expect(inv.data.inventory[id][loc]).to.equal(1);
            const r = inv.handle({ action: 'undo' });
            expect(r.undone.delta).to.equal(-2);
            expect(JSON.stringify([inv.data.inventory, inv.data.batches])).to.equal(before);
            const h = inv.data.history;
            expect(h[h.length - 2].undone).to.equal(true);
            expect(h[h.length - 1].kind).to.equal('undo');
            expect(inv.consumption(30)).to.deep.equal([]);
            // a second undo goes one booking further back
            inv.handle({ action: 'undo' });
            expect(inv.data.inventory[id]).to.equal(undefined);
            expect(() => inv.handle({ action: 'undo' })).to.throw('Nothing to undo');
        });

        it('refuses to undo a move or a changed last booking', () => {
            const { inv, loc, id } = setup();
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 2 });
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: -1, kind: 'move' });
            expect(() => inv.handle({ action: 'undo' })).to.throw('cannot be undone');
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 1 });
            expect(() => inv.handle({ action: 'undo', historyId: 'h-other' })).to.throw('has changed');
        });

        it('books spoiled stock outside of the consumption', () => {
            const { inv, loc, id } = setup();
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 4 });
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: -1, kind: 'spoiled' });
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: -1 });
            expect(inv.consumption(30)[0].used).to.equal(1);
            expect(inv.spoiled(30)).to.deep.equal([{ name: 'Pasta', unit: 'Stück', n: 1 }]);
            expect(() =>
                inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 1, kind: 'spoiled' }),
            ).to.throw('spoiled');
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: -1, kind: 'spoiled' });
            inv.handle({ action: 'undo' });
            expect(inv.spoiled(30)[0].n).to.equal(1);
        });

        it('opens a package with the shorter shelf life and takes it out first', () => {
            const { inv, loc, id } = setup({ openedDays: 3 });
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 3, bestBefore: '2030-01-01' });
            const r = inv.handle({ action: 'openUnit', productId: id, locationId: loc });
            expect(r.opened).to.equal(1);
            expect(inv.data.inventory[id][loc]).to.equal(3);
            expect(inv.data.batches[id][loc]).to.deep.equal(
                [
                    { d: ymd(3), q: 1, o: 1, f: '2030-01-01' },
                    { d: '2030-01-01', q: 2 },
                ].sort((a, b) => a.d.localeCompare(b.d)),
            );
            inv.bbMode = 'batch';
            expect(inv.expiryList('batch', 5).map(e => e.opened)).to.deep.equal([true]);
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: -1 });
            expect(inv.data.batches[id][loc]).to.deep.equal([{ d: '2030-01-01', q: 2 }]);
            inv.handle({ action: 'undo' });
            expect(inv.data.batches[id][loc].some(b => b.o)).to.equal(true);
        });

        it('opens undated stock without a date and only what is left unopened', () => {
            const { inv, loc, id } = setup();
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 1 });
            inv.handle({ action: 'openUnit', productId: id, locationId: loc });
            expect(inv.data.batches[id][loc]).to.deep.equal([{ d: '', q: 1, o: 1 }]);
            expect(inv.expiryList('batch', 9999)).to.deep.equal([]);
            expect(() => inv.handle({ action: 'openUnit', productId: id, locationId: loc })).to.throw('Nothing left');
        });

        it('closes an opened unit again and restores its date', () => {
            const { inv, loc, id } = setup();
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 2, bestBefore: '2030-01-01' });
            inv.handle({ action: 'openUnit', productId: id, locationId: loc });
            inv.handle({ action: 'closeUnit', productId: id, locationId: loc });
            expect(inv.data.batches[id][loc]).to.deep.equal([{ d: '2030-01-01', q: 2 }]);
            expect(() => inv.handle({ action: 'closeUnit', productId: id, locationId: loc })).to.throw('Nothing opened');
        });
    });
    describe('resetStats', () => {
        it('drops earlier bookings from the consumption but keeps the history', () => {
            const inv = new Inventory(undefined, 'en');
            const loc = Object.keys(inv.data.locations)[0];
            const id = inv.handle({ action: 'saveProduct', product: { name: 'Pasta', type: 'count' } }).productId;
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 5 });
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: -2 });
            expect(inv.consumption(30)).to.have.length(1);
            inv.handle({ action: 'resetStats' });
            expect(inv.consumption(30)).to.have.length(0);
            expect(inv.data.history).to.have.length(2);
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: -1 });
            expect(inv.consumption(30)[0].used).to.equal(1);
        });
    });

    describe('suggested shelf life', () => {
        const setup = () => {
            const inv = new Inventory(undefined, 'en');
            inv.bbMode = 'batch';
            const loc = Object.keys(inv.data.locations)[0];
            return { inv, loc };
        };
        it('sets a date for dry goods without an own shelf life, not for fresh goods', () => {
            const { inv, loc } = setup();
            const pasta = inv.handle({ action: 'saveProduct', product: { name: 'Fusilli', category: 'Teigwaren' } }).productId;
            const yog = inv.handle({ action: 'saveProduct', product: { name: 'Joghurt natur' } }).productId;
            inv.handle({ action: 'changeStock', productId: pasta, locationId: loc, delta: 1 });
            inv.handle({ action: 'changeStock', productId: yog, locationId: loc, delta: 1 });
            expect(inv.data.batches[pasta][loc][0].d).to.match(/^\d{4}-\d{2}-\d{2}$/);
            expect(inv.data.batches[yog]?.[loc]?.[0]?.d || '').to.equal('');
        });
        it('prefers the own value and can be switched off', () => {
            const { inv, loc } = setup();
            inv.autoShelf = false;
            const id = inv.handle({ action: 'saveProduct', product: { name: 'Nudeln' } }).productId;
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 1 });
            expect(inv.data.batches[id]?.[loc]?.[0]?.d || '').to.equal('');
            expect(inv.shelfDays({ name: 'Nudeln', shelfLifeDays: 10 })).to.equal(10);
        });
    });

    describe('fillShelfLife', () => {
        it('fills products without a value and keeps existing ones', () => {
            const inv = new Inventory(undefined, 'en');
            const a = inv.handle({ action: 'saveProduct', product: { name: 'Nudeln' } }).productId;
            const b = inv.handle({ action: 'saveProduct', product: { name: 'Reis', shelfLifeDays: 10 } }).productId;
            const c = inv.handle({ action: 'saveProduct', product: { name: 'Joghurt' } }).productId;
            expect(inv.handle({ action: 'fillShelfLife' }).filled).to.be.at.least(1);
            expect(inv.data.products[a].shelfLifeDays).to.equal(365);
            expect(inv.data.products[b].shelfLifeDays).to.equal(10);
            expect(inv.data.products[c].shelfLifeDays).to.equal(0);
        });
    });

    describe('fillShelfLife dating', () => {
        it('dates existing stock with the stocking day plus the shelf life', () => {
            const inv = new Inventory(undefined, 'en');
            const loc = Object.keys(inv.data.locations)[0];
            const id = inv.handle({ action: 'saveProduct', product: { name: 'Nudeln' } }).productId;
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 3 });
            inv.data.history[inv.data.history.length - 1].time = '2026-01-10T10:00:00.000Z';
            inv.bbMode = 'batch';
            const r = inv.handle({ action: 'fillShelfLife' });
            expect(r.dated).to.equal(1);
            expect(inv.data.batches[id][loc]).to.deep.equal([{ d: '2027-01-10', q: 3 }]);
            expect(inv.handle({ action: 'fillShelfLife' }).dated).to.equal(0);
        });
    });

    describe('setBatchDate', () => {
        const setup = () => {
            const inv = new Inventory(undefined, 'en');
            inv.bbMode = 'batch';
            const loc = Object.keys(inv.data.locations)[0];
            const id = inv.handle({ action: 'saveProduct', product: { name: 'Joghurt' } }).productId;
            return { inv, loc, id };
        };
        it('adds a date to stock without one, also for a part of it', () => {
            const { inv, loc, id } = setup();
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 3 });
            inv.handle({ action: 'setBatchDate', productId: id, locationId: loc, from: '', to: '2030-05-01', quantity: 2 });
            expect(inv.data.batches[id][loc]).to.deep.equal([{ d: '2030-05-01', q: 2 }]);
            inv.handle({ action: 'setBatchDate', productId: id, locationId: loc, from: '', to: '2030-04-01' });
            expect(inv.data.batches[id][loc]).to.deep.equal([
                { d: '2030-04-01', q: 1 },
                { d: '2030-05-01', q: 2 },
            ]);
        });
        it('changes and removes dates, merges equal dates and can be undone', () => {
            const { inv, loc, id } = setup();
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 1, bestBefore: '2030-01-01' });
            inv.handle({ action: 'changeStock', productId: id, locationId: loc, delta: 1, bestBefore: '2030-02-01' });
            inv.handle({ action: 'setBatchDate', productId: id, locationId: loc, from: '2030-01-01', to: '2030-02-01' });
            expect(inv.data.batches[id][loc]).to.deep.equal([{ d: '2030-02-01', q: 2 }]);
            inv.handle({ action: 'setBatchDate', productId: id, locationId: loc, from: '2030-02-01', to: '' });
            expect(inv.data.batches[id]).to.equal(undefined);
            expect(inv.data.inventory[id][loc]).to.equal(2);
            inv.handle({ action: 'undo' });
            expect(inv.data.batches[id][loc]).to.deep.equal([{ d: '2030-02-01', q: 2 }]);
            expect(() => inv.handle({ action: 'setBatchDate', productId: id, locationId: loc, from: '2031-01-01', to: '' })).to.throw(
                'Batch not found',
            );
        });
    });

});
