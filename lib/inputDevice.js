'use strict';

/**
 * Reads a barcode scanner that the host sees as a keyboard (Linux input event device).
 * The keycodes are decoded with the US layout, a scan ends with Enter.
 */

const fs = require('node:fs');

const PLAIN = {
    2: '1234567890',
    16: 'qwertyuiop',
    30: 'asdfghjkl',
    44: 'zxcvbnm',
};
const SHIFTED_DIGITS = '!@#$%^&*()';
const SYMBOLS = {
    12: ['-', '_'],
    13: ['=', '+'],
    26: ['[', '{'],
    27: [']', '}'],
    39: [';', ':'],
    40: ["'", '"'],
    41: ['`', '~'],
    43: ['\\', '|'],
    51: [',', '<'],
    52: ['.', '>'],
    53: ['/', '?'],
    57: [' ', ' '],
    55: ['*', '*'],
    74: ['-', '-'],
    78: ['+', '+'],
    83: ['.', '.'],
    98: ['/', '/'],
};
const KEYPAD = { 71: '7', 72: '8', 73: '9', 75: '4', 76: '5', 77: '6', 79: '1', 80: '2', 81: '3', 82: '0' };
const ENTER = [28, 96];
const SHIFT = [42, 54];

/** German layout (null = same as US): [plain, shifted, AltGr] */
const DE_KEYS = {
    3: [null, '"', '²'],
    4: [null, '§', '³'],
    7: [null, '&', null],
    8: [null, '/', '{'],
    9: [null, '(', '['],
    10: [null, ')', ']'],
    11: [null, '=', '}'],
    12: ['ß', '?', '\\'],
    13: ['', '', ''],
    16: [null, null, '@'],
    18: [null, null, '€'],
    21: ['z', 'Z', null],
    26: ['ü', 'Ü', ''],
    27: ['+', '*', '~'],
    39: ['ö', 'Ö', ''],
    40: ['ä', 'Ä', ''],
    41: ['^', '°', ''],
    43: ['#', "'", ''],
    44: ['y', 'Y', null],
    51: [',', ';', ''],
    52: ['.', ':', ''],
    53: ['-', '_', ''],
    86: ['<', '>', '|'],
};
const ALTGR = 100;

/**
 * @param {number} code Linux keycode
 * @param {boolean} shift shift is held
 * @param {string} [layout] "us" or "de"
 * @param {boolean} [altgr] AltGr is held (German layout)
 * @returns {string} character, empty for keys without one
 */
function keyChar(code, shift, layout = 'us', altgr = false) {
    if (layout === 'de' && DE_KEYS[code]) {
        const v = DE_KEYS[code][altgr ? 2 : shift ? 1 : 0];
        if (v !== null) {
            return v;
        }
    }
    for (const [start, letters] of Object.entries(PLAIN)) {
        const i = code - Number(start);
        if (i >= 0 && i < letters.length) {
            if (start === '2') {
                return shift ? SHIFTED_DIGITS[i] : letters[i];
            }
            return shift ? letters[i].toUpperCase() : letters[i];
        }
    }
    if (SYMBOLS[code]) {
        return SYMBOLS[code][shift ? 1 : 0];
    }
    return KEYPAD[code] || '';
}

/**
 * Size of one input_event: 24 bytes with a 64-bit time value, 16 bytes with a 32-bit one.
 *
 * @param {string} [arch] process.arch
 */
function eventSize(arch = process.arch) {
    return arch === 'arm' || arch === 'ia32' ? 16 : 24;
}

/**
 * Turns raw input events into scanned lines.
 */
class KeyDecoder {
    /**
     * @param {(line: string) => void} onLine called for every finished line
     * @param {number} [size] bytes per event
     * @param {string} [layout] "us" or "de"
     */
    constructor(onLine, size = eventSize(), layout = 'us') {
        this.onLine = onLine;
        this.size = size;
        this.layout = layout === 'de' ? 'de' : 'us';
        this.altgr = false;
        this.rest = Buffer.alloc(0);
        this.shift = false;
        this.text = '';
    }

