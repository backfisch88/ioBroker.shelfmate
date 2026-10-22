'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');

const MAX_BODY = 64 * 1024;
const MAX_IMPORT_BODY = 8 * 1024 * 1024;
const HEARTBEAT_MS = 15000;

const STATIC_FILES = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/index.html': ['index.html', 'text/html; charset=utf-8'],
    '/sw.js': ['sw.js', 'text/javascript; charset=utf-8'],
    '/shelfmateClient.js': ['shelfmateClient.js', 'text/javascript; charset=utf-8'],
    '/i18n.js': ['i18n.js', 'text/javascript; charset=utf-8'],
    '/code128.js': ['code128.js', 'text/javascript; charset=utf-8'],
    '/shelfLife.js': ['shelfLife.js', 'text/javascript; charset=utf-8'],
    '/smartDate.js': ['smartDate.js', 'text/javascript; charset=utf-8'],
    '/productSuggestions.js': ['productSuggestions.js', 'text/javascript; charset=utf-8'],
    '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json'],
    '/icon-192.png': ['icon-192.png', 'image/png'],
    '/icon-512.png': ['icon-512.png', 'image/png'],
    '/apple-touch-icon.png': ['apple-touch-icon.png', 'image/png'],
    '/logo.png': ['logo.png', 'image/png'],
};

/**
 * HTTP request handler for the ShelfMate web app, the REST API and the event stream.
 */
class ShelfMateServer {
    /**
     * @param {object} options options
     * @param {string} options.wwwDir directory of the web app files
     * @param {string} [options.accessKey] optional access key for /api
     * @param {() => object} options.snapshot returns the current data snapshot
     * @param {(cmd: object) => Promise<object>} options.command executes a command
     * @param {(name: string) => Promise<object>} options.addToList adds an item to the shopping list
     * @param {(names: string[]) => Promise<object>} options.removeFromList removes an item from the shopping list
     * @param {() => Promise<Buffer | null>} options.certificate returns the certificate to install on devices
     * @param {{debug: (msg: string) => void, warn: (msg: string) => void}} options.log logger
     */
    constructor(options) {
        this.o = options;
        this.clients = new Set();
        this.gzipCache = new Map();
        this.heartbeat = null;
        this.handler = this.handler.bind(this);
    }

    /**
     * Start the heartbeat that keeps event streams alive.
     *
     * @param {(fn: () => void, ms: number) => unknown} setIntervalFn adapter timer function
     */
    start(setIntervalFn) {
        this.heartbeat = setIntervalFn(() => {
            for (const res of this.clients) {
                res.write('event: ping\ndata: 1\n\n');
            }
        }, HEARTBEAT_MS);
    }

    /**
     * Close all event streams.
     *
     * @param {(handle: unknown) => void} clearIntervalFn adapter timer function
     */
    stop(clearIntervalFn) {
        if (this.heartbeat) {
            clearIntervalFn(this.heartbeat);
            this.heartbeat = null;
        }
        for (const res of this.clients) {
            res.end();
        }
        this.clients.clear();
    }

