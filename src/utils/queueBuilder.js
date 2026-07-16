/**
 * Fisher-Yates shuffle algorithm for randomizing arrays
 * @param {Array} arr - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const k = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[k]] = [copy[k], copy[i]];
    }
    return copy;
}

/**
 * Build a shuffled queue of all candidate pairs (excluding self-pairs)
 * @param {Array} profiles - Array of candidate profiles
 * @returns {Array} Array of [profileA, profileB] pairs
 */
export function buildShuffledVotingQueue(profiles) {
    const pairs = [];
    for (let i = 0; i < profiles.length; i++) {
        for (let j = i + 1; j < profiles.length; j++) {
            pairs.push([profiles[i], profiles[j]]);
        }
    }
    return shuffle(pairs);
}

/**
 * Build a shuffled queue of candidates for swiping
 * @param {Array} profiles - Array of candidate profiles
 * @returns {Array} Shuffled array of profiles
 */
export function buildShuffledSwipeQueue(profiles) {
    return shuffle(profiles);
}
