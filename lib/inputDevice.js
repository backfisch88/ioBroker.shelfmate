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

/**
 * @param {number} code Linux keycode
 * @param {boolean} shift shift is held
 * @returns {string} character, empty for keys without one
 */
function keyChar(code, shift) {
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
     */
    constructor(onLine, size = eventSize()) {
        this.onLine = onLine;
        this.size = size;
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
            } else if (value === 1 || value === 2) {
                if (ENTER.includes(code)) {
                    if (value === 1) {
                        const line = this.text;
                        this.text = '';
                        this.onLine(line);
                    }
                } else {
                    this.text += keyChar(code, this.shift);
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
    try {
        return fsImpl
            .readdirSync('/dev/input/by-id')
            .filter(n => /event-kbd$/.test(n))
            .sort()
            .map(n => ({ label: n.replace(/-event-kbd$/, ''), value: `/dev/input/by-id/${n}` }));
    } catch {
        return [];
    }
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
     * @param {number} [opt.joinMs] wait for a following line
     */
    constructor(opt) {
        this.opt = opt;
        this.stopped = false;
        this.stream = null;
        this.retry = null;
        this.warned = false;
        this.asm = new ScanAssembler(opt);
        this.dec = new KeyDecoder(l => this.asm.line(l), opt.eventSize);
    }

    /** Open the device. */
    start() {
        if (this.stopped) {
            return;
        }
        const open = this.opt.open || (p => fs.createReadStream(p));
        let s;
        try {
            s = open(this.opt.path);
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

module.exports = { KeyDecoder, ScanAssembler, InputReader, listDevices, keyChar, eventSize };
