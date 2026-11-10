'use strict';

const { expect } = require('chai');
const { OwnDb, eanKey, parseRecords, buildMap, mapRecord, mergeOwnProducts, isOwnEan } = require('./ownDb');

describe('ownDb', () => {
    it('compares barcodes without leading zeros and other characters', () => {
        expect(eanKey('0012345678905')).to.equal(eanKey('12345678905'));
        expect(eanKey(' 4006381333931 ')).to.equal('4006381333931');
        expect(eanKey('')).to.equal('');
    });

    it('reads a list, an object with barcodes as keys, a wrapper and CSV', () => {
        expect(parseRecords('[{"ean":"1","name":"A"}]')).to.have.length(1);
        expect(parseRecords('{"4006381333931":{"name":"A"},"2":{"name":"B"}}').map(x => x.__key)).to.deep.equal([
            '2',
            '4006381333931',
        ]);
        expect(parseRecords('{"updated":"x","products":[{"ean":"1","name":"A"}]}')).to.have.length(1);
        const csv = parseRecords('﻿ean;name;brand\r\n123;"Mehl; fein";Demo\r\n456;"Say ""hi""";\r\n');
        expect(csv).to.deep.equal([
            { ean: '123', name: 'Mehl; fein', brand: 'Demo' },
            { ean: '456', name: 'Say "hi"', brand: '' },
        ]);
        expect(parseRecords('a,b\n1,2', 'csv')).to.deep.equal([{ a: '1', b: '2' }]);
        expect(parseRecords('')).to.deep.equal([]);
    });

    it('maps the fields freely, also nested ones, and converts numbers and tags', () => {
        const map = buildMap([
            { field: 'name', key: 'Krömpel' },
            { field: 'shelfLifeDays', key: 'data.haltbar' },
            { field: 'tags', key: 'Schlagworte' },
        ]);
        const p = mapRecord(
            {
                Krömpel: ' Haferflocken ',
                brand: 'Demo',
                data: { haltbar: '365,0' },
                Schlagworte: 'Frühstück; Bio',
                minStock: 'x',
            },
            map,
        );
        expect(p).to.deep.equal({
            name: 'Haferflocken',
            source: 'own',
            brand: 'Demo',
            tags: ['Frühstück', 'Bio'],
            shelfLifeDays: 365,
        });
        expect(mapRecord({ name: '' }, buildMap([]))).to.equal(null);
    });

    it('asks the sources in order and finds a barcode with or without leading zero', async () => {
        const db = new OwnDb({
            config: {
                ownDbState: 'x.0.db',
                ownDbFile: '/data/own.csv',
                ownDbMap: [{ field: 'ean', key: 'code' }],
            },
            readState: async () => '[{"code":"1111","name":"Aus dem Datenpunkt"}]',
            readFile: async () => ({ text: 'code;name\n2222;Aus der Datei\n1111;Doppelt', stamp: '1' }),
        });
        expect((await db.find('1111')).name).to.equal('Aus dem Datenpunkt');
        expect((await db.find('0002222')).name).to.equal('Aus der Datei');
        expect(await db.find('3333')).to.equal(null);
    });

    it('reloads a changed data point, a changed file and a web address only after the refresh time', async () => {
        let state = '[{"ean":"1","name":"Eins"}]';
        let now = 0;
        let calls = 0;
        const db = new OwnDb({
            config: { ownDbState: 's', ownDbUrl: 'http://nas/own.json', ownDbRefresh: 1 },
            readState: async () => state,
            fetchUrl: async () => {
                calls++;
                return '[{"ean":"9","name":"Neun"}]';
            },
            now: () => now,
        });
        expect((await db.find('1')).name).to.equal('Eins');
        state = '[{"ean":"1","name":"Neu"}]';
        expect((await db.find('1')).name).to.equal('Neu');
        expect((await db.find('9')).name).to.equal('Neun');
        await db.find('9');
        expect(calls).to.equal(1);
        now = 61000;
        await db.find('9');
        expect(calls).to.equal(2);
    });

    it('keeps the last good data when a source fails and tells about it only once', async () => {
        const warnings = [];
        let fail = false;
        const db = new OwnDb({
            config: { ownDbUrl: 'http://nas/own.json', ownDbRefresh: 1 },
            fetchUrl: async () => {
                if (fail) {
                    throw new Error('Timeout');
                }
                return '[{"ean":"1","name":"Eins"}]';
            },
            warn: m => warnings.push(m),
            now: () => (fail ? 1e9 : 0),
        });
        await db.find('1');
        fail = true;
        expect((await db.find('1')).name).to.equal('Eins');
        await db.find('1');
        expect(warnings).to.have.length(1);
    });

    it('is switched off without a source or when set to off', async () => {
        expect(new OwnDb({ config: { ownDbMode: 'only' } }).mode).to.equal('off');
        expect(new OwnDb({ config: { ownDbState: 's', ownDbMode: 'only' } }).mode).to.equal('only');
        expect(new OwnDb({ config: { ownDbState: 's' } }).mode).to.equal('first');
        const off = new OwnDb({
            config: { ownDbState: 's', ownDbMode: 'off' },
            readState: async () => '[{"ean":"1","name":"A"}]',
        });
        expect(await off.find('1')).to.equal(null);
    });

    it('adds products with an own barcode to the list and keeps everything else', () => {
        expect(isOwnEan('2123456789012')).to.equal(true);
        expect(isOwnEan('4006381333931')).to.equal(false);
        const products = [
            {
                ean: '2123456789012',
                name: 'Selbstgemachte Soße',
                brand: '',
                unit: 'Glas',
                tags: ['Soße'],
                minStock: 0,
                shelfLifeDays: 30,
                image: 'data:image/png;base64,xx',
            },
            { ean: '4006381333931', name: 'Mehl' },
        ];
        const first = mergeOwnProducts('[{"ean":"9","name":"Fremd","extra":1}]', products);
        expect(JSON.parse(first)).to.deep.equal([
            { ean: '9', name: 'Fremd', extra: 1 },
            { ean: '2123456789012', name: 'Selbstgemachte Soße', unit: 'Glas', tags: ['Soße'], shelfLifeDays: 30 },
        ]);
        expect(mergeOwnProducts(first, products)).to.equal(null);
        products[0].name = 'Soße neu';
        expect(JSON.parse(mergeOwnProducts(first, products))[1].name).to.equal('Soße neu');
        expect(JSON.parse(mergeOwnProducts('', products))).to.have.length(1);
        expect(mergeOwnProducts('{"nope":1}', products)).to.equal(null);
        expect(mergeOwnProducts('kein json', products)).to.equal(null);
    });

    it('always asks the data point of the adapter first, with the ShelfMate field names', async () => {
        const db = new OwnDb({
            config: { ownDbFile: '/x.csv', ownDbMap: [{ field: 'name', key: 'Krömpel' }] },
            builtin: 'shelfmate.0.ownDb.data',
            readState: async id => (id === 'shelfmate.0.ownDb.data' ? '[{"ean":"5","name":"Eigenes"}]' : null),
            readFile: async () => ({ text: 'ean;Krömpel\n5;Aus Datei\n6;Nur Datei', stamp: '1' }),
        });
        expect((await db.find('5')).name).to.equal('Eigenes');
        expect((await db.find('6')).name).to.equal('Nur Datei');
        expect(db.mode).to.equal('first');
        const empty = new OwnDb({
            config: { ownDbMode: 'only' },
            builtin: 'a.0.ownDb.data',
            readState: async () => '',
        });
        await empty.refresh();
        expect(empty.mode).to.equal('off');
    });
});
