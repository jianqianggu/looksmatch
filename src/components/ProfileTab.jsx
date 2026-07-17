import React, { useRef, useState } from "react";
import { Camera, User, Sparkles } from "lucide-react";
import { labelStyle, voteBtnStyle } from "../styles/buttonStyles";


const PHOTO_MAX_EDGE = 480;
const PHOTO_QUALITY = 0.72;
const PHOTO_MAX_SOURCE_BYTES = 6 * 1024 * 1024;

function resizeProfilePhoto(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(image.width, image.height));
            const width = Math.max(1, Math.round(image.width * scale));
            const height = Math.max(1, Math.round(image.height * scale));
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (!context) {
                reject(new Error("Could not prepare profile photo"));
                return;
            }

            canvas.width = width;
            canvas.height = height;
            context.drawImage(image, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", PHOTO_QUALITY));
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not read profile photo"));
        };

        image.src = objectUrl;
    });
}
/**
 * ProfileTab - Allows user to set their name, age, tagline, and photo
 */
export function ProfileTab({ profile, setProfile, profileSubmitted, submitError, photoUploadStatus, syncedPhotos = [], onSubmit }) {
    const fileInputRef = useRef(null);
    const [photoError, setPhotoError] = useState("");

    const handlePhoto = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;

        if (file.size > PHOTO_MAX_SOURCE_BYTES) {
            setPhotoError("Choose a photo under 6MB so the prototype stays light.");
            return;
        }

        try {
            const photo = await resizeProfilePhoto(file);
            setProfile((p) => ({ ...p, photo }));
            setPhotoError("");
        } catch (error) {
            console.warn("Profile photo resize failed", error);
            setPhotoError("That photo could not be prepared. Try another one.");
        }
    };

    return (
        <>
            <h1 className="display" style={{ fontSize: 34, lineHeight: 1, margin: "0 0 4px" }}>
                Your profile
            </h1>
            <p style={{ color: "#8A8D99", fontSize: 13, margin: "0 0 20px" }}>This is what the jury will vote on.</p>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
            <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#1A1C23",
                    border: profile.photo ? "1px solid #2A2D37" : "2px dashed #2A2D37",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative",
                }}
            >
                {profile.photo ? (
                    <>
                        <img
                            src={profile.photo}
                            alt="Your profile"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                bottom: 10,
                                right: 10,
                                background: "rgba(14,15,19,0.75)",
                                borderRadius: 8,
                                padding: "6px 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 12,
                                color: "#F2F1ED",
                            }}
                        >
                            <Camera size={13} /> change photo
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: "center", color: "#565A66" }}>
                        <User size={32} style={{ marginBottom: 8 }} />
                        <p style={{ fontSize: 13, margin: 0 }}>
                            <Camera size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                            Tap to upload your photo
                        </p>
                    </div>
                )}
            </div>

            {photoError && <p style={{ fontSize: 12, color: "#FF5C7A", marginTop: 8 }}>{photoError}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
                <div className="field">
                    <label style={labelStyle}>Name</label>
                    <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        placeholder="How you'll appear to others"
                    />
                </div>
                <div className="field">
                    <label style={labelStyle}>Age</label>
                    <input
                        type="number"
                        min="18"
                        value={profile.age}
                        onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                        placeholder="27"
                    />
                </div>
                <div className="field">
                    <label style={labelStyle}>Tagline</label>
                    <textarea
                        rows={2}
                        value={profile.tagline}
                        onChange={(e) => setProfile((p) => ({ ...p, tagline: e.target.value }))}
                        placeholder="One line about you"
                    />
                </div>
            </div>

            {(submitError || photoUploadStatus) && (
                <p style={{ fontSize: 12, color: submitError ? "#FF5C7A" : "#8A8D99", marginTop: 14 }}>
                    {submitError || photoUploadStatus}
                </p>
            )}

            <button
                onClick={onSubmit}
                className="vote-btn"
                style={{ ...voteBtnStyle("#FF5C7A"), width: "100%", marginTop: 16, padding: "12px 14px" }}
            >
                {profileSubmitted ? "Update profile" : "Submit profile"}
            </button>

            {profileSubmitted && (
                <p
                    style={{
                        fontSize: 12,
                        color: "#4FD1C5",
                        marginTop: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <Sparkles size={13} /> In the voting pool. Edits here update it live.
                </p>
            )}

            {profileSubmitted && syncedPhotos.length > 0 && (
                <div
                    style={{
                        marginTop: 18,
                        background: "#1A1C23",
                        border: "1px solid #2A2D37",
                        borderRadius: 12,
                        padding: 12,
                    }}
                >
                    <p className="mono" style={{ fontSize: 11, color: "#8A8D99", margin: "0 0 10px" }}>
                        STATIC PHOTO MIRROR
                    </p>
                    <div style={{ display: "flex", gap: 8, overflow: "hidden" }}>
                        {syncedPhotos.map((photo) => (
                            <img
                                key={photo.id}
                                src={photo.src}
                                alt=""
                                loading="lazy"
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 10,
                                    objectFit: "cover",
                                    border: "1px solid #2A2D37",
                                }}
                            />
                        ))}
                    </div>
                    <p style={{ fontSize: 11, color: "#565A66", margin: "10px 0 0" }}>
                        Showing a capped sample mirrored into GitHub Pages, not live-loaded from Firebase.
                    </p>
                </div>
            )}
        </>
    );
}
