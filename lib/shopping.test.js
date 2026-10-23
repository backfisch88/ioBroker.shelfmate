'use strict';

const { expect } = require('chai');
const { Shopping } = require('./shopping');

function fakeAdapter(config, content) {
    const writes = [];
    return {
        writes,
        config,
        log: { warn() {}, info() {}, error() {}, debug() {} },
        getForeignStateAsync: async () => (content === undefined ? null : { val: content, ts: 1 }),
        setForeignStateAsync: async (id, state) => writes.push([id, state.val, state.ack]),
        setTimeout: (fn, ms) => setTimeout(fn, ms),
        clearTimeout: h => clearTimeout(h),
    };
}

describe('Shopping script mode', () => {
    it('adds an item and skips one that is already on the list', async () => {
        const a = fakeAdapter(
            { shoppingMode: 'script', shoppingAddItemId: 'x.add', shoppingContentId: 'x.content' },
            '[{"name":"Mehl"}]',
        );
        const s = new Shopping(a);
        expect((await s.add('Zucker')).added).to.equal(true);
        expect((await s.add('mehl')).added).to.equal(false);
        expect(a.writes).to.deep.equal([['x.add', 'Zucker', false]]);
    });

    it('removes through the configured remove state', async () => {
        const a = fakeAdapter(
            {
                shoppingMode: 'script',
                shoppingAddItemId: 'x.add',
                shoppingContentId: 'x.content',
                shoppingRemoveItemId: 'x.remove',
            },
            '[{"name":"Mehl"}]',
        );
        const s = new Shopping(a);
        expect((await s.removeNow(['mehl'])).removed).to.equal(true);
        expect((await s.removeNow(['Reis'])).removed).to.equal(false);
        expect(a.writes).to.deep.equal([['x.remove', 'Mehl', false]]);
    });

    it('removes by the given name when no list state is configured', async () => {
        const a = fakeAdapter({ shoppingMode: 'script', shoppingAddItemId: 'x.add', shoppingRemoveItemId: 'x.remove' });
        const s = new Shopping(a);
        expect((await s.removeNow(['Reis (1kg)'])).removed).to.equal(true);
        expect(a.writes).to.deep.equal([['x.remove', 'Reis 1kg', false]]);
    });

    it('does nothing without a remove state', async () => {
        const a = fakeAdapter({ shoppingMode: 'script', shoppingAddItemId: 'x.add' });
        expect((await new Shopping(a).removeNow(['Reis'])).removed).to.equal(false);
    });

    it('sends name and specification on in Bring special mode, only the name otherwise', async () => {
        const a = fakeAdapter({ shoppingMode: 'bringSpecial', bringListId: 'bring.0.list' }, '[]');
        const s = new Shopping(a);
        const seen = [];
        s.special = { enqueue: x => seen.push(x), stop() {} };
        await s.add('Cherrytomaten, bunt, 500g');
        await s.add('Salz, 0.5 tl');
        expect(seen).to.deep.equal(['Cherrytomaten, bunt, 500g', 'Salz, 0.5 tl']);
        const b = fakeAdapter({ shoppingMode: 'script', shoppingAddItemId: 'x.add' }, '[]');
        await new Shopping(b).add('Cherrytomaten, bunt, 500g');
        expect(b.writes).to.deep.equal([['x.add', 'Cherrytomaten', false]]);
    });

    it('publishes the last item as JSON with quantity and unit', async () => {
        const a = fakeAdapter({ shoppingMode: 'script', shoppingAddItemId: 'x.add', shoppingQuantity: true });
        const sets = [];
        a.setStateAsync = async (id, st) => sets.push([id, JSON.parse(st.val)]);
        const s = new Shopping(a);
        await s.add('Milch, 2');
        await s.add('Mehl, 500 g');
        await s.add('Salz');
        expect(sets).to.deep.equal([
            ['shopping.lastItem', { name: 'Milch', quantity: 2, unit: '', text: '2' }],
            ['shopping.lastItem', { name: 'Mehl', quantity: 500, unit: 'g', text: '500 g' }],
            ['shopping.lastItem', { name: 'Salz', quantity: null, unit: '', text: '' }],
        ]);
    });
});
