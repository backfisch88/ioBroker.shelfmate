'use strict';

const { expect } = require('chai');
const { lookupOrder } = require('./lookupOrder');

describe('lookupOrder', () => {
    it('keeps the standard order without a setting', () => {
        expect(lookupOrder(undefined)).to.deep.equal(['food', 'drogerie', 'pet', 'household', 'pharmacy', 'books']);
    });
    it('puts the chosen sources first and adds the rest', () => {
        expect(lookupOrder([{ source: 'pet' }, { source: 'food' }])).to.deep.equal([
            'pet',
            'food',
            'drogerie',
            'household',
            'pharmacy',
            'books',
        ]);
    });
    it('drops unknown entries and doubles', () => {
        expect(lookupOrder(['household', 'nothing', 'HOUSEHOLD', 'books'])).to.deep.equal([
            'household',
            'books',
            'food',
            'drogerie',
            'pet',
            'pharmacy',
        ]);
        expect(lookupOrder('drogerie, books')[0]).to.equal('drogerie');
    });
});
