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
  return seededRandom(key) < 0.42 ? 'match' : 'no-match';
}

/**
 * Create a consistent, sorted key for a pair of candidate IDs
 * @param {number} a - First candidate ID
 * @param {number} b - Second candidate ID
 * @returns {string} A normalized pair key
 */
export function pairKey(a, b) {
  return [a, b].sort((x, y) => x - y).join('-');
}
