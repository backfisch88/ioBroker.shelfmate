'use strict';

const { expect } = require('chai');
const c = require('../www/scanCodes');

describe('scanCodes', () => {
    it('accepts codes of letters and digits (Amazon FNSKU) and nothing else', () => {
        expect(c.textCodeOf('X001R86CKT')).to.equal('X001R86CKT');
        expect(c.textCodeOf(' B0C1234567 ')).to.equal('B0C1234567');
        expect(c.textCodeOf('AB-1234-XY')).to.equal('AB-1234-XY');
        expect(c.textCodeOf('4006381333931')).to.equal('');
        expect(c.textCodeOf('ENTERNOW')).to.equal('');
        expect(c.textCodeOf('X1')).to.equal('');
        expect(c.textCodeOf('SM:OUT')).to.equal('');
        expect(c.textCodeOf('Regal 12')).to.equal('');
        expect(c.textCodeOf('PZN-12345678')).to.equal('');
    });

    it('knows ISBN-13, ISBN-10 and the book barcode', () => {
        expect(c.isbnOf('9783161484100')).to.equal('9783161484100');
        expect(c.isbnOf('978-3-16-148410-0')).to.equal('9783161484100');
        expect(c.isbnOf('ISBN 3-16-148410-X')).to.equal('9783161484100');
        expect(c.isbnOf('3161484100')).to.equal('');
        expect(c.isbnOf('9783161484101')).to.equal('');
        expect(c.isbnOf('4006381333931')).to.equal('');
        expect(c.kindOf('9783161484100')).to.equal('isbn');
    });

    it('knows magazines (ISSN) and sheet music (ISMN)', () => {
        expect(c.issnOf('9770317847001')).to.equal('0317-8471');
        expect(c.kindOf('9770317847001')).to.equal('issn');
        expect(c.issnOf('9783161484100')).to.equal('');
        const ismn = c.withCheck ? '' : '9790001138505';
        expect(c.eanOk(ismn)).to.equal(true);
        expect(c.kindOf(ismn)).to.equal('ismn');
    });

    it('checks the PZN and builds the barcode number of a medicine', () => {
        expect(c.pznOk('12345678')).to.equal(true);
        expect(c.pznOk('12345679')).to.equal(false);
        expect(c.ntinOfPzn('12345678')).to.equal('4150123456782');
        expect(c.ntinOfPzn('12345679')).to.equal('');
        expect(c.pznOfNtin('4150123456782')).to.equal('12345678');
        expect(c.pznOfNtin('4150123456783')).to.equal('');
        expect(c.kindOf('4150123456782')).to.equal('pzn');
    });

    it('reads the GS1 data matrix of a medicine with the best-before date', () => {
        const r = c.info('01041501234567821715010110ABC1234567\u001d21123456789012');
        expect(r).to.deep.equal({ code: '4150123456782', expiry: '2015-01-01', batch: 'ABC1234567' });
        expect(c.info(']d2' + '01041501234567821726063010AB').expiry).to.equal('2026-06-30');
    });

    it('reads the PPN data matrix, with and without control characters', () => {
        const ppn = '[)>\u001e06\u001d9N110375286414\u001d1T12345ABCDE\u001dD160617\u001dS12345ABCDEF98765\u001e\u0004';
        expect(c.info(ppn)).to.deep.equal({ code: c.ntinOfPzn('03752864'), expiry: '2016-06-17', batch: '12345ABCDE' });
        const lost = '[)>069N1103752864141T12345ABCDED160617S12345ABCDEF98765';
        expect(c.info(lost).code).to.equal(c.ntinOfPzn('03752864'));
        expect(c.info(lost).expiry).to.equal('2016-06-17');
    });

    it('takes the best-before date of other GS1 codes but leaves their number alone', () => {
        const r = c.info('0104006381333931' + '17261231');
        expect(r.code).to.equal('');
        expect(r.expiry).to.equal('2026-12-31');
    });

    it('treats eight digits as PZN only when they are no EAN-8', () => {
        expect(c.info('-12345678').code).to.equal('4150123456782');
        expect(c.info('12345678').code).to.equal('4150123456782');
        expect(c.eanOk('96385074')).to.equal(true);
        expect(c.info('96385074').code).to.equal('');
        expect(c.info('4006381333931').code).to.equal('');
    });

    it('takes eight digits that are valid as EAN-8 and as PZN for a PZN when they are marked', () => {
        expect(c.eanOk('04114918') && c.pznOk('04114918')).to.equal(true);
        expect(c.info('04114918').code).to.equal('');
        const ntin = c.ntinOfPzn('04114918');
        expect(c.info('-04114918').code).to.equal(ntin);
        expect(c.info('PZN-04114918').code).to.equal(ntin);
        expect(c.info('PZN04114918').code).to.equal(ntin);
    });

    it('gives a month-only date the last day of the month and refuses nonsense', () => {
        expect(c.expiryOf('280200')).to.equal('2028-02-29');
        expect(c.expiryOf('261300')).to.equal('');
        expect(c.expiryOf('260231')).to.equal('');
    });
});
