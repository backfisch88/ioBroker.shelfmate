'use strict';

const assert = require('node:assert');
const crypto = require('node:crypto');
const { createCertificate } = require('./cert');

describe('cert', () => {
    it('creates a valid certificate with the given names', () => {
        const r = createCertificate({ hostname: 'pi', addresses: ['192.168.1.5'] });
        const x = new crypto.X509Certificate(r.cert);
        assert.ok(x.subjectAltName.includes('DNS:pi'));
        assert.ok(x.subjectAltName.includes('IP Address:192.168.1.5'));
        assert.ok(x.checkPrivateKey(crypto.createPrivateKey(r.key)));
        assert.ok(new Date(x.validTo) > new Date());
    }).timeout(20000);
});
