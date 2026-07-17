/**
 * Firebase Realtime Database schema:
 *
 * /photos/{photoId}
 *   data: string       // compressed data URL for GitHub Actions mirroring
 *   createdAt: number
 *
 * Security rules to set in Firebase Console:
 * {
 *   "rules": {
 *     "photos": {
 *       ".read": true,
 *       "$photoId": {
 *         ".write": "newData.exists() && newData.hasChildren(['data','createdAt'])",
 *         ".validate": "newData.child('data').isString() && newData.child('data').val().length <= 500000 && newData.child('createdAt').isNumber()",
 *         "data": {
 *           ".validate": "newData.isString() && newData.val().length <= 500000"
 *         },
 *         "createdAt": {
 *           ".validate": "newData.isNumber()"
 *         },
 *         "$other": {
 *           ".validate": false
 *         }
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
