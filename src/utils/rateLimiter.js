const RATE_LIMIT_KEY = "looksmatch_rate_limit";
const MAX_WRITES = 60;
const WINDOW_MS = 60 * 1000;

function now() {
    return Date.now();
}

function storageAvailable() {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readState(currentTime = now()) {
    if (!storageAvailable()) return { timestamps: [] };

    try {
        const raw = window.localStorage.getItem(RATE_LIMIT_KEY);
        const parsed = raw ? JSON.parse(raw) : { timestamps: [] };
        const timestamps = Array.isArray(parsed.timestamps) ? parsed.timestamps : [];
        return {
            timestamps: timestamps.filter((timestamp) => currentTime - timestamp < WINDOW_MS),
        };
    } catch (error) {
        console.warn("Rate limiter state reset", error);
        return { timestamps: [] };
    }
}

function writeState(state) {
    if (!storageAvailable()) return;

    try {
        window.localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
    } catch (error) {
        console.warn("Rate limiter state could not be saved", error);
    }
}

/**
 * Returns true if a Firebase write is allowed, false if rate-limited.
 * Mutates localStorage to prune expired write timestamps.
 * @returns {boolean}
 */
export function canWrite() {
    const state = readState();
    writeState(state);
    return state.timestamps.length < MAX_WRITES;
}

/**
 * Records a successful Firebase write.
 */
export function recordWrite() {
    const currentTime = now();
    const state = readState(currentTime);
    state.timestamps.push(currentTime);
    writeState(state);
}

/**
 * Returns current rate-limit status.
 * @returns {{remaining: number, resetsIn: number}}
 */
export function getRateStatus() {
    const currentTime = now();
    const state = readState(currentTime);
    writeState(state);

    const remaining = Math.max(0, MAX_WRITES - state.timestamps.length);
    const oldest = state.timestamps[0];
    const resetsIn = oldest === undefined ? 0 : Math.max(0, WINDOW_MS - (currentTime - oldest));

    return { remaining, resetsIn };
}
