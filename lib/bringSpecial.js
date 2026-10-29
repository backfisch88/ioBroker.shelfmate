'use strict';

/* Specification merging for the Bring! list ("Bring Spezial").
 * The helper functions are taken over unchanged from the former Bring helper script. */
/* eslint-disable jsdoc/require-jsdoc, curly */

const isNum = s => /^\d+$/.test(s);

// ---- Varianten ------------------------------------------------------------------------------
const NUM = '\\d+(?:[.,]\\d+)?';
const UNIT = '[a-zA-ZäöüÄÖÜ]+';
// "Kräuter 200g", "Kräuter Bio 200g" oder "500g": optionaler Text, dann Menge + Einheit am Ende
const VARIANT = new RegExp(`^(?:(.*?)\\s+)?(${NUM})\\s*(${UNIT})$`);

function parseVariant(str) {
    const s = String(str).trim();
    const m = VARIANT.exec(s);
    if (!m) {
        // "Kräuter 2" = Variante Kräuter, zweimal
        const c = /^(.*\S)\s+(\d+)$/.exec(s);
        if (c) return { text: c[1].trim(), v: null, u: '', n: Number(c[2]) };
        return { text: s, v: null, u: '', n: 1 };
    }
    return { text: (m[1] || '').trim(), v: parseFloat(m[2].replace(',', '.')), u: m[3], n: 1 };
}

// Dezimalzahlen mit Punkt ausgeben: ein Komma würde die Spezifikation in zwei Teile trennen
const fmtQty = (v, u) => String(Math.round(v * 1000) / 1000) + u;
const variantStr = x =>
    x.v == null ? x.text + (x.n > 1 ? ` ${x.n}` : '') : (x.text ? `${x.text} ` : '') + fmtQty(x.v, x.u);

// Teile einer Eingabe (ohne Stückzahl) zu Varianten. Text direkt vor einer Menge gehört dazu:
// ["Kräuter", "200g"] -> "Kräuter 200g". Mengen werden nie zusammengerechnet, jede bleibt eigene Variante.
// Steht in einer Eingabe ein Text und danach mehrere Mengen ("bunt", "400g", "400g"), gehören alle zum Text.
// "bunt 400g + 400g" (so wird gespeichert; geschrieben wird das Plus als %2B) ergibt zwei Mengen mit dem Text "bunt".
// glue=false: gespeicherte Spezifikation, jedes Teil steht für sich (nichts wird über Kommas verklebt).
function partsToVariants(parts, glue = true) {
    const out = [];
    let cur = ''; // zuletzt genannter Text
    let buf = [];
    for (const p of parts) {
        if (isNum(p)) continue;
        const pieces = p.split(/\s+\/\s+|\s*(?:\+|%2B)\s*/i).filter(Boolean);
        let chain = '';
        pieces.forEach((piece, idx) => {
            if (!glue) {
                const x = parseVariant(piece);
                if (!x.text && x.v != null && idx > 0) x.text = chain;
                if (idx === 0) chain = x.text;
                out.push(x);
            } else if (VARIANT.test(piece)) {
                const x = parseVariant(idx === 0 ? [...buf, piece].join(' ') : piece);
                if (!x.text) x.text = idx === 0 ? cur : chain;
                if (idx === 0) chain = x.text;
                out.push(x);
                if (idx === 0) buf = [];
            } else if (idx === 0) {
                buf.push(piece);
                cur = buf.join(' ');
            }
        });
    }
    for (const b of buf) out.push(parseVariant(b));
    return out;
}

