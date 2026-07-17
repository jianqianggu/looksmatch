/**
 * Firebase Realtime Database schema:
 *
 * /votes/{pairKey}
 *   sameLeague: number
 *   aOverB: number
 *   bOverA: number
 *   totalVotes: number
 *   lastUpdated: number
 *
 * Security rules to set in Firebase Console:
 * {
 *   "rules": {
 *     "votes": {
 *       ".read": true,
 *       "$pairKey": {
 *         ".write": "newData.exists() && newData.hasChildren(['sameLeague','aOverB','bOverA','totalVotes','lastUpdated'])",
 *         ".validate": "newData.child('sameLeague').isNumber() && newData.child('aOverB').isNumber() && newData.child('bOverA').isNumber() && newData.child('totalVotes').isNumber() && newData.child('lastUpdated').isNumber() && newData.child('totalVotes').val() === (newData.child('sameLeague').val() + newData.child('aOverB').val() + newData.child('bOverA').val())"
 *       }
 *     },
 *     ".read": false,
 *     ".write": false
 *   }
 * }
 */

const FIREBASE_URL = import.meta.env?.VITE_FIREBASE_URL || "";

function firebasePath(path) {
    return String(path || "").replace(/^\/+|\/+$/g, "");
}

function firebaseUrl(path) {
    return `${FIREBASE_URL.replace(/\/+$/g, "")}/${firebasePath(path)}.json`;
}

async function fbRequest(path, options) {
    try {
        const response = await fetch(firebaseUrl(path), options);
        if (!response.ok) {
            throw new Error(`Firebase request failed: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.warn("Firebase request failed", error);
        return null;
    }
}

/**
 * GET data at path.
 * @param {string} path - Firebase path without the .json suffix
 * @returns {Promise<object|null>} Parsed JSON or null on failure
 */
export async function fbGet(path) {
    return fbRequest(path);
}

/**
 * PUT (overwrite) data at path.
 * @param {string} path - Firebase path without the .json suffix
 * @param {unknown} data - Data to write
 * @returns {Promise<object|null>} Written data or null on failure
 */
export async function fbPut(path, data) {
    return fbRequest(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

/**
 * PATCH (merge) data at path.
 * @param {string} path - Firebase path without the .json suffix
 * @param {unknown} data - Data to merge
 * @returns {Promise<object|null>} Merged data or null on failure
 */
export async function fbPatch(path, data) {
    return fbRequest(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

/**
 * POST (push) data at path.
 * @param {string} path - Firebase path without the .json suffix
 * @param {unknown} data - Data to push
 * @returns {Promise<{name: string}|null>} Generated key wrapper or null on failure
 */
export async function fbPost(path, data) {
    return fbRequest(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}
