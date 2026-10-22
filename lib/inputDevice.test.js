'use strict';

const { expect } = require('chai');
const { EventEmitter } = require('node:events');
const { KeyDecoder, ScanAssembler, InputReader, listDevices, resolveDevice, keyChar, eventSize } = require('./inputDevice');

/**
 * @param {string} text text to type
 * @param {number} size bytes per event
 * @param {boolean} [enter] press Enter at the end
 */
function type(text, size, enter = true) {
    const rev = {};
    const base = '1234567890';
    for (let i = 0; i < 10; i++) {
        rev[base[i]] = [2 + i, false];
    }
    'qwertyuiop'.split('').forEach((c, i) => (rev[c] = [16 + i, false]));
    'asdfghjkl'.split('').forEach((c, i) => (rev[c] = [30 + i, false]));
    'zxcvbnm'.split('').forEach((c, i) => (rev[c] = [44 + i, false]));
    Object.assign(rev, { ':': [39, true], '-': [12, false], ' ': [57, false] });
    const out = [];
    const ev = (t, c, v) => {
        const b = Buffer.alloc(size);
        b.writeUInt16LE(t, size - 8);
        b.writeUInt16LE(c, size - 6);
        b.writeInt32LE(v, size - 4);
        out.push(b);
    };
    for (const ch of text) {
        const lower = ch.toLowerCase();
        const [code, sh] = rev[lower] || [0, false];
        const shift = sh || ch !== lower;
        if (shift) {
            ev(1, 42, 1);
        }
        ev(1, code, 1);
        ev(1, code, 0);
        if (shift) {
            ev(1, 42, 0);
        }
        ev(0, 0, 0);
    }
    if (enter) {
        ev(1, 28, 1);
        ev(1, 28, 0);
    }
    return Buffer.concat(out);
}

describe('inputDevice', () => {
    it('decodes keys with shift, 64 and 32 bit events and split chunks', () => {
        for (const size of [24, 16]) {
            const lines = [];
            const d = new KeyDecoder(l => lines.push(l), size);
            const data = type('SM:L:ab1', size);
            d.feed(data.subarray(0, 7));
            d.feed(data.subarray(7));
            expect(lines).to.deep.equal(['SM:L:ab1']);
        }
        expect(eventSize('arm')).to.equal(16);
        expect(eventSize('x64')).to.equal(24);
    });

    it('joins lines that follow quickly and strips prefix and suffix', () => {
        const timers = [];
        const out = [];
        const a = new ScanAssembler({
            onScan: t => out.push(t),
            setTimeout: fn => timers.push(fn) && timers.length,
            clearTimeout: h => h && (timers[h - 1] = null),
            prefix: '#',
            suffix: '~',
        });
        a.line('#home');
        a.line('shelf~');
        timers.filter(Boolean).forEach(fn => fn());
        expect(out).to.deep.equal(['home\nshelf']);
    });

    it('reads a stream, ignores other events and retries when it breaks', () => {
        const scans = [];
        const timers = [];
        const streams = [];
        const log = { warn: () => {}, info: () => {}, debug: () => {} };
        const r = new InputReader({
            path: '/dev/x',
            onScan: t => scans.push(t),
            setTimeout: fn => timers.push(fn) && timers.length,
            clearTimeout: () => {},
            log,
            eventSize: 24,
            open: () => {
                const s = new EventEmitter();
                s.destroy = () => {};
                streams.push(s);
                return s;
            },
        });
        r.start();
        streams[0].emit('data', type('4000', 24));
        streams[0].emit('error', Object.assign(new Error('gone'), { code: 'ENOENT' }));
        expect(timers.length).to.equal(2);
        timers[1]();
        expect(streams.length).to.equal(2);
        timers[0]();
        streams[1].emit('data', type('12', 24));
        r.stop();
        expect(scans).to.deep.equal(['4000']);
    });

    it('lists devices and survives a missing directory', () => {
        const fsImpl = { readdirSync: () => ['usb-Scan-event-kbd', 'usb-Scan-event-mouse'] };
        expect(listDevices(fsImpl)).to.deep.equal([
            { label: 'usb-Scan', value: '/dev/input/by-id/usb-Scan-event-kbd' },
        ]);
        expect(
            listDevices({
                readdirSync: () => {
                    throw new Error('no');
                },
            }),
        ).to.deep.equal([]);
    });

    describe('Bluetooth keyboards', () => {
        const proc =
            'I: Bus=0005 Vendor=0001 Product=0001 Version=0100\nN: Name="BarCode Scanner HID"\nH: Handlers=sysrq kbd event7 leds\nB: EV=12001f\n\n' +
            'I: Bus=0019 Vendor=0000 Product=0001 Version=0000\nN: Name="Power Button"\nH: Handlers=kbd event0\nB: EV=3\n';
        const fsImpl = { readFileSync: () => proc };
        it('resolves a device by name to its current event number', () => {
            expect(resolveDevice('name:BarCode Scanner HID', fsImpl)).to.equal('/dev/input/event7');
            expect(resolveDevice('/dev/input/event3', fsImpl)).to.equal('/dev/input/event3');
        });
        it('fails like a missing device when the keyboard is not connected', () => {
            expect(() => resolveDevice('name:Other', fsImpl)).to.throw(/not connected/);
        });
        it('lists keyboards without a by-id entry by name', () => {
            const list = listDevices({
                readdirSync: () => {
                    throw new Error('none');
                },
                readFileSync: () => proc,
            });
            expect(list).to.deep.equal([{ label: 'BarCode Scanner HID (Bluetooth)', value: 'name:BarCode Scanner HID' }]);
        });
    });

    describe('German layout', () => {
        it('reads umlauts, ß and the swapped Y and Z', () => {
            expect(keyChar(26, false, 'de')).to.equal('ü');
            expect(keyChar(26, true, 'de')).to.equal('Ü');
            expect(keyChar(39, false, 'de')).to.equal('ö');
            expect(keyChar(40, true, 'de')).to.equal('Ä');
            expect(keyChar(12, false, 'de')).to.equal('ß');
            expect(keyChar(21, false, 'de')).to.equal('z');
            expect(keyChar(44, true, 'de')).to.equal('Y');
        });
        it('reads the symbols of the shortcodes', () => {
            expect(keyChar(52, true, 'de')).to.equal(':');
            expect(keyChar(53, false, 'de')).to.equal('-');
            expect(keyChar(8, true, 'de')).to.equal('/');
            expect(keyChar(8, false, 'de', true)).to.equal('{');
            expect(keyChar(16, false, 'de', true)).to.equal('@');
        });
        it('keeps digits and letters as in the US layout', () => {
            expect(keyChar(2, false, 'de')).to.equal('1');
            expect(keyChar(30, true, 'de')).to.equal('A');
        });
        it('stays on the US layout by default', () => {
            expect(keyChar(26, false)).to.equal('[');
            expect(keyChar(39, true)).to.equal(':');
        });
    });
});