function uniqueVariants(list) {
    // nur Varianten ohne Menge (reiner Text) werden zusammengefasst, Mengen bleiben einzeln
    const seen = new Set();
    return list.filter(x => {
        if (x.v != null) return true;
        const k = x.text.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

const sameText = (a, b) => a.text.toLowerCase() === b.text.toLowerCase();
const sameUnit = (a, b) => a.v != null && b.v != null && a.u.toLowerCase() === b.u.toLowerCase();

// Passende vorhandene Variante: gleicher Text und gleiche Art (beide ohne Menge oder gleiche Einheit).
// "bunt 400g" und "200g" sind verschiedene Varianten und bleiben getrennt.
function findMatch(olds, nv, taken) {
    return olds.findIndex(
        (o, k) => !taken.has(k) && sameText(o, nv) && ((o.v == null && nv.v == null) || sameUnit(o, nv)),
    );
}

function formatSpec(count, vars) {
    // Reihenfolge: Stückzahl, reiner Text ("Kräuter"), dann Mengen (mit Text zuerst)
    const sorted = [
        ...vars.filter(x => x.v == null),
        ...vars.filter(x => x.text && x.v != null),
        ...vars.filter(x => !x.text && x.v != null),
    ];
    // Mengen mit gleichem Text werden zusammengefasst: "bunt 400g + 400g"
    const parts = [];
    const groups = new Map();
    for (const x of sorted) {
        if (x.text && x.v != null) {
            const k = x.text.toLowerCase();
            if (groups.has(k)) {
                groups.get(k).qs.push(fmtQty(x.v, x.u));
                continue;
            }
            const g = { text: x.text, qs: [fmtQty(x.v, x.u)] };
            groups.set(k, g);
            parts.push(g);
        } else parts.push(variantStr(x));
    }
    for (let i = 0; i < parts.length; i++)
        if (typeof parts[i] !== 'string') parts[i] = `${parts[i].text} ${parts[i].qs.join(' + ')}`;
    return [...(count != null ? [count] : []), ...parts].join(', ');
}

function itemSpec(it) {
    return String(it.specification ?? it.spec ?? it.description ?? '').trim();
}

function merge(existing, newParts) {
    const nums = newParts.filter(isNum);
    const newNum = nums.length ? String(nums.reduce((a, n) => a + Number(n), 0)) : undefined; // "1, 1" -> 2
    const newVars = uniqueVariants(partsToVariants(newParts));

    // Neuer Artikel: Eingabe so übernehmen (Stückzahl nur, wenn angegeben)
    if (!existing) {
        return formatSpec(newNum != null ? Number(newNum) : null, newVars);
    }

    const oldParts = itemSpec(existing)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    const hasOldNum = oldParts.some(isNum);
    // Ohne bisherige Stückzahl, aber mit Spezifikation: es zählt nur die neu angegebene Stückzahl
    let count = Number(oldParts.find(isNum) || (oldParts.length ? 0 : 1));

    const olds = uniqueVariants(partsToVariants(oldParts, false)); // Stand vor dieser Eingabe
    const vars = olds.map(x => ({ ...x }));
    const taken = new Set(); // pro Eingabe wird jede vorhandene Variante höchstens einmal angefasst
    let added = false; // neue Variante kam dazu
    let summed = false; // Mengen wurden zusammengerechnet

    for (const nv of newVars) {
        const i = nv.v == null ? findMatch(olds, nv, taken) : -1;
        if (nv.v != null) {
            // Menge: wird nie addiert, sondern immer zusätzlich aufgeführt (auch bei angegebener Stückzahl)
            vars.push(nv);
            added = true;
            continue;
        }
        if (i < 0) {
            vars.push(nv);
            added = true;
            continue;
        }
        taken.add(i);
        if (nv.v == null) {
            // gleicher Text nochmal: "Kräuter" -> "Kräuter 2"
            vars[i].n += nv.n;
            summed = true;
            continue;
        }
        const o = vars[i];

        if (!newNum) {
            o.v += nv.v;
            summed = true;
        } else if (o.v !== nv.v) {
            vars.push(nv); // Stückzahl angegeben und andere Menge: separat
            added = true;
        }
        // Stückzahl angegeben und gleiche Menge: gleiche Packung, die Stückzahl regelt es
    }

    let bumped = false; // Stückzahl wurde durch erneutes Hinzufügen erhöht
    let plainOnQty = false; // nur der Name nochmal, Eintrag hat schon Mengen: Stückzahl 1 sichtbar machen
    if (newNum) count += Number(newNum);
    else if (newVars.length === 0 && olds.length > 0 && !hasOldNum) {
        plainOnQty = true;
        count = 1;
    } else if (newVars.length === 0 || (!added && !summed)) {
        count += 1;
        bumped = true;
    } // gleicher Eintrag nochmal

    // Die Stückzahl steht nur, wenn es schon eine gab, eine angegeben oder hochgezählt wurde
    // oder der Artikel vorher keine Spezifikation hatte ("feta, Kräuter" -> "feta, 1, Kräuter").
    // Reine Mengen-Einträge bleiben ohne Zahl: "bunt, 800g" und "bunt 400g, 200g".
    const showCount = hasOldNum || Boolean(newNum) || bumped || plainOnQty || oldParts.length === 0;
    return formatSpec(showCount ? count : null, vars);
}

const PENDING_MS = 60 * 1000;
const REFRESH_TIMEOUT_MS = 150 * 1000;
// A list update this long after the write started after it, so it already contains the write
const UPDATE_MARGIN_MS = 3000;
const norm = x =>
    String(x || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

/**
 * Adds items to a Bring! list. An item that is already on the list is not skipped but its quantity
 * or variant is merged into the specification. Entries are processed one after another and the next
 * batch waits until the adapter has reloaded the list.
 */
class BringSpecial {
    /**
     * @param {object} o options
     * @param {() => Promise<{items: object[], ts: number}>} o.read current list items and the time of the last list update
     * @param {(text: string) => Promise<void>} o.save writes "Name,specification" to saveItem
     * @param {(level: string, msg: string) => void} o.log logger
     * @param {(ms: number) => Promise<void>} o.sleep sleep that ends early when stopped
     * @param {() => number} [o.now] clock
     */
    constructor(o) {
        this.o = o;
        this.now = o.now || Date.now;
        this.pending = new Map();
        this.expected = new Map();
        this.lastWriteAt = 0;
        this.queue = [];
        this.working = false;
        this.stopped = false;
        this.refreshTimeout = o.refreshTimeoutMs || REFRESH_TIMEOUT_MS;
        this.gapMs = o.gapMs === undefined ? 500 : o.gapMs;
    }

    stop() {
        this.stopped = true;
    }

    /**
     * Forget the cached specification of an item that was removed from the list.
     *
     * @param {string} name item name
     */
    forget(name) {
        this.pending.delete(String(name).trim().toLowerCase());
    }

    /**
     * @param {string} text item text, for example "Nudeln" or "feta, Kräuter"
     */
    enqueue(text) {
        const t = String(text || '').trim();
        if (!t) {
            return;
        }
        this.queue.push(t);
        this.o.log(
            'debug',
            `Bring: queued "${t}"${this.queue.length > 1 || this.working ? ` (queue: ${this.queue.length})` : ''}`,
        );
        this.work().catch(e => this.o.log('error', `Bring: ${e.message}`));
    }

    /**
     * Resolves when everything queued so far is written.
     */
    async idle() {
        while (this.working || this.queue.length) {
            await this.o.sleep(10);
        }
    }

    /**
     * Waits for the Bring list before the next batch of queued items is written (when something was written before).
     * Bring sets the list state on every poll, also when nothing changed, so a list update after the write
     * is enough, whatever the list shows. A list that already shows all written entries after a write
     * (adapter reloaded it at once) is enough, too. Gives up after the timeout.
     */
    async waitForRefresh() {
        if (!this.expected.size) {
            return;
        }
        const start = this.now();
        while (!this.stopped) {
            const { items, ts } = await this.o.read();
            if (ts > this.lastWriteAt + UPDATE_MARGIN_MS) {
                break;
            }
            if (ts > this.lastWriteAt) {
                let all = true;
                for (const [key, spec] of this.expected) {
                    const it = items.find(x => norm(x.name) === key);
                    all = all && Boolean(it) && norm(itemSpec(it)) === norm(spec);
                }
                if (all) {
                    break;
                }
            }
            if (this.now() - start > this.refreshTimeout) {
                this.o.log(
                    'warn',
                    `Bring: no list update after ${this.refreshTimeout / 1000}s, continuing with cached values`,
                );
                break;
            }
            await this.o.sleep(1000);
        }
        this.expected.clear();
    }

    /**
     * @param {string} text item text
     */
    async processText(text) {
        const idx = text.indexOf(',');
        const name = (idx < 0 ? text : text.slice(0, idx)).trim();
        const newParts = (idx < 0 ? '' : text.slice(idx + 1))
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const key = name.toLowerCase();
        const last = this.pending.get(key);
        const fresh = last && this.now() - last.at < PENDING_MS ? last : null;

        const { items } = await this.o.read();
        const fromContent = items.find(it => String(it.name).trim().toLowerCase() === key);
        const existing = fresh ? { name: fresh.name, specification: fresh.spec } : fromContent;

        const spec = merge(existing, newParts);
        const finalName = existing ? String(existing.name).trim() : name;
        this.pending.set(key, { name: finalName, spec, at: this.now() });
        this.lastWriteAt = this.now();
        this.expected.set(norm(finalName), spec);
        // Write the plus sign as %2B, otherwise the adapter turns it into a space
        const out = (spec ? `${finalName},${spec}` : finalName).replace(/\+/g, '%2B');
        await this.o.save(out);
        this.o.log('info', `Bring: ${finalName}${spec ? ` -> ${spec}` : ''}`);
    }

    async work() {
        if (this.working) {
            return;
        }
        this.working = true;
        try {
            while (this.queue.length && !this.stopped) {
                // one wait for the list per batch; everything that is in the queue by then is written in a row
                await this.waitForRefresh();
                const batch = this.queue.splice(0);
                for (const text of batch) {
                    try {
                        await this.processText(text);
                    } catch (e) {
                        this.o.log('error', `Bring: error for "${text}": ${e.message}`);
                    }
                    await this.o.sleep(this.gapMs);
                }
            }
        } finally {
            this.working = false;
        }
    }
}

module.exports = { BringSpecial, merge, itemSpec };
