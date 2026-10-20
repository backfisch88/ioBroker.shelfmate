'use strict';

const os = require('node:os');
const forge = require('node-forge');

const DAYS = 825;

/**
 * Names under which the certificate is stored in the ioBroker certificate collection.
 */
const NAMES = { pub: 'shelfmatePublic', priv: 'shelfmatePrivate' };

/**
 * Creates a self-signed certificate for this host (host name, localhost and all local IPv4 addresses).
 *
 * @param {{hostname?: string, addresses?: string[], now?: Date}} [opt] options (for tests)
 * @returns {{cert: string, key: string, notAfter: Date, names: string[]}} PEM certificate and key
 */
function createCertificate(opt = {}) {
    const pki = forge.pki;
    const hostname = opt.hostname || os.hostname();
    const addresses =
        opt.addresses ||
        Object.values(os.networkInterfaces())
            .flat()
            .filter(i => i && i.family === 'IPv4' && !i.internal)
            .map(i => i.address);
    const keys = pki.rsa.generateKeyPair({ bits: 2048, e: 65537 });
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = `0${forge.util.bytesToHex(forge.random.getBytesSync(9))}`;
    const from = opt.now || new Date();
    cert.validity.notBefore = new Date(from.getTime() - 60 * 60 * 1000);
    cert.validity.notAfter = new Date(from.getTime() + DAYS * 24 * 60 * 60 * 1000);
    const attrs = [
        { name: 'commonName', value: hostname },
        { name: 'organizationName', value: 'ShelfMate' },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    const altNames = [
        { type: 2, value: hostname },
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        ...addresses.map(ip => ({ type: 7, ip })),
    ];
    cert.setExtensions([
        { name: 'basicConstraints', critical: true, cA: true },
        { name: 'keyUsage', critical: true, digitalSignature: true, keyEncipherment: true, keyCertSign: true },
        { name: 'extKeyUsage', serverAuth: true },
        { name: 'subjectAltName', altNames },
        { name: 'subjectKeyIdentifier' },
    ]);
    cert.sign(keys.privateKey, forge.md.sha256.create());
    return {
        cert: pki.certificateToPem(cert),
        key: pki.privateKeyToPem(keys.privateKey),
        notAfter: cert.validity.notAfter,
        names: [hostname, 'localhost', '127.0.0.1', ...addresses],
    };
}

module.exports = { createCertificate, NAMES };
