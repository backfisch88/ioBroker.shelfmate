'use strict';

const { expect } = require('chai');
const { Inventory } = require('./core');
const { parseItems, checkItems } = require('./pantryCheck');

describe('pantryCheck', () => {
    it('reads amounts in front of and behind the name and between commas', () => {
        const r = parseItems('200 g Mehl\nZucker 1 kg\n3 Eier\n0,5 l Milch\nSalz, 0.5 tl\nZwiebeln, rot, 1\nCherrytomaten, bunt, 500g\nBasilikum');
        expect(r.map(x => [x.name, x.amount, x.kind])).to.deep.equal([
            ['Mehl', 200, 'g'],
            ['Zucker', 1000, 'g'],
            ['Eier', 3, 'count'],
            ['Milch', 500, 'ml'],
            ['Salz', 0, ''],
            ['Zwiebeln', 1, 'count'],
            ['Cherrytomaten', 500, 'g'],
            ['Basilikum', 0, ''],
        ]);
        expect(r[4].lines).to.deep.equal(['Salz, 0.5 tl']);
        expect(r[6].lines).to.deep.equal(['Cherrytomaten, bunt, 500g']);
    });
    it('adds up the same ingredient and keeps the original lines', () => {
        const r = parseItems('Cherrytomaten, bunt, 500g;Cherrytomaten, bunt, 500g');
        expect(r).to.have.length(1);
        expect(r[0].amount).to.equal(1000);
        expect(r[0].lines).to.deep.equal(['Cherrytomaten, bunt, 500g', 'Cherrytomaten, bunt, 500g']);
        expect(parseItems('[{"name":"Butter","amount":50,"unit":"g"},"2 EL Öl"]').map(x => [x.name, x.amount])).to.deep.equal([
            ['Butter', 50],
            ['Öl', 0],
        ]);
    });
    it('compares with the stock', () => {
        const inv = new Inventory(undefined, 'de');
        const loc = Object.keys(inv.data.locations)[0];
        const mehl = inv.handle({ action: 'saveProduct', product: { name: 'Weizenmehl', group: 'Mehl', type: 'weight', packageSize: '1 kg' } }).productId;
        inv.handle({ action: 'changeStock', productId: mehl, locationId: loc, delta: 500 });
        const eier = inv.handle({ action: 'saveProduct', product: { name: 'Eier', type: 'count' } }).productId;
        inv.handle({ action: 'changeStock', productId: eier, locationId: loc, delta: 2 });
        const r = checkItems(inv.data, parseItems('200 g Mehl\n700 g Mehl\n3 Eier\nSalz\nEier'));
        expect(r.map(x => [x.name, x.ok])).to.deep.equal([
            ['Mehl', false],
            ['Eier', false],
            ['Salz', false],
            ['Eier', true],
        ]);
        expect(r[0].missing).to.equal(400);
        expect(checkItems(inv.data, parseItems('200 g Mehl'))[0].ok).to.equal(true);
    });

    it('keeps the lines of what is missing as they came', () => {
        const inv = new Inventory(undefined, 'de');
        const loc = Object.keys(inv.data.locations)[0];
        const mehl = inv.handle({ action: 'saveProduct', product: { name: 'Mehl', type: 'weight', packageSize: '1 kg' } }).productId;
        inv.handle({ action: 'changeStock', productId: mehl, locationId: loc, delta: 1000 });
        inv.handle({ action: 'saveProduct', product: { name: 'Zucker', type: 'weight', packageSize: '1 kg' } });
        const r = checkItems(inv.data, parseItems('Mehl, 500g\nMilch\nCherrytomaten, bunt, 500g + 500g\nZucker'));
        expect(r.filter(x => !x.ok).flatMap(x => x.lines)).to.deep.equal(['Milch', 'Cherrytomaten, bunt, 500g + 500g', 'Zucker']);
    });
});
