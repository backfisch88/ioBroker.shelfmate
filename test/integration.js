const path = require('path');
const https = require('node:https');
const { tests } = require('@iobroker/testing');

function post(port, urlPath, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(
            { host: '127.0.0.1', port, path: urlPath, method: 'POST', rejectUnauthorized: false },
            res => {
                let out = '';
                res.on('data', d => (out += d));
                res.on('end', () => resolve(JSON.parse(out)));
            },
        );
        req.on('error', reject);
        req.end(JSON.stringify(body));
    });
}

function get(port, urlPath) {
    return new Promise((resolve, reject) => {
        https
            .get({ host: '127.0.0.1', port, path: urlPath, rejectUnauthorized: false }, res => {
                let body = '';
                res.on('data', d => (body += d));
                res.on('end', () => resolve({ status: res.statusCode, body }));
            })
            .on('error', reject);
    });
}

// Run integration tests - See https://github.com/ioBroker/testing for a detailed explanation and further options
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('ShelfMate Bring! special mode', getHarness => {
            it('lists Bring! lists and writes a reorder item to saveItem', async function () {
                this.timeout(90000);
                const harness = getHarness();
                const list = 'bring.0.testliste';
                await harness.objects.setObjectAsync(list, { type: 'channel', common: { name: 'Testliste' }, native: {} });
                for (const s of ['content', 'saveItem', 'removeItem']) {
                    await harness.objects.setObjectAsync(`${list}.${s}`, {
                        type: 'state',
                        common: { name: s, type: 'string', role: 'json', read: true, write: true },
                        native: {},
                    });
                }
                await harness.states.setStateAsync(`${list}.content`, { val: '[]', ack: true });
                await harness.changeAdapterConfig('shelfmate', {
                    native: { port: 18121, shoppingMode: 'bringSpecial', bringListId: list, removeOnRestock: true },
                });
                await harness.startAdapterAndWait();
                let page;
                for (let i = 0; i < 30; i++) {
                    try {
                        page = await get(18121, '/api/snapshot');
                        break;
                    } catch {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
                if (!page) {
                    throw new Error('Web server did not start');
                }
                const lists = await new Promise(resolve => harness.sendTo('shelfmate.0', 'getBringLists', {}, resolve));
                if (!Array.isArray(lists) || !lists.some(l => l.value === list)) {
                    throw new Error(`Bring! list not offered: ${JSON.stringify(lists)}`);
                }
                const loc = await post(18121, '/api/command', {
                    id: 'b1',
                    action: 'saveLocation',
                    location: { group: 'Wohnung', name: 'Regal', qr: 'Wohnung\nRegal' },
                });
                const prod = await post(18121, '/api/command', {
                    id: 'b2',
                    action: 'saveProduct',
                    product: { name: 'Bringmehl', type: 'count', minStock: 1 },
                });
                await post(18121, '/api/command', {
                    id: 'b3',
                    action: 'changeStock',
                    productId: prod.productId,
                    locationId: loc.locationId,
                    delta: 2,
                });
                await post(18121, '/api/command', {
                    id: 'b4',
                    action: 'changeStock',
                    productId: prod.productId,
                    locationId: loc.locationId,
                    delta: -1,
                });
                let saved = null;
                for (let i = 0; i < 20 && !saved; i++) {
                    await new Promise(resolve => setTimeout(resolve, 250));
                    saved = await harness.states.getStateAsync(`${list}.saveItem`);
                }
                if (!saved || saved.val !== 'Bringmehl') {
                    throw new Error(`Unexpected saveItem: ${JSON.stringify(saved)}`);
                }
                await harness.states.setStateAsync(`${list}.content`, {
                    val: JSON.stringify([{ name: 'Bringmehl', specification: '' }]),
                    ack: true,
                });
                await post(18121, '/api/command', {
                    id: 'b5',
                    action: 'changeStock',
                    productId: prod.productId,
                    locationId: loc.locationId,
                    delta: 1,
                });
                let removed = null;
                for (let i = 0; i < 20 && !removed; i++) {
                    await new Promise(resolve => setTimeout(resolve, 250));
                    removed = await harness.states.getStateAsync(`${list}.removeItem`);
                }
                if (!removed || removed.val !== 'Bringmehl') {
                    throw new Error(`Item was not removed: ${JSON.stringify(removed)}`);
                }
                const manual = await post(18121, '/api/shopping/remove', { names: ['bringmehl'] });
                if (!manual.ok || !manual.removed) {
                    throw new Error(`Manual removal failed: ${JSON.stringify(manual)}`);
                }
            });
        });

        suite('ShelfMate web server', getHarness => {
            it('serves the app and an empty snapshot over HTTPS with the ioBroker certificate', async function () {
                this.timeout(60000);
                const harness = getHarness();
                await harness.changeAdapterConfig('shelfmate', { native: { port: 18120 } });
                await harness.startAdapterAndWait();
                let page;
                for (let i = 0; i < 30; i++) {
                    try {
                        page = await get(18120, '/');
                        break;
                    } catch {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
                if (!page) {
                    throw new Error('Web server did not start');
                }
                if (page.status !== 200 || !page.body.includes('ShelfMate')) {
                    throw new Error(`App not served: ${page.status}`);
                }
                const cert = await get(18120, '/iobrokerZertifikat.cer');
                if (cert.status !== 200) {
                    throw new Error(`Certificate download failed: ${cert.status}`);
                }
                const snap = JSON.parse((await get(18120, '/api/snapshot')).body);
                if (!snap.ready) {
                    throw new Error('Unexpected snapshot');
                }
                const saved = await post(18120, '/api/command', {
                    id: 't1',
                    action: 'saveProduct',
                    product: { name: `Testmehl${Date.now()}`, type: 'count' },
                });
                if (!saved.ok) {
                    throw new Error(`Command failed: ${saved.error}`);
                }
                const imp = await post(18120, '/api/command', {
                    id: 't2',
                    action: 'importData',
                    data: { products: { a1: { name: 'Importreis' } }, locations: {}, inventory: {}, history: [], areas: [] },
                });
                if (!imp.ok) {
                    throw new Error(`Import failed: ${imp.error}`);
                }
                const after = JSON.parse((await get(18120, '/api/snapshot')).body);
                if (!after.products.a1) {
                    throw new Error('Imported product missing');
                }
                const state = await harness.states.getStateAsync('shelfmate.0.info.connection');
                if (!state || state.val !== true) {
                    throw new Error('info.connection is not true');
                }
            });
        });
    },
});
