'use strict';

const http = require('node:http');
const { expect } = require('chai');
const { ShelfMateServer } = require('./server');

function request(port, method, path, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({ port, method, path, headers }, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () =>
                resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }),
            );
        });
        req.on('error', reject);
        req.end(body);
    });
}

describe('ShelfMateServer', () => {
    let server;
    let web;
    let port;
    const log = { debug() {}, warn() {} };

    before(done => {
        web = new ShelfMateServer({
            wwwDir: require('node:path').join(__dirname, '..', 'www'),
            accessKey: 'secret',
            snapshot: async () => ({ products: {}, ready: true }),
            command: async cmd => ({ ok: true, echo: cmd.action }),
            addToList: async name => ({ ok: true, name }),
            removeFromList: async names => ({ ok: true, removed: names.length === 1 }),
            certificate: async () => null,
            log,
        });
        server = http.createServer(web.handler).listen(0, '127.0.0.1', () => {
            port = server.address().port;
            done();
        });
    });

    after(() => {
        web.stop(clearInterval);
        server.closeAllConnections();
        server.close();
    });

    it('serves the app without a key', async () => {
        const r = await request(port, 'GET', '/');
        expect(r.status).to.equal(200);
        expect(r.body).to.contain('ShelfMate');
    });

    it('compresses large text files for clients that accept gzip', async () => {
        const plain = await request(port, 'GET', '/productSuggestions.js');
        const zipped = await request(port, 'GET', '/productSuggestions.js', undefined, { 'Accept-Encoding': 'gzip' });
        expect(plain.headers['content-encoding']).to.equal(undefined);
        expect(zipped.headers['content-encoding']).to.equal('gzip');
        expect(Number(zipped.headers['content-length'])).to.be.lessThan(Number(plain.headers['content-length']) / 2);
    });

    it('serves the bundled fallback font files', async () => {
        for (const f of ['interLatin', 'interLatinExt', 'interCyrillic']) {
            const r = await request(port, 'GET', `/fonts/${f}.woff2`);
            expect(r.status).to.equal(200);
            expect(r.headers['content-type']).to.equal('font/woff2');
        }
    });

    it('does not serve files outside the allow list', async () => {
        expect((await request(port, 'GET', '/../package.json')).status).to.equal(404);
        expect((await request(port, 'GET', '/main.js')).status).to.equal(404);
    });

    it('protects the API with the access key', async () => {
        expect((await request(port, 'GET', '/api/snapshot')).status).to.equal(401);
        expect(
            (await request(port, 'GET', '/api/snapshot', undefined, { 'x-shelfmate-key': 'wrong' })).status,
        ).to.equal(401);
        const ok = await request(port, 'GET', '/api/snapshot', undefined, { 'x-shelfmate-key': 'secret' });
        expect(ok.status).to.equal(200);
        expect(JSON.parse(ok.body).ready).to.equal(true);
    });

    it('runs commands and rejects invalid JSON', async () => {
        const h = { 'x-shelfmate-key': 'secret', 'content-type': 'application/json' };
        const ok = await request(port, 'POST', '/api/command', JSON.stringify({ action: 'x' }), h);
        expect(JSON.parse(ok.body).echo).to.equal('x');
        expect((await request(port, 'POST', '/api/command', '{bad', h)).status).to.equal(400);
    });

    it('removes shopping list items', async () => {
        const h = { 'x-shelfmate-key': 'secret', 'content-type': 'application/json' };
        const r = await request(port, 'POST', '/api/shopping/remove', JSON.stringify({ names: ['Mehl'] }), h);
        expect(JSON.parse(r.body).removed).to.equal(true);
    });

    it('pushes events to connected clients', done => {
        const req = http.get({ port, path: '/api/events?key=secret' }, res => {
            res.setEncoding('utf8');
            let seen = '';
            res.on('data', d => {
                seen += d;
                if (seen.includes('event: data')) {
                    expect(seen).to.contain('"a":1');
                    req.destroy();
                    done();
                } else if (seen.includes(': connected')) {
                    web.broadcast('data', { a: 1 });
                }
            });
        });
    });
});
