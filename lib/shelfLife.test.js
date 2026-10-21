'use strict';

const { expect } = require('chai');
const { guessShelfLife, guessOpenedDays } = require('../www/shelfLife');

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

    it('suggests a shelf life after opening', () => {
        expect(guessOpenedDays('Nutella')).to.equal(90);
        expect(guessOpenedDays('Vollmilch')).to.equal(3);
        expect(guessOpenedDays('Joghurt')).to.equal(5);
        expect(guessOpenedDays('Cola')).to.equal(0);
    });
});
