'use strict';

const { expect } = require('chai');
const { lowText, expiryText, msUntil, deliver, TEXT } = require('./notify');

describe('notify', () => {
    it('has the same keys in every language', () => {
        const keys = Object.keys(TEXT.en).sort();
        for (const [lang, t] of Object.entries(TEXT)) {
            expect(Object.keys(t).sort(), lang).to.deep.equal(keys);
        }
    });

    it('builds the texts', () => {
        expect(lowText('de', 'Mehl')).to.equal('Mindestbestand erreicht: Mehl');
        expect(lowText('xx', 'Flour')).to.equal('Minimum stock reached: Flour');
        const out = expiryText('en', [
            { name: 'Milk', date: '2026-10-20', expired: true, place: 'Pantry · Shelf 1' },
            { name: 'Rice', date: '2026-10-25', expired: false },
        ]);
        expect(out).to.equal('Expired:\n• Milk (2026-10-20) – Pantry · Shelf 1\n\nExpiring soon:\n• Rice (2026-10-25)');
        expect(expiryText('en', [])).to.equal('');
    });

    it('computes the time until the next run', () => {
        const now = new Date(2026, 9, 21, 7, 0, 0);
        expect(msUntil('08:00', now)).to.equal(3600000);
        expect(msUntil('06:00', now)).to.equal(23 * 3600000);
        expect(msUntil('bad', now)).to.equal(3600000);
    });

    it('sends to the matching adapter format', () => {
        const calls = [];
        const adapter = { sendTo: (...a) => calls.push(a) };
        deliver(adapter, { instance: 'telegram.0', target: '123' }, 'hi');
        deliver(adapter, { instance: 'pushover.0' }, 'hi');
        deliver(adapter, { instance: 'telegrammenu2.0', area: 'Home' }, 'hi', 'warn');
        deliver(adapter, { instance: 'email.0', target: 'a@b.c' }, 'hi');
        expect(calls[0]).to.deep.equal(['telegram.0', { text: 'hi', chatId: '123' }]);
        expect(calls[1]).to.deep.equal(['pushover.0', 'hi']);
        expect(calls[2]).to.deep.equal(['telegrammenu2.0', 'notify', { area: 'Home', type: 'warn', text: 'hi' }]);
        expect(calls[3]).to.deep.equal(['email.0', { text: 'hi', subject: 'ShelfMate', to: 'a@b.c' }]);
    });
});

describe('expiry wording', () => {
    const { expiryLine } = require('./notify');
    const x = { name: 'Joghurt', brand: 'Landliebe', date: '2026-10-25', days: 2, amount: 1, place: 'Küche · Kühlschrank' };
    it('keeps the default line', () => {
        expect(expiryLine('de', '', x)).to.equal('• Joghurt (2026-10-25) – Küche · Kühlschrank');
        expect(expiryLine('de', '', { ...x, place: '' })).to.equal('• Joghurt (2026-10-25)');
    });
    it('fills own placeholders including the brand and the day count in words', () => {
        expect(expiryLine('de', '• {brand} {name}: {when}, {place}', x)).to.equal('• Landliebe Joghurt: in 2 Tagen, Küche · Kühlschrank');
        expect(expiryLine('en', '{name} {when}', { ...x, days: 0 })).to.equal('Joghurt today');
        expect(expiryLine('de', '{name} {when}', { ...x, days: -3 })).to.equal('Joghurt vor 3 Tagen');
    });
    it('drops empty parts without leaving separators behind', () => {
        expect(expiryLine('de', '{brand} {name} ({place})', { ...x, brand: '', place: '' })).to.equal('Joghurt');
    });
    it('uses own headings', () => {
        const out = expiryText('de', [{ ...x, expired: false }], { soonTitle: 'Bald aufbrauchen:', line: '- {name}' });
        expect(out).to.equal('Bald aufbrauchen:\n- Joghurt');
    });
});

describe('notify days', () => {
    const { parseNotifyDays } = require('./notify');
    it('reads a comma separated list', () => {
        expect(parseNotifyDays('7, 4,3;2 1,0')).to.deep.equal([7, 4, 3, 2, 1, 0]);
        expect(parseNotifyDays('-1,x,999,3,3')).to.deep.equal([3, -1]);
        expect(parseNotifyDays('')).to.deep.equal([]);
        expect(parseNotifyDays(undefined)).to.deep.equal([]);
    });
});
