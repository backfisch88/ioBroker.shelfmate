'use strict';

const { expect } = require('chai');
const { BringSpecial, merge } = require('./bringSpecial');

const parts = text => text.split(',').map(s => s.trim()).filter(Boolean);

describe('Bring special merge', () => {
    it('keeps a new item as typed', () => {
        expect(merge(undefined, [])).to.equal('');
        expect(merge(undefined, parts('Kräuter'))).to.equal('Kräuter');
    });

    it('counts up an item that is already on the list', () => {
        expect(merge({ name: 'Nudeln', specification: '' }, [])).to.equal('2');
        expect(merge({ name: 'Nudeln', specification: '2' }, [])).to.equal('3');
    });

    it('adds a variant to an existing item', () => {
        expect(merge({ name: 'feta', specification: '' }, parts('Kräuter'))).to.equal('1, Kräuter');
    });

    it('adds counts', () => {
        expect(merge({ name: 'Feta', specification: '1' }, parts('2'))).to.equal('3');
    });

    it('lists quantities instead of adding them', () => {
        expect(merge({ name: 'Feta', specification: '200g' }, parts('200g'))).to.equal('200g, 200g');
    });
});

describe('BringSpecial queue', () => {
    it('waits for the list to refresh between writes of the same item', async () => {
        const written = [];
        let items = [];
        let ts = 1;
        let clock = 1000;
        const b = new BringSpecial({
            now: () => clock,
            gapMs: 0,
            read: async () => ({ items, ts }),
            save: async text => {
                written.push(text);
                // the adapter reloads the list shortly after the write
                const spec = text.includes(',') ? text.slice(text.indexOf(',') + 1) : '';
                const name = text.split(',')[0];
                setTimeout(() => {
                    items = [{ name, specification: spec }];
                    clock += 5000;
                    ts = clock;
                }, 30);
            },
            log: () => {},
            sleep: ms => new Promise(r => setTimeout(r, Math.min(ms, 20))),
        });
        b.enqueue('Mehl');
        await b.idle();
        b.enqueue('Mehl');
        await b.idle();
        b.enqueue('Mehl');
        await b.idle();
        expect(written).to.deep.equal(['Mehl', 'Mehl,2', 'Mehl,3']);
    });
});
