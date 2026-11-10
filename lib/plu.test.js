'use strict';

const { expect } = require('chai');
const { Inventory } = require('./core');
const { ScanEngine } = require('./scanner');
const { pluOf, parseGs1, scanCode, parseUser, findPlu, baseList } = require('./plu');
const LIST = require('./pluData');
const NAMES = require('./pluNames');

const LANGS = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];

describe('Produce numbers (PLU)', () => {
    it('reads the label of a scale: article number and price', () => {
        const g = parseGs1('01000000000042383922112');
        expect(g.plu).to.equal('4238');
        expect(g.code).to.equal('4238');
        expect(g.price).to.equal(1.12);
        expect(g.weight).to.equal(undefined);
    });

    it('reads weight, date and a group separator', () => {
        const g = parseGs1('01' + '00000000094011' + '3103000565' + '17261231\u001d');
        expect(g.plu).to.equal('94011');
        expect(g.weight).to.equal(0.565);
    });

    it('keeps real article numbers and other texts as they are', () => {
        expect(scanCode('01040063813339313922112')).to.equal('04006381333931');
        expect(scanCode('4006381333931')).to.equal('4006381333931');
        expect(scanCode('SM:UNDO')).to.equal('SM:UNDO');
        expect(parseGs1('4006381333931')).to.equal(null);
    });

    it('accepts four digits and nine plus four digits only', () => {
        expect(pluOf('4238')).to.equal('4238');
        expect(pluOf('94238')).to.equal('94238');
        expect(pluOf('12')).to.equal('');
        expect(pluOf('5238')).to.equal('');
        expect(pluOf('4006381333931')).to.equal('');
    });

    it('knows bananas, also the numbers retailers assign themselves', () => {
        expect(baseList().size).to.be.above(1500);
        expect(findPlu('4011', { lang: 'de' }).name).to.equal('Banane');
        expect(findPlu('4238', { lang: 'de' }).name).to.equal('Banane');
        expect(findPlu('4238', { lang: 'en' }).name).to.equal('Banana');
        expect(findPlu('4238', { lang: 'fr' }).name).to.equal('Banane');
        expect(findPlu('4238', { lang: 'zh-cn' }).name).to.equal('香蕉');
        expect(findPlu('4238', { lang: 'xx' }).name).to.equal('Banana');
        expect(findPlu('4238', { lang: 'de' }).category).to.equal('Lebensmittel');
        expect(findPlu('4238', { lang: 'en' }).category).to.equal('Lebensmittel');
        expect(findPlu('4087', { lang: 'de' }).name).to.equal('Tomate');
        expect(findPlu('4400', { lang: 'de' })).to.not.equal(null);
        expect(findPlu('4000', { lang: 'de' })).to.equal(null);
    });

    it('adds organic for the number with a 9 in front', () => {
        const f = findPlu('94011', { lang: 'de' });
        expect(f.name).to.equal('Banane Bio');
        expect(f.tags).to.deep.equal(['Bio']);
    });

    it('prefers own entries and reads both forms of the data point', () => {
        const user = parseUser('{"4238": "Banane Bio", "4400": {"name": "Pfirsich", "packageSize": "500 g"}, "x": "y"}');
        expect(user.size).to.equal(2);
        expect(findPlu('4238', { lang: 'de', user }).name).to.equal('Banane Bio');
        expect(findPlu('94238', { lang: 'de', user }).name).to.equal('Banane Bio');
        expect(findPlu('4400', { lang: 'de', user }).packageSize).to.equal('500 g');
        expect(parseUser('no json').size).to.equal(0);
        expect(parseUser('').size).to.equal(0);
    });

    it('books a scanned scale label on the product with that number', () => {
        const inv = new Inventory(undefined, 'de');
        const loc = Object.keys(inv.data.locations)[0];
        const id = inv.handle({
            action: 'saveProduct',
            product: { name: 'Banane Bio', ean: '4238', type: 'count' },
        }).productId;
        const sc = new ScanEngine(inv, { timeoutMs: 10000, lang: 'de' });
        expect(sc.isNewPlu('4238')).to.equal(false);
        expect(sc.isNewPlu('4011')).to.equal(true);
        sc.handle('01000000000042383922112', 1000);
        const r = sc.handle(`SM:L:${loc}`, 2000);
        expect(r.text).to.not.contain('Unbekannt');
        expect(Object.values(inv.data.inventory[id] || {})[0]).to.equal(1);
    });

    it('has every name in all languages of the adapter', () => {
        for (const [name] of LIST) {
            expect(NAMES, name).to.have.property(name);
            for (const l of LANGS) {
                expect(NAMES[name][l], `${name} ${l}`).to.be.a('string').and.not.equal('');
            }
        }
        expect(Object.keys(NAMES)).to.have.length(LIST.length);
    });

    it('names organic produce in each language', () => {
        for (const l of LANGS) {
            const f = findPlu('94011', { lang: l });
            expect(f.name, l).to.contain(f.tags[0]);
            expect(f.name, l).to.not.equal(findPlu('4011', { lang: l }).name);
        }
    });
});