    /**
     * @param {Buffer} chunk data from the device
     */
    feed(chunk) {
        let buf = Buffer.concat([this.rest, chunk]);
        const o = this.size - 8;
        while (buf.length >= this.size) {
            const type = buf.readUInt16LE(o);
            const code = buf.readUInt16LE(o + 2);
            const value = buf.readInt32LE(o + 4);
            buf = buf.subarray(this.size);
            if (type !== 1) {
                continue;
            }
            if (SHIFT.includes(code)) {
                this.shift = value !== 0;
            } else if (code === ALTGR) {
                this.altgr = value !== 0;
            } else if (value === 1 || value === 2) {
                if (ENTER.includes(code)) {
                    if (value === 1) {
                        const line = this.text;
                        this.text = '';
                        this.onLine(line);
                    }
                } else {
                    this.text += keyChar(code, this.shift, this.layout, this.altgr);
                }
            }
        }
        this.rest = Buffer.from(buf);
    }
}

/**
 * Joins lines that arrive right after each other (a QR code with a line break) to one scan and removes prefix and suffix.
 */
class ScanAssembler {
    /**
     * @param {object} opt options
     * @param {(text: string) => void} opt.onScan finished scan
     * @param {(fn: () => void, ms: number) => object} opt.setTimeout timer
     * @param {(h: object | null) => void} opt.clearTimeout timer cancel
     * @param {string} [opt.prefix] prefix of the scanner
     * @param {string} [opt.suffix] suffix of the scanner
     * @param {number} [opt.joinMs] wait for a following line
     */
    constructor(opt) {
        this.opt = opt;
        this.lines = [];
        this.timer = null;
    }

    /**
     * @param {string} line one finished line
     */
    line(line) {
        this.lines.push(line);
        this.opt.clearTimeout(this.timer);
        this.timer = this.opt.setTimeout(() => this.emit(), this.opt.joinMs ?? 150);
    }

    /** Hand over the collected lines as one scan. */
    emit() {
        this.timer = null;
        let text = this.lines.join('\n');
        this.lines = [];
        const { prefix, suffix } = this.opt;
        if (prefix && text.startsWith(prefix)) {
            text = text.slice(prefix.length);
        }
        if (suffix && text.endsWith(suffix)) {
            text = text.slice(0, -suffix.length);
        }
        text = text.trim();
        if (text) {
            this.opt.onScan(text);
        }
    }

    /** Cancel a waiting scan. */
    stop() {
        this.opt.clearTimeout(this.timer);
        this.timer = null;
    }
}

/**
 * Keyboard-like devices that can be chosen in the settings.
 *
 * @param {{readdirSync: (p: string) => string[]}} [fsImpl] file system
 * @returns {{label: string, value: string}[]} device list
 */
function listDevices(fsImpl = fs) {
    let list = [];
    try {
        list = fsImpl
            .readdirSync('/dev/input/by-id')
            .filter(n => /event-kbd$/.test(n))
            .sort()
            .map(n => ({ label: n.replace(/-event-kbd$/, ''), value: `/dev/input/by-id/${n}` }));
    } catch {
        // no by-id directory
    }
    // Bluetooth keyboards have no by-id entry: offer them by name (the event number changes).
    try {
        for (const d of parseProcDevices(fsImpl.readFileSync('/proc/bus/input/devices', 'utf8'))) {
            if (!list.some(x => x.label === d.name)) {
                list.push({ label: `${d.name} (Bluetooth)`, value: `name:${d.name}` });
            }
        }
    } catch {
        // /proc not readable
    }
    return list;
}

/**
 * @param {string} text content of /proc/bus/input/devices
 * @returns {{name: string, event: string}[]} Bluetooth keyboards (bus 0005)
 */
