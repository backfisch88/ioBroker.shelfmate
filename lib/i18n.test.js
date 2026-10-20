'use strict';

const { expect } = require('chai');
const { texts, TABLE } = require('./i18n');

describe('i18n', () => {
    it('has the same keys in every language', () => {
        const keys = Object.keys(TABLE.en).sort();
        for (const [lang, t] of Object.entries(TABLE)) {
            expect(Object.keys(t).sort(), lang).to.deep.equal(keys);
        }
    });

    it('falls back to English', () => {
        expect(texts('xx').product).to.equal('Product');
        expect(texts('DE').product).to.equal('Produkt');
        expect(texts(undefined).product).to.equal('Product');
    });
});
