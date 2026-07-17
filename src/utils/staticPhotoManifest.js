const STATIC_PHOTO_LIMIT = 6;
const MAX_STATIC_PHOTO_BYTES = 350000;

function staticAssetUrl(src) {
    const base = import.meta.env.BASE_URL || "/";
    return `${base}${String(src).replace(/^\/+/, "")}`;
}

function normalizePhoto(photo) {
    if (!photo || typeof photo !== "object") return null;
    if (typeof photo.id !== "string" || typeof photo.src !== "string") return null;
    if (!photo.src.startsWith("uploads/")) return null;
    if (Number(photo.bytes) > MAX_STATIC_PHOTO_BYTES) return null;

    return {
        id: photo.id,
        src: staticAssetUrl(photo.src),
        createdAt: Number(photo.createdAt) || 0,
        bytes: Number(photo.bytes) || 0,
    };
}

export async function fetchStaticPhotos(limit = STATIC_PHOTO_LIMIT) {
    try {
        const response = await fetch(staticAssetUrl("uploads/photos-manifest.json"));
        if (!response.ok) return [];

        const manifest = await response.json();
        const photos = Array.isArray(manifest.photos) ? manifest.photos : [];
        return photos.map(normalizePhoto).filter(Boolean).slice(0, limit);
    } catch (error) {
        console.warn("Static photo manifest unavailable", error);
        return [];
    }
}
