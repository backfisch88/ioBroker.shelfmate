'use strict';

const { expect } = require('chai');
const { guessShelfLife, guessOpenedDays } = require('../www/shelfLife');

describe('guessShelfLife', () => {
    it('knows dry goods, also in compound words', () => {
        expect(guessShelfLife('Nudeln Cannelloni')).to.equal(365);
        expect(guessShelfLife('Weizenmehl')).to.equal(180);
        expect(guessShelfLife('Vollkornmehl')).to.equal(120);
        expect(guessShelfLife('Puderzucker')).to.equal(1095);
        expect(guessShelfLife('Gehackte Tomaten')).to.equal(730);
        expect(guessShelfLife('Eiernudeln')).to.equal(365);
        expect(guessShelfLife('MILUPA Milchbrei')).to.equal(0);
    });
    it('prefers the specific rule', () => {
        expect(guessShelfLife('Salzstangen')).to.equal(120);
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
    it('setzt Babynahrung auf 4 Monate', () => {
        expect(guessShelfLife('Hipp Karotten Gläschen')).to.equal(120);
        expect(guessShelfLife('Bulgur-Gemüsepfanne Hipp')).to.equal(120);
    });
    it('setzt Babynahrung nach dem Öffnen auf 2 Tage', () => {
        expect(guessOpenedDays('Hipp Karotten Gläschen')).to.equal(2);
    });
});

describe('drugstore and household products', () => {
    const { guessShelfLife, guessOpenedDays, isNonFood } = require('../www/shelfLife');
    it('get no food guess', () => {
        const t = 'Baby & Kinder Badezusatz Pflegebad 250 ml Drogerie';
        if (!isNonFood(t) || guessShelfLife(t, t) !== 0 || guessOpenedDays(t) !== 0) {
            throw new Error('bath additive got a food guess');
        }
        const u = 'Cremeseife Milch & Honig Balea';
        if (guessOpenedDays(u) !== 0) {
            throw new Error('soap got a food guess');
        }
    });
    it('food keeps its guess', () => {
        if (guessOpenedDays('Milch 1l') !== 3 || guessShelfLife('Babybrei Karotte', 'Babybrei Karotte') !== 120) {
            throw new Error('food guess lost');
        }
    });
});

describe('own rules and drugstore goods', () => {
    const sl = require('../www/shelfLife');
    afterEach(() => sl.setShelfRules([]));
    it('an own food rule does not reach a bath additive, a drugstore rule does', () => {
        sl.setShelfRules([{ words: 'baby', shelf: 120, opened: 2 }]);
        const bath = 'Baby & Kinder Badezusatz Pflegebad Drogerie';
        if (sl.guessShelfLife(bath, bath) !== 0 || sl.guessOpenedDays(bath) !== 0) {
            throw new Error('own food rule hit a bath additive');
        }
        if (sl.guessShelfLife('Babybrei Karotte', 'Babybrei Karotte') !== 120) {
            throw new Error('own rule lost for baby food');
        }
        sl.setShelfRules([{ words: 'badezusatz', shelf: 730, opened: 180 }]);
        if (sl.guessShelfLife(bath, bath) !== 730) {
            throw new Error('own drugstore rule ignored');
        }
    });
});