    /**
     * Send an event to every connected web app.
     *
     * @param {string} event event name
     * @param {unknown} data JSON serialisable payload
     */
    broadcast(event, data) {
        const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const res of this.clients) {
            res.write(msg);
        }
    }

    /**
     * @param {string} given key sent by the client
     */
    keyOk(given) {
        const key = this.o.accessKey;
        if (!key) {
            return true;
        }
        const a = crypto
            .createHash('sha256')
            .update(String(given || ''))
            .digest();
        const b = crypto.createHash('sha256').update(key).digest();
        return crypto.timingSafeEqual(a, b);
    }

    /**
     * @param {import('node:http').ServerResponse} res response
     * @param {number} status status code
     * @param {unknown} body JSON body
     */
    json(res, status, body) {
        const text = JSON.stringify(body);
        res.writeHead(status, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Content-Length': Buffer.byteLength(text),
        });
        res.end(text);
    }

    /**
     * @param {import('node:http').IncomingMessage} req request
     * @param {number} [max] maximum body size in bytes
     */
    readBody(req, max = MAX_BODY) {
        return new Promise((resolve, reject) => {
            let size = 0;
            const chunks = [];
            req.on('data', c => {
                size += c.length;
                if (size > max) {
                    reject(new Error('Request too large'));
                    req.destroy();
                    return;
                }
                chunks.push(c);
            });
            req.on('end', () => {
                try {
                    const text = Buffer.concat(chunks).toString('utf8');
                    resolve(text ? JSON.parse(text) : {});
                } catch {
                    reject(new Error('Invalid JSON'));
                }
            });
            req.on('error', reject);
        });
    }

    /**
     * @param {import('node:http').IncomingMessage} req request
     * @param {import('node:http').ServerResponse} res response
     */
    handler(req, res) {
        this.route(req, res).catch(e => {
            this.o.log.warn(`Request failed: ${e.message}`);
            if (!res.headersSent) {
                this.json(res, 500, { ok: false, error: 'Internal error' });
            } else {
                res.end();
            }
        });
    }

    /**
     * @param {import('node:http').IncomingMessage} req request
     * @param {import('node:http').ServerResponse} res response
     */
    async route(req, res) {
        const url = new URL(req.url || '/', 'http://localhost');
        const pathname = url.pathname;
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'no-referrer');

        if (pathname.startsWith('/api/')) {
            const given = req.headers['x-shelfmate-key'] || url.searchParams.get('key');
            if (!this.keyOk(Array.isArray(given) ? given[0] : given)) {
                this.json(res, 401, { ok: false, error: 'Access key required' });
                return;
            }
            await this.api(req, res, pathname);
            return;
        }

        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { Allow: 'GET, HEAD' });
            res.end();
            return;
        }

        if (pathname === '/iobrokerZertifikat.cer') {
            const cert = await this.o.certificate();
            if (!cert) {
                res.writeHead(404);
                res.end();
                return;
            }
            res.writeHead(200, {
                'Content-Type': 'application/x-x509-ca-cert',
                'Content-Disposition': 'attachment; filename="iobrokerZertifikat.cer"',
                'Cache-Control': 'no-store',
            });
            res.end(req.method === 'HEAD' ? undefined : cert);
            return;
        }

        const file = Object.prototype.hasOwnProperty.call(STATIC_FILES, pathname) ? STATIC_FILES[pathname] : null;
        if (!file) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }
        let content;
        try {
            content = await fs.promises.readFile(path.join(this.o.wwwDir, file[0]));
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }
        const headers = { 'Content-Type': file[1], 'Cache-Control': 'no-cache' };
        if (/^text\/(javascript|html|css)/.test(file[1]) && content.length > 2000) {
            headers.Vary = 'Accept-Encoding';
            if (/\bgzip\b/.test(String(req.headers['accept-encoding'] || ''))) {
                const cached = this.gzipCache.get(file[0]);
                const zipped = cached && cached.source.equals(content) ? cached.zipped : zlib.gzipSync(content);
                if (!cached || cached.zipped !== zipped) {
                    this.gzipCache.set(file[0], { source: content, zipped });
                }
                content = zipped;
                headers['Content-Encoding'] = 'gzip';
            }
        }
        headers['Content-Length'] = content.length;
        res.writeHead(200, headers);
        res.end(req.method === 'HEAD' ? undefined : content);
    }

    /**
     * @param {import('node:http').IncomingMessage} req request
     * @param {import('node:http').ServerResponse} res response
     * @param {string} pathname request path
     */
    async api(req, res, pathname) {
        if (req.method === 'GET' && pathname === '/api/snapshot') {
            this.json(res, 200, await this.o.snapshot());
            return;
        }
        if (req.method === 'GET' && pathname === '/api/events') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-store',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no',
            });
            res.write('retry: 2000\n: connected\n\n');
            this.clients.add(res);
            req.on('close', () => this.clients.delete(res));
            return;
        }
        if (req.method === 'POST' && pathname === '/api/command') {
            const body = await this.readBody(req, MAX_IMPORT_BODY).catch(e => ({ __error: e.message }));
            if (body.__error) {
                this.json(res, 400, { ok: false, error: body.__error });
                return;
            }
            this.json(res, 200, await this.o.command(body));
            return;
        }
        if (req.method === 'POST' && pathname === '/api/shopping/add') {
            const body = await this.readBody(req).catch(e => ({ __error: e.message }));
            if (body.__error) {
                this.json(res, 400, { ok: false, error: body.__error });
                return;
            }
            this.json(res, 200, await this.o.addToList(String(body.name || '')));
            return;
        }
        if (req.method === 'POST' && pathname === '/api/shopping/remove') {
            const body = await this.readBody(req).catch(e => ({ __error: e.message }));
            if (body.__error) {
                this.json(res, 400, { ok: false, error: body.__error });
                return;
            }
            const names = Array.isArray(body.names) ? body.names.map(String).slice(0, 5) : [];
            this.json(res, 200, await this.o.removeFromList(names));
            return;
        }
        this.json(res, 404, { ok: false, error: 'Unknown endpoint' });
    }
}

module.exports = { ShelfMateServer };
