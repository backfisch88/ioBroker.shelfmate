'use strict';

const { expect } = require('chai');
const { Inventory } = require('./core');
const { parseItems, checkItems } = require('./pantryCheck');

describe('pantryCheck', () => {
    it('reads amounts in front of and behind the name', () => {
        expect(parseItems('200 g Mehl, Zucker 1 kg, 3 Eier, 0,5 l Milch, Salz')).to.deep.equal([
            { name: 'Mehl', amount: 200, kind: 'g' },
            { name: 'Zucker', amount: 1000, kind: 'g' },
            { name: 'Eier', amount: 3, kind: 'count' },
            { name: 'Milch', amount: 500, kind: 'ml' },
            { name: 'Salz', amount: 0, kind: '' },
        ]);
    });
    it('reads lists and JSON and adds up the same ingredient', () => {
        expect(parseItems('100g Mehl\n150 g Mehl')).to.deep.equal([{ name: 'Mehl', amount: 250, kind: 'g' }]);
        expect(parseItems('[{"name":"Butter","amount":50,"unit":"g"},"2 EL Öl"]')).to.deep.equal([
            { name: 'Butter', amount: 50, kind: 'g' },
            { name: 'Öl', amount: 0, kind: '' },
        ]);
    });
    it('compares with the stock', () => {
        const inv = new Inventory(undefined, 'de');
        const loc = Object.keys(inv.data.locations)[0];
        const mehl = inv.handle({ action: 'saveProduct', product: { name: 'Weizenmehl', group: 'Mehl', type: 'weight', packageSize: '1 kg' } }).productId;
        inv.handle({ action: 'changeStock', productId: mehl, locationId: loc, delta: 500 });
        const eier = inv.handle({ action: 'saveProduct', product: { name: 'Eier', type: 'count' } }).productId;
        inv.handle({ action: 'changeStock', productId: eier, locationId: loc, delta: 2 });
        const r = checkItems(inv.data, parseItems('200 g Mehl, 700 g Mehl, 3 Eier, Salz, Eier'));
        expect(r.map(x => [x.name, x.ok])).to.deep.equal([
            ['Mehl', false],
            ['Eier', false],
            ['Salz', false],
            ['Eier', true],
        ]);
        expect(r[0].missing).to.equal(400);
        expect(checkItems(inv.data, parseItems('200 g Mehl'))[0].ok).to.equal(true);
    });
});
