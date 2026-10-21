'use strict';

const { expect } = require('chai');
const { code128 } = require('../www/code128');
const { shortId } = require('./scanner');

describe('code128', () => {
    it('encodes with start B, checksum and stop pattern', () => {
        const b = code128('SM:CANCEL');
        expect(b.startsWith('11010010000')).to.equal(true);
        expect(b.endsWith('1100011101011')).to.equal(true);
        expect(b.length).to.equal(134);
    });

    it('rejects text outside printable ASCII', () => {
        expect(code128('Küche')).to.equal('');
        expect(code128('')).to.equal('');
    });

    it('shortens location ids for printed codes', () => {
        expect(shortId('loc-1a2b3c4d-5e6f-7a8b-9c0d-112233445566')).to.equal('1a2b3c4d');
    });
});
