import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const FIREBASE_URL = process.env.VITE_FIREBASE_URL;
const PHOTO_SYNC_LIMIT = Number(process.env.PHOTO_SYNC_LIMIT || 12);
const PHOTO_SYNC_MAX_BYTES = Number(process.env.PHOTO_SYNC_MAX_BYTES || 350000);
const PHOTO_MANIFEST_LIMIT = Math.max(1, Number(process.env.PHOTO_MANIFEST_LIMIT || 60));
const OUTPUT_DIR = path.resolve("public/uploads");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "photos-manifest.json");
const DATA_URL_PATTERN = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/;

function firebaseUrl(pathname) {
    return `${FIREBASE_URL.replace(/\/+$/g, "")}/${pathname}.json`;
}

function extensionFor(mimeType) {
    return mimeType === "jpeg" || mimeType === "jpg" ? "jpg" : mimeType;
}

async function loadManifest() {
    if (!existsSync(MANIFEST_PATH)) {
        return { photos: [] };
    }

    const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
    return { photos: Array.isArray(manifest.photos) ? manifest.photos : [] };
}

async function removeMirroredPhoto(photo) {
    if (!photo?.src?.startsWith("uploads/")) return;

    const filepath = path.resolve("public", photo.src);
    if (!filepath.startsWith(OUTPUT_DIR) || !existsSync(filepath)) return;

    await unlink(filepath);
}

async function fetchPhotoInbox() {
    if (!FIREBASE_URL) {
        throw new Error("VITE_FIREBASE_URL is required to sync Firebase photos");
    }

    const query = new URLSearchParams({
        orderBy: '"$key"',
        limitToLast: String(PHOTO_SYNC_LIMIT),
    });
    const response = await fetch(`${firebaseUrl("photos")}?${query.toString()}`);
    if (!response.ok) {
        throw new Error(`Firebase photo sync failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) || {};
}

async function syncPhotos() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    const manifest = await loadManifest();
    const knownIds = new Set(manifest.photos.map((photo) => photo.id));
    const inbox = await fetchPhotoInbox();
    const newPhotos = [];

    for (const [id, photo] of Object.entries(inbox)) {
        if (knownIds.has(id) || !photo?.data || typeof photo.data !== "string") continue;

        const match = photo.data.match(DATA_URL_PATTERN);
        if (!match) continue;

        const [, mimeType, encoded] = match;
        const bytes = Buffer.from(encoded, "base64");
        if (bytes.byteLength > PHOTO_SYNC_MAX_BYTES) continue;

        const extension = extensionFor(mimeType);
        const filename = `${id}.${extension}`;
        await writeFile(path.join(OUTPUT_DIR, filename), bytes);

        newPhotos.push({
            id,
            src: `uploads/${filename}`,
            bytes: bytes.byteLength,
            createdAt: Number(photo.createdAt) || 0,
        });
    }

    const allPhotos = [...manifest.photos, ...newPhotos].sort((a, b) => b.createdAt - a.createdAt);
    const photos = allPhotos.slice(0, PHOTO_MANIFEST_LIMIT);
    const removedPhotos = allPhotos.slice(PHOTO_MANIFEST_LIMIT);

    await Promise.all(removedPhotos.map(removeMirroredPhoto));
    await writeFile(
        MANIFEST_PATH,
        `${JSON.stringify({ updatedAt: Date.now(), photos }, null, 2)}\n`
    );

    console.log(
        `Synced ${newPhotos.length} Firebase photo${newPhotos.length === 1 ? "" : "s"}; pruned ${removedPhotos.length}.`
    );
}

await syncPhotos();
