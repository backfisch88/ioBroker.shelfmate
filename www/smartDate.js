/* Schnelle Datumseingabe (Mindesthaltbarkeit): +3d, +2w, +1m, +1y, 12/26, 2412, 24.12.26, morgen, x = kein Datum. */
(function (root) {
    const pad = n => String(n).padStart(2, '0');
    const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

    /**
     * @param {number} y year
     * @param {number} m month 1-12
     * @param {number} d day
     * @returns {string | null} ISO date when the day exists
     */
    function valid(y, m, d) {
        const t = new Date(y, m - 1, d);
        return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d ? iso(y, m, d) : null;
    }

    /**
     * @param {number} y year
     * @param {number} m month 1-12
     * @returns {string} last day of that month as ISO date
     */
    function lastDay(y, m) {
        return iso(y, m, new Date(y, m, 0).getDate());
    }

    /**
     * Day and month without year: this year, or next year when the day is already over.
     *
     * @param {number} d day
     * @param {number} m month 1-12
     * @param {Date} now today
     * @returns {string | null} ISO date
     */
    function nearest(d, m, now) {
        const today = iso(now.getFullYear(), now.getMonth() + 1, now.getDate());
        const a = valid(now.getFullYear(), m, d);
        if (a && a >= today) {
            return a;
        }
        return valid(now.getFullYear() + 1, m, d);
    }

    /**
     * @param {string} text what the user typed
     * @param {Date} [now] today
     * @returns {string | null} ISO date, '' for "no date", null when not understood
     */
    function parseSmartDate(text, now = new Date()) {
        const s = String(text ?? '')
            .trim()
            .toLowerCase();
        const y0 = now.getFullYear();
        if (s === '' || s === 'x' || s === '∞') {
            return '';
        }
        if (s === 'heute' || s === 'today') {
            return iso(y0, now.getMonth() + 1, now.getDate());
        }
        if (s === 'morgen' || s === 'tomorrow') {
            const t = new Date(y0, now.getMonth(), now.getDate() + 1);
            return iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
        }
        let m = /^([+-])\s*(\d{1,4})\s*([dwmjy])?$/.exec(s);
        if (m) {
            const n = (m[1] === '-' ? -1 : 1) * Number(m[2]);
            const u = m[3] || 'd';
            let t;
            if (u === 'd' || u === 'w') {
                t = new Date(y0, now.getMonth(), now.getDate() + n * (u === 'w' ? 7 : 1));
            } else {
                const months = u === 'm' ? n : n * 12;
                t = new Date(y0, now.getMonth() + months, 1);
                const day = Math.min(now.getDate(), new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate());
                t.setDate(day);
            }
            return iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
        }
        m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
        if (m) {
            return valid(Number(m[1]), Number(m[2]), Number(m[3]));
        }
        const year = v => (v.length === 2 ? 2000 + Number(v) : Number(v));
        m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/.exec(s);
        if (m) {
            return valid(year(m[3]), Number(m[2]), Number(m[1]));
        }
        m = /^(\d{1,2})[./-](\d{2}|\d{4})$/.exec(s);
        if (m) {
            const a = Number(m[1]);
            const b = Number(m[2]);
            if (m[2].length === 4 || b > 12) {
                return a >= 1 && a <= 12 ? lastDay(year(m[2]), a) : null;
            }
            return nearest(a, b, now);
        }
        m = /^(\d{1,2})[./-](\d{1,2})\.?$/.exec(s);
        if (m) {
            return nearest(Number(m[1]), Number(m[2]), now);
        }
        m = /^(\d{2})(\d{2})(\d{2}|\d{4})?$/.exec(s);
        if (m) {
            return m[3] ? valid(year(m[3]), Number(m[2]), Number(m[1])) : nearest(Number(m[1]), Number(m[2]), now);
        }
        return null;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = { parseSmartDate };
    } else {
        root.parseSmartDate = parseSmartDate;
    }
})(typeof window !== 'undefined' ? window : globalThis);
