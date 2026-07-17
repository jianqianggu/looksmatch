const PHOTO_UPLOAD_LEDGER_KEY = "looksmatch_uploaded_photo_hashes";
const MAX_LEDGER_ENTRIES = 12;

export function photoUploadHash(photo) {
    let hash = 2166136261;
    const value = String(photo || "");

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16).padStart(8, "0");
}

function storageAvailable() {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readLedger() {
    if (!storageAvailable()) return [];

    try {
        const parsed = JSON.parse(window.localStorage.getItem(PHOTO_UPLOAD_LEDGER_KEY) || "[]");
        return Array.isArray(parsed) ? parsed.filter((hash) => typeof hash === "string") : [];
    } catch (error) {
        console.warn("Photo upload ledger reset", error);
        return [];
    }
}

function writeLedger(hashes) {
    if (!storageAvailable()) return;

    try {
        window.localStorage.setItem(PHOTO_UPLOAD_LEDGER_KEY, JSON.stringify(hashes.slice(0, MAX_LEDGER_ENTRIES)));
    } catch (error) {
        console.warn("Photo upload ledger could not be saved", error);
    }
}

export function hasUploadedPhoto(photo) {
    const hash = photoUploadHash(photo);
    return readLedger().includes(hash);
}

export function recordUploadedPhoto(photo) {
    const hash = photoUploadHash(photo);
    const hashes = readLedger().filter((entry) => entry !== hash);
    writeLedger([hash, ...hashes]);
}
