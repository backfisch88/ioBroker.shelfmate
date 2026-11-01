'use strict';

/** No more than this many requests to the outside run at once, whatever they are for and whoever asked. */
const MAX_PARALLEL = 2;
let activeRequests = 0;
const waitingRequests = [];

/**
 * A fetch that lets only MAX_PARALLEL requests run at the same time (shared by all searches). The time limit of a
 * request (option timeoutMs) starts when it gets its turn, not while it waits.
 *
 * @param {typeof fetch} raw fetch
 * @returns {typeof fetch} limited fetch
 */
function gate(raw) {
    return async (url, opts = {}) => {
        if (activeRequests >= MAX_PARALLEL) {
            await new Promise(resolve => waitingRequests.push(resolve));
        } else {
            activeRequests++;
        }
        try {
            const { timeoutMs, ...rest } = opts;
            return await raw(url, timeoutMs ? { ...rest, signal: AbortSignal.timeout(timeoutMs) } : rest);
        } finally {
            const next = waitingRequests.shift();
            if (next) {
                next();
            } else {
                activeRequests--;
            }
        }
    };
}

module.exports = { gate, MAX_PARALLEL };