function parseProcDevices(text) {
    const out = [];
    for (const block of String(text).split(/\n\s*\n/)) {
        const bus = /^I: Bus=([0-9a-f]+)/im.exec(block);
        const name = /^N: Name="(.*)"$/m.exec(block);
        const h = /^H: Handlers=(.*)$/m.exec(block);
        const ev = h && /\b(event\d+)\b/.exec(h[1]);
        if (
            bus &&
            parseInt(bus[1], 16) === 5 &&
            name &&
            ev &&
            /\bkbd\b/.test(h[1]) &&
            /^B: EV=1[2-9a-f]/im.test(block)
        ) {
            out.push({ name: name[1], event: ev[1] });
        }
    }
    return out;
}

/**
 * Turns `name:<device name>` into the current /dev/input/eventN, other paths stay as they are.
 *
 * @param {string} path configured device
 * @param {{readFileSync: (p: string, enc: string) => string}} [fsImpl] file system
 * @returns {string} device path
 */
function resolveDevice(path, fsImpl = fs) {
    if (!String(path).startsWith('name:')) {
        return path;
    }
    const want = path.slice(5);
    const d = parseProcDevices(fsImpl.readFileSync('/proc/bus/input/devices', 'utf8')).find(x => x.name === want);
    if (!d) {
        throw Object.assign(new Error(`device "${want}" is not connected`), { code: 'ENOENT' });
    }
    return `/dev/input/${d.event}`;
}

/**
 * Reads one device and reconnects when it disappears.
 */
class InputReader {
    /**
     * @param {object} opt options
     * @param {string} opt.path device path
     * @param {(text: string) => void} opt.onScan finished scan
     * @param {(fn: () => void, ms: number) => object} opt.setTimeout timer
     * @param {(h: object | null) => void} opt.clearTimeout timer cancel
     * @param {{warn: (m: string) => void, info: (m: string) => void, debug: (m: string) => void}} opt.log logger
     * @param {string} [opt.prefix] prefix of the scanner
     * @param {string} [opt.suffix] suffix of the scanner
     * @param {number} [opt.retryMs] wait before a new try
     * @param {(p: string) => object} [opt.open] stream factory for tests
     * @param {number} [opt.eventSize] bytes per event
     * @param {string} [opt.layout] keyboard layout of the scanner, "us" or "de"
     * @param {number} [opt.joinMs] wait for a following line
     */
    constructor(opt) {
        this.opt = opt;
        this.stopped = false;
        this.stream = null;
        this.retry = null;
        this.warned = false;
        this.asm = new ScanAssembler(opt);
        this.dec = new KeyDecoder(l => this.asm.line(l), opt.eventSize, opt.layout);
    }

    /** Open the device. */
    start() {
        if (this.stopped) {
            return;
        }
        const open = this.opt.open || (p => fs.createReadStream(p));
        let s;
        try {
            s = open(resolveDevice(this.opt.path));
        } catch (e) {
            this.fail(e);
            return;
        }
        this.stream = s;
        s.on('open', () => {
            this.warned = false;
            this.opt.log.info(`Scanner device opened: ${this.opt.path}`);
        });
        s.on('data', d => this.dec.feed(d));
        s.on('error', e => this.fail(e));
        s.on('close', () => {
            if (this.stream === s) {
                this.fail(null);
            }
        });
    }

    /**
     * @param {Error | null} e error
     */
    fail(e) {
        this.stream = null;
        if (this.stopped || this.retry) {
            return;
        }
        if (e && !this.warned) {
            this.warned = true;
            const hint = e.code === 'EACCES' ? ' (the ioBroker user needs the group "input")' : '';
            this.opt.log.warn(`Scanner device ${this.opt.path} not readable: ${e.message}${hint}`);
        }
        this.retry = this.opt.setTimeout(() => {
            this.retry = null;
            this.start();
        }, this.opt.retryMs ?? 10000);
    }

    /** Close the device and stop retrying. */
    stop() {
        this.stopped = true;
        this.asm.stop();
        this.opt.clearTimeout(this.retry);
        this.retry = null;
        if (this.stream) {
            const s = this.stream;
            this.stream = null;
            s.removeAllListeners('close');
            s.destroy();
        }
    }
}

module.exports = {
    KeyDecoder,
    ScanAssembler,
    InputReader,
    listDevices,
    parseProcDevices,
    resolveDevice,
    keyChar,
    eventSize,
};
