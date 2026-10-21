'use strict';

const { expect } = require('chai');
const { parseSmartDate: p } = require('../www/smartDate');

describe('smartDate', () => {
    const now = new Date(2026, 9, 21); // 21 Oct 2026
    it('understands relative input', () => {
        expect(p('+3d', now)).to.equal('2026-10-24');
        expect(p('+3', now)).to.equal('2026-10-24');
        expect(p('+2w', now)).to.equal('2026-11-04');
        expect(p('+1m', now)).to.equal('2026-11-21');
        expect(p('+1y', now)).to.equal('2027-10-21');
        expect(p('-1d', now)).to.equal('2026-10-20');
        expect(p('morgen', now)).to.equal('2026-10-22');
        expect(p('heute', now)).to.equal('2026-10-21');
    });
    it('clamps months at the end of a month', () => {
        expect(p('+1m', new Date(2026, 0, 31))).to.equal('2026-02-28');
    });
    it('understands dates', () => {
        expect(p('24.12.2026', now)).to.equal('2026-12-24');
        expect(p('24.12.26', now)).to.equal('2026-12-24');
        expect(p('241226', now)).to.equal('2026-12-24');
        expect(p('24122026', now)).to.equal('2026-12-24');
        expect(p('2026-12-24', now)).to.equal('2026-12-24');
    });
    it('uses the last day for month and year', () => {
        expect(p('12/26', now)).to.equal('2026-12-31');
        expect(p('12.2026', now)).to.equal('2026-12-31');
        expect(p('2/27', now)).to.equal('2027-02-28');
    });
    it('uses the next occurrence for day and month', () => {
        expect(p('2412', now)).to.equal('2026-12-24');
        expect(p('24.12.', now)).to.equal('2026-12-24');
        expect(p('0110', now)).to.equal('2027-10-01');
        expect(p('21.10', now)).to.equal('2026-10-21');
    });
    it('accepts x and empty as no date and rejects nonsense', () => {
        expect(p('x', now)).to.equal('');
        expect(p('', now)).to.equal('');
        expect(p('3102', now)).to.equal(null);
        expect(p('abc', now)).to.equal(null);
        expect(p('31.02.2026', now)).to.equal(null);
    });
});
