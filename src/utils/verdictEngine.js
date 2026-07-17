/**
 * Deterministic seeded random function for consistent pair verdicts
 * @param {string} key - The pair key to seed with
 * @returns {number} A number between 0 and 1
 */
export function seededRandom(key) {
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 10000) / 10000;
}

/**
 * Get the deterministic verdict for a candidate pair
 * @param {string} key - The pair key
 * @returns {'match' | 'no-match'} The verdict
 */
export function trueVerdict(key) {
    return seededRandom(key) < 0.42 ? "match" : "no-match";
}

/**
 * Compute verdict from an in-tab vote tally.
 * If sameLeague votes are a majority over out-of-league votes, verdict is "match".
 * Falls back to the deterministic mock verdict until at least 3 votes exist.
 * @param {object|null} voteTally - Session tally data
 * @param {string} key - Pair key for seeded fallback
 * @returns {'match' | 'no-match'} The verdict
 */
export function computeVerdict(voteTally, key) {
    const totalVotes = Number(voteTally?.totalVotes) || 0;
    if (!voteTally || totalVotes < 3) return trueVerdict(key);

    const sameLeague = Number(voteTally.sameLeague) || 0;
    const aOverB = Number(voteTally.aOverB) || 0;
    const bOverA = Number(voteTally.bOverA) || 0;

    return sameLeague > aOverB + bOverA ? "match" : "no-match";
}

/**
 * Create a consistent, sorted key for a pair of candidate IDs
 * @param {number} a - First candidate ID
 * @param {number} b - Second candidate ID
 * @returns {string} A normalized pair key
 */
export function pairKey(a, b) {
    return [a, b].sort((x, y) => x - y).join("-");
}
