'use strict';

const assert = require('node:assert');
const { Inventory } = require('./core');
const { ScanEngine, unitAmount, shortId } = require('./scanner');

/**
 * @param {string} lang language
 */
function setup(lang = 'en') {
    const inv = new Inventory(undefined, 'en');
    for (const [id, name, qr] of [
        ['a', 'Shelf A', 'Home\nShelfA'],
        ['b', 'Shelf B', ''],
    ]) {
        const r = inv.handle({ action: 'saveLocation', location: { group: 'Home', name, qr } });
        inv.data.locations[id] = { ...inv.data.locations[r.locationId], id };
        delete inv.data.locations[r.locationId];
    }
    const pa = inv.handle({ action: 'saveProduct', product: { name: 'Pasta', ean: '4000000000017', type: 'count' } });
    const fl = inv.handle({
        action: 'saveProduct',
        product: { name: 'Flour', ean: '4000000000024', type: 'weight', packageSize: '1 kg' },
    });
    const sc = new ScanEngine(inv, { timeoutMs: 10000, lang });
    return { inv, sc, pasta: pa.productId, flour: fl.productId };
}

describe('ScanEngine', () => {
    it('finds a location by the short id code of a barcode label', () => {
        const { inv, sc, pasta } = setup();
        const r = inv.handle({ action: 'saveLocation', location: { group: 'Home', name: 'Box' } });
        sc.handle('4000000000017', 1000);
        const res = sc.handle(`SM:L:${shortId(r.locationId)}`, 2000);
        assert.ok(res.ok, res.text);
        assert.strictEqual(inv.data.inventory[pasta][r.locationId], 1);
    });

    it('stocks in: product, then location', () => {
        const { inv, sc, pasta } = setup();
        assert.strictEqual(sc.handle('4000000000017', 0).action, 'wait');
        const r = sc.handle('Home\nShelfA', 1000);
        assert.strictEqual(r.ok, true);
        assert.strictEqual(r.action, 'in');
        assert.strictEqual(inv.data.inventory[pasta].a, 1);
        assert.strictEqual(inv.data.history.slice(-1)[0].device, 'scanner');
    });

    it('recognises a location whose lines were joined', () => {
        const { inv, sc, pasta } = setup();
        sc.handle('4000000000017', 0);
        sc.handle('Home ShelfA', 100);
        assert.strictEqual(inv.data.inventory[pasta].a, 1);
    });

    it('takes out after two scans of the product at the location', () => {
        const { inv, sc, pasta } = setup();
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'a', delta: 3 });
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'b', delta: 3 });
        sc.handle('4000000000017', 0);
        sc.handle('4000000000017', 500);
        const r = sc.handle('sm:l:b', 900);
        assert.strictEqual(r.action, 'out');
        assert.strictEqual(inv.data.inventory[pasta].b, 2);
        assert.strictEqual(inv.data.inventory[pasta].a, 3);
    });

    it('takes out automatically after the time from the location with the nearest best-before date', () => {
        const { inv, sc, pasta } = setup();
        inv.data.config = { ...inv.data.config, bestBeforeMode: 'batch' };
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'a', delta: 2, bestBefore: '2027-05-01' });
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'b', delta: 5, bestBefore: '2027-01-01' });
        sc.handle('4000000000017', 0);
        sc.handle('4000000000017', 100);
        assert.strictEqual(sc.flush(5000), null);
        const r = sc.flush(20000);
        assert.strictEqual(r.action, 'out');
        assert.strictEqual(inv.data.inventory[pasta].b, 4);
        assert.strictEqual(inv.data.inventory[pasta].a, 2);
    });

    it('takes out from the biggest stock without best-before dates', () => {
        const { inv, sc, pasta } = setup();
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'a', delta: 2 });
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'b', delta: 5 });
        sc.handle('4000000000017', 0);
        sc.handle('4000000000017', 100);
        sc.flush(20000);
        assert.strictEqual(inv.data.inventory[pasta].b, 4);
    });

    it('discards a single scan after the time', () => {
        const { inv, sc, pasta } = setup();
        sc.handle('4000000000017', 0);
        const r = sc.flush(20000);
        assert.strictEqual(r.action, 'timeout');
        assert.strictEqual(inv.data.inventory[pasta], undefined);
    });

    it('uses the quantity code once and uses packages for weight', () => {
        const { inv, sc, pasta, flour } = setup();
        assert.strictEqual(sc.handle('SM:QTY:5', 0).action, 'qty');
        sc.handle('4000000000017', 100);
        sc.handle('Home\nShelfA', 200);
        assert.strictEqual(inv.data.inventory[pasta].a, 5);
        sc.handle('4000000000024', 300);
        sc.handle('Home\nShelfA', 400);
        assert.strictEqual(inv.data.inventory[flour].a, 1000);
        sc.handle('4000000000017', 500);
        sc.handle('Home\nShelfA', 600);
        assert.strictEqual(inv.data.inventory[pasta].a, 6);
    });

    it('cancels and rejects unknown codes', () => {
        const { sc } = setup('de');
        assert.strictEqual(sc.handle('123', 0).ok, false);
        sc.handle('4000000000017', 0);
        assert.strictEqual(sc.handle('SM:CANCEL', 10).action, 'cancel');
        assert.strictEqual(sc.deadline, 0);
    });

    it('stocking mode: location, products, same location again', () => {
        const { inv, sc, pasta, flour } = setup();
        assert.strictEqual(sc.handle('Home\nShelfA', 0).action, 'sessionStart');
        sc.handle('4000000000017', 1);
        sc.handle('4000000000017', 2);
        sc.handle('SM:QTY:3', 3);
        sc.handle('4000000000017', 4);
        sc.handle('4000000000024', 5);
        assert.strictEqual(inv.data.inventory[pasta].a, 5);
        assert.strictEqual(inv.data.inventory[flour].a, 1000);
        const r = sc.handle('Home\nShelfA', 6);
        assert.strictEqual(r.action, 'sessionEnd');
        assert.match(r.text, /6 items/);
        assert.strictEqual(sc.deadline, 0);
    });

    it('stocking mode ends by time, by another location and by cancel', () => {
        const { inv, sc, pasta } = setup();
        sc.handle('Home\nShelfA', 0);
        sc.handle('4000000000017', 1);
        assert.ok(sc.deadline > 100000);
        assert.strictEqual(sc.flush(400000).action, 'sessionEnd');
        sc.handle('Home\nShelfA', 500000);
        const r = sc.handle('SM:L:b', 500001);
        assert.strictEqual(r.action, 'sessionStart');
        assert.strictEqual(r.earlier.action, 'sessionEnd');
        sc.handle('4000000000017', 500002);
        assert.strictEqual(inv.data.inventory[pasta].b, 1);
        assert.strictEqual(sc.handle('SM:CANCEL', 500003).action, 'cancel');
        assert.strictEqual(sc.handle('4000000000017', 500004).action, 'wait');
    });

    it('does not take out more than there is at the chosen location', () => {
        const { inv, sc, pasta } = setup();
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'a', delta: 1 });
        sc.handle('SM:QTY:2', 0);
        sc.handle('4000000000017', 1);
        sc.handle('4000000000017', 2);
        const r = sc.handle('Home\nShelfA', 3);
        assert.strictEqual(r.ok, false);
        assert.strictEqual(inv.data.inventory[pasta].a, 1);
    });

    it('derives amounts from the package size', () => {
        assert.strictEqual(unitAmount({ type: 'count' }), 1);
        assert.strictEqual(unitAmount({ type: 'weight', packageSize: '500 g' }), 500);
        assert.strictEqual(unitAmount({ type: 'volume', packageSize: '1,5 l' }), 1500);
        assert.strictEqual(unitAmount({ type: 'weight', packageSize: '1 l' }), 0);
        assert.strictEqual(unitAmount({ type: 'weight', packageSize: '' }), 0);
    });

    it('undoes the last scan with SM:UNDO', () => {
        const { inv, sc, pasta } = setup();
        sc.handle('4000000000017', 0);
        sc.handle('Home\nShelfA', 1);
        assert.strictEqual(inv.data.inventory[pasta].a, 1);
        const r = sc.handle('SM:UNDO', 2);
        assert.ok(r.ok, r.text);
        assert.strictEqual(inv.data.inventory[pasta], undefined);
        assert.strictEqual(sc.handle('SM:UNDO', 3).ok, false);
    });

    it('undoes an automatic take-out over several locations in one step', () => {
        const { inv, sc, pasta } = setup();
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'a', delta: 1 });
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'b', delta: 1 });
        sc.handle('SM:QTY:2', 0);
        sc.handle('4000000000017', 1);
        sc.handle('4000000000017', 2);
        assert.ok(sc.flush(20000).ok);
        assert.strictEqual(Object.keys(inv.data.inventory[pasta] || {}).length, 0);
        assert.ok(sc.handle('SM:UNDO', 20001).ok);
        assert.strictEqual(inv.data.inventory[pasta].a, 1);
        assert.strictEqual(inv.data.inventory[pasta].b, 1);
    });

    it('does not undo a booking that was made elsewhere in between', () => {
        const { inv, sc, pasta } = setup();
        sc.handle('4000000000017', 0);
        sc.handle('Home\nShelfA', 1);
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'b', delta: 1 });
        const r = sc.handle('SM:UNDO', 2);
        assert.strictEqual(r.ok, false);
        assert.strictEqual(inv.data.inventory[pasta].a, 1);
    });

    it('books a spoiled take-out with SM:SPOIL', () => {
        const { inv, sc, pasta } = setup('de');
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'a', delta: 2 });
        sc.handle('SM:SPOIL', 0);
        sc.handle('4000000000017', 1);
        sc.handle('4000000000017', 2);
        const r = sc.flush(20000);
        assert.match(r.text, /verdorben/);
        assert.strictEqual(inv.data.history[inv.data.history.length - 1].kind, 'spoiled');
        sc.handle('4000000000017', 30000);
        sc.handle('4000000000017', 30001);
        sc.flush(60000);
        assert.strictEqual(inv.data.history[inv.data.history.length - 1].kind, undefined);
    });

    it('marks a package as opened with SM:OPEN', () => {
        const { inv, sc, pasta } = setup();
        inv.handle({ action: 'saveProduct', product: { id: pasta, name: 'Pasta', ean: '4000000000017', openedDays: 5 } });
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'a', delta: 2 });
        assert.ok(sc.handle('SM:OPEN', 0).ok);
        const r = sc.handle('4000000000017', 1);
        assert.strictEqual(r.action, 'open');
        assert.ok(r.ok, r.text);
        assert.strictEqual(inv.data.inventory[pasta].a, 2);
        assert.ok(inv.data.batches[pasta].a.some(b => b.o));
        assert.strictEqual(sc.deadline, 0);
        assert.ok(sc.handle('SM:UNDO', 2).ok);
        assert.strictEqual(inv.data.batches[pasta], undefined);
    });

    it('dates all unopened stock with SM:DATE and can undo it', () => {
        const { inv, sc, pasta } = setup();
        inv.bbMode = 'batch';
        inv.autoShelf = false;
        inv.handle({ action: 'changeStock', productId: pasta, locationId: 'a', delta: 3 });
        assert.ok(sc.handle('SM:DATE:7', 0).ok);
        const r = sc.handle('4000000000017', 1);
        assert.strictEqual(r.action, 'date');
        assert.ok(r.ok, r.text);
        assert.deepStrictEqual(
            inv.data.batches[pasta].a.map(b => b.q),
            [3],
        );
        assert.match(inv.data.batches[pasta].a[0].d, /^\d{4}-\d\d-\d\d$/);
        assert.ok(sc.handle('SM:UNDO', 2).ok);
        assert.strictEqual(inv.data.batches[pasta], undefined);
        sc.handle('SM:DATE:7', 3);
        sc.handle('4000000000017', 4);
        sc.handle('SM:DATE:0', 5);
        assert.ok(sc.handle('4000000000017', 6).ok);
        assert.strictEqual(inv.data.batches[pasta], undefined);
    });
});
