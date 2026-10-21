'use strict';

const { expect } = require('chai');
const { guessShelfLife } = require('../www/shelfLife');

describe('guessShelfLife', () => {
    it('knows dry goods, also in compound words', () => {
        expect(guessShelfLife('Nudeln Cannelloni')).to.equal(365);
        expect(guessShelfLife('Weizenmehl')).to.equal(180);
        expect(guessShelfLife('Vollkornmehl')).to.equal(90);
        expect(guessShelfLife('Puderzucker')).to.equal(1095);
        expect(guessShelfLife('Gehackte Tomaten')).to.equal(730);
        expect(guessShelfLife('Eiernudeln')).to.equal(365);
        expect(guessShelfLife('MILUPA Milchbrei')).to.equal(540);
    });
    it('prefers the specific rule', () => {
        expect(guessShelfLife('Salzstangen')).to.equal(180);
        expect(guessShelfLife('Meersalz')).to.equal(1095);
    });
    it('gives nothing for fresh and chilled goods', () => {
        for (const t of ['Joghurt', 'Frischkäse', 'Vollmilch', 'Butter', 'Eier', 'Hackfleisch', 'Tortellini frisch', '']) {
            expect(guessShelfLife(t), t).to.equal(0);
        }
    });
});
