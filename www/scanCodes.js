/* Codes on books, magazines, sheet music and medicines: ISBN / ISSN / ISMN, PZN, and the best-before date inside GS1 and PPN data matrix codes. Used by the app and the adapter. */
(function (root) {
    const pad = n => String(n).padStart(2, '0');

    /**
     * @param {string} s digits
     * @returns {boolean} the last digit is the EAN / GTIN check digit
     */
    function eanOk(s) {
        if (!/^\d{8}$|^\d{12,14}$/.test(s)) {
            return false;
        }
        const d = s.split('').map(Number);
        const last = d.pop();
        let sum = 0;
        for (let i = d.length - 1, w = 3; i >= 0; i--, w = 4 - w) {
            sum += d[i] * w;
        }
        return (10 - (sum % 10)) % 10 === last;
    }

    /**
     * @param {string} s 12 digits
     * @returns {string} the 13 digits with check digit
     */
    function withCheck(s) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += Number(s[i]) * (i % 2 ? 3 : 1);
        }
        return s + ((10 - (sum % 10)) % 10);
    }

    /**
     * The ISBN-13 of a scanned text: the EAN on the back of a book, or an ISBN-10 / ISBN with hyphens.
     *
     * @param {string} text scanned text
     * @returns {string} 13 digits, empty when it is none
     */
    function isbnOf(text) {
        const t = String(text ?? '')
            .replace(/^isbn(?:-1[03])?:?/i, '')
            .replace(/[\s-]/g, '');
        if (/^97[89]\d{10}$/.test(t)) {
            return eanOk(t) ? t : '';
        }
        if (/^\d{9}[\dX]$/i.test(t)) {
            let sum = 0;
            for (let i = 0; i < 10; i++) {
                const c = t[i].toUpperCase();
                sum += (10 - i) * (c === 'X' ? 10 : Number(c));
            }
            return sum % 11 === 0 ? withCheck(`978${t.slice(0, 9)}`) : '';
        }
        return '';
    }

    /**
     * The ISSN of a magazine barcode (EAN-13 starting with 977): seven digits of the ISSN, then the check character.
     *
     * @param {string} ean EAN-13
     * @returns {string} ISSN like 0317-8471, empty when it is none
     */
    function issnOf(ean) {
        if (!/^977\d{10}$/.test(ean) || !eanOk(ean)) {
            return '';
        }
        const d = ean.slice(3, 10);
        let sum = 0;
        for (let i = 0; i < 7; i++) {
            sum += (8 - i) * Number(d[i]);
        }
        const c = (11 - (sum % 11)) % 11;
        return `${d.slice(0, 4)}-${d.slice(4)}${c === 10 ? 'X' : c}`;
    }

    /**
     * @param {string} pzn 8 digits: seven digits and the check digit (modulo 11)
     * @returns {boolean} valid PZN
     */
    function pznOk(pzn) {
        if (!/^\d{8}$/.test(pzn)) {
            return false;
        }
        let sum = 0;
        for (let i = 0; i < 7; i++) {
            sum += (i + 1) * Number(pzn[i]);
        }
        return sum % 11 === Number(pzn[7]);
    }

    /**
     * The barcode number of a medicine: 4150 + PZN + check digit (the NTIN).
     *
     * @param {string} pzn 8 digits
     * @returns {string} 13 digits, empty when the PZN is wrong
     */
    function ntinOfPzn(pzn) {
        return pznOk(pzn) ? withCheck(`4150${pzn}`) : '';
    }

    /**
     * @param {string} code barcode number
     * @returns {string} the PZN when the number is the NTIN of a medicine, else empty
     */
    function pznOfNtin(code) {
        const m = /^4150(\d{8})\d$/.exec(String(code ?? ''));
        return m && eanOk(m[0]) && pznOk(m[1]) ? m[1] : '';
    }

    /**
     * What a barcode number stands for.
     *
     * @param {string} code digits
     * @returns {'isbn' | 'ismn' | 'issn' | 'pzn' | ''} kind
     */
    function kindOf(code) {
        const c = String(code ?? '');
        if (isbnOf(c) === c && /^9790/.test(c)) {
            return 'ismn';
        }
        if (isbnOf(c) === c) {
            return 'isbn';
        }
        if (issnOf(c)) {
            return 'issn';
        }
        return pznOfNtin(c) ? 'pzn' : '';
    }

    /**
     * @param {string} yymmdd date as printed, day 00 means the end of the month
     * @returns {string} ISO date, empty when it is none
     */
    function expiryOf(yymmdd) {
        const m = /^(\d\d)(\d\d)(\d\d)$/.exec(yymmdd);
        if (!m) {
            return '';
        }
        const y = 2000 + Number(m[1]);
        const mo = Number(m[2]);
        let d = Number(m[3]);
        if (mo < 1 || mo > 12 || d > 31) {
            return '';
        }
        const last = new Date(y, mo, 0).getDate();
        if (d === 0) {
            d = last;
        }
        return d > last ? '' : `${y}-${pad(mo)}-${pad(d)}`;
    }

    const GS = /[\u001d\u001e\u0004]/;

    /**
     * Take apart a scanned text: medicine packs (PPN or GS1 data matrix) and GS1 codes with a best-before date.
     * `code` is only set for medicines, other numbers stay as the caller has them.
     *
     * @param {string} raw scanned text
     * @returns {{code: string, expiry: string, batch: string}} code (NTIN of a medicine), best-before date and batch
     */
    function info(raw) {
        const out = { code: '', expiry: '', batch: '' };
        const s = String(raw ?? '')
            .replace(/^\](?:d2|Q3|C1|e0|d1)/i, '')
            .replace(/^[\s]+|[\s]+$/g, '');
        // PPN: 9N product number, 1T batch, D best-before (YYMMDD), S serial, parts separated by control characters
        if (/9N\d{8,12}/.test(s) && /\[\)>|(?:^|[\u001d\u001e])9N/.test(s)) {
            let pzn = '';
            for (const t of s.split(GS)) {
                const n = /^(?:\[\)>)?(?:06)?9N(\d{12}|\d{8})$/.exec(t);
                if (n) {
                    pzn = n[1].length === 12 ? n[1].slice(2, 10) : n[1];
                } else if (/^1T/.test(t)) {
                    out.batch = t.slice(2);
                } else if (/^D\d{6}$/.test(t)) {
                    out.expiry = expiryOf(t.slice(1));
                }
            }
            if (!pzn) {
                // the control characters got lost on the way: the order is fixed, so the parts can still be found
                const n = /9N(?:11)?(\d{8})(?:\d{2})?/.exec(s);
                pzn = n ? n[1] : '';
                const d = /D(\d{6})S/.exec(s);
                out.expiry = d ? expiryOf(d[1]) : '';
            }
            out.code = ntinOfPzn(pzn);
            return out;
        }
        // GS1: (01) article, (11)(13)(15)(17) dates, (10) batch, (21) serial
        const gtin = /^01(\d{14})/.exec(s.replace(/[\s]/g, ''));
        if (!gtin) {
            const bare = /^-?(?:PZN-?)?(\d{8})$/i.exec(s);
            // eight digits that are a PZN and no EAN-8, or marked as PZN (the Code 39 on a medicine pack starts with a dash)
            const marked = /^(?:-|PZN)/i.test(s);
            if (bare && pznOk(bare[1]) && (marked || !eanOk(bare[1]))) {
                out.code = ntinOfPzn(bare[1]);
            }
            return out;
        }
        let rest = s.replace(/\s/g, '').slice(16);
        if (gtin[1].startsWith('0') && pznOfNtin(gtin[1].slice(1))) {
            out.code = gtin[1].slice(1);
        }
        while (rest) {
            const d = /^(11|13|15|17)(\d{6})/.exec(rest);
            const v = /^(10|21)([^\u001d]*)/.exec(rest);
            if (d) {
                if (d[1] === '17') {
                    out.expiry = expiryOf(d[2]);
                }
                rest = rest.slice(8);
            } else if (v) {
                if (v[1] === '10') {
                    out.batch = v[2];
                }
                rest = rest.slice(v[0].length).replace(/^\u001d/, '');
            } else {
                break;
            }
        }
        return out;
    }

    const api = { eanOk, isbnOf, issnOf, pznOk, ntinOfPzn, pznOfNtin, kindOf, expiryOf, info };
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.ShelfCodes = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
