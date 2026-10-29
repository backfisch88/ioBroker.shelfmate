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

    it('always waits for a list update after a write, whatever the list shows', async () => {
        const order = [];
        let clock = 1000;
        let ts = 1;
        const b = new BringSpecial({
            now: () => clock,
            gapMs: 0,
            refreshTimeoutMs: 100000,
            // the list never contains the entries, Bring only sets the state again on every poll
            read: async () => ({ items: [], ts }),
            save: async text => {
                order.push(`write ${text}`);
            },
            log: () => {},
            sleep: async ms => {
                if (ms === 1000) {
                    order.push('wait');
                    clock += 1000;
                    ts = clock + 60000;
                }
            },
        });
        b.enqueue('Margarine');
        await b.idle();
        b.enqueue('Butter');
        await b.idle();
        expect(order.indexOf('wait')).to.be.greaterThan(order.indexOf('write Margarine'));
        expect(order.indexOf('write Butter')).to.be.greaterThan(order.indexOf('wait'));
    });

    it('gives up after the timeout when the list is never updated', async () => {
        const logs = [];
        let clock = 1000;
        const b = new BringSpecial({
            now: () => clock,
            gapMs: 0,
            refreshTimeoutMs: 5000,
            read: async () => ({ items: [], ts: 1 }),
            save: async () => {},
            log: (l, m) => logs.push(`${l}: ${m}`),
            sleep: async () => {
                clock += 1000;
            },
        });
        b.enqueue('Margarine');
        await b.idle();
        b.enqueue('Butter');
        await b.idle();
        expect(logs.some(x => x.startsWith('warn') && x.includes('no list update'))).to.equal(true);
    });

    it('writes everything that is queued in a row after one wait, later items wait for a new list', async () => {
        const order = [];
        let clock = 1000;
        let ts = 1;
        const b = new BringSpecial({
            now: () => clock,
            gapMs: 0,
            refreshTimeoutMs: 100000,
            read: async () => ({ items: [], ts }),
            save: async text => {
                ts = 1; // the list is old again until the next poll
                order.push(`write ${text}`);
            },
            log: () => {},
            sleep: async ms => {
                if (ms === 1000) {
                    order.push('wait');
                    clock += 1000;
                    ts = clock + 60000;
                }
            },
        });
        b.enqueue('Margarine');
        b.enqueue('Butter');
        b.enqueue('Milch');
        await b.idle();
        // arrives later, not in the queue of the first batch
        b.enqueue('Eier');
        await b.idle();
        expect(order).to.deep.equal(['write Margarine', 'write Butter', 'write Milch', 'wait', 'write Eier']);
    });
});
