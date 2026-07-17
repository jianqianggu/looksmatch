import React from "react";

function initials(name) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export function AvatarFallback({ profile, size = "100%", fontSize = 28 }) {
    return (
        <div
            style={{
                width: size,
                height: size,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${profile.avatarColor || "#FF5C7A"}, #1A1C23)`,
                color: "#F2F1ED",
                fontWeight: 800,
                fontSize,
                letterSpacing: "0.04em",
            }}
        >
            {initials(profile.name)}
        </div>
    );
}

/**
 * PhotoCard - Displays a candidate's photo, name, age, and tagline
 */
export function PhotoCard({ profile, large = false }) {
    return (
        <div style={{ flex: 1 }}>
            <div
                style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#1A1C23",
                }}
            >
                {profile.photo ? (
                    <img
                        src={profile.photo}
                        alt={profile.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                ) : (
                    <AvatarFallback profile={profile} />
                )}
            </div>
            <p style={{ fontWeight: 600, margin: "10px 0 0", fontSize: large ? 18 : 15 }}>
                {profile.name}, {profile.age}
            </p>
            <p style={{ color: "#8A8D99", fontSize: large ? 13 : 12, margin: "2px 0 0" }}>{profile.tagline}</p>
        </div>
    );
}
