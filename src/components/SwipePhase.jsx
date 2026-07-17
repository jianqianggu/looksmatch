import React, { useState } from "react";
import { Heart, X, Undo2, ArrowRight, RotateCcw } from "lucide-react";
import { AvatarFallback, PhotoCard } from "./PhotoCard";
import { circleBtnStyle, undoBtnStyle } from "../styles/buttonStyles";

/**
 * SwipePhase - Displays a candidate for swiping and shows matches
 */
export function SwipePhase({ candidate, reveal, onSwipe, onUndo, onReset, canUndo, matches, done }) {
    const [activeChat, setActiveChat] = useState(null);
    return (
        <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <p style={{ color: "#8A8D99", fontSize: 13, margin: 0 }}>
                    {matches.length} looksmatch{matches.length === 1 ? "" : "es"} so far
                </p>
                <button
                    className="vote-btn"
                    onClick={onUndo}
                    disabled={!canUndo}
                    style={{ ...undoBtnStyle, display: "flex", alignItems: "center", gap: 4 }}
                >
                    <Undo2 size={13} /> undo
                </button>
            </div>

            {!done && candidate && (
                <div style={{ position: "relative" }}>
                    <PhotoCard profile={candidate} large />

                    {reveal && (
                        <div
                            className="stamp-anim"
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(14,15,19,0.82)",
                                borderRadius: 14,
                            }}
                        >
                            <div
                                style={{
                                    border: `4px solid ${reveal.verdict === "match" ? "#FF5C7A" : "#4FD1C5"}`,
                                    color: reveal.verdict === "match" ? "#FF5C7A" : "#4FD1C5",
                                    borderRadius: 10,
                                    padding: "14px 22px",
                                    transform: "rotate(-6deg)",
                                    textAlign: "center",
                                }}
                            >
                                <span className="display" style={{ fontSize: 26, display: "block" }}>
                                    {reveal.verdict === "match" ? "LOOKSMATCHED ?" : "NOT LOOKSMATCHED"}
                                </span>
                                <span className="mono" style={{ fontSize: 11, opacity: 0.85 }}>
                                    {reveal.verdict === "match" ? "chat unlocked" : "no chat � different leagues"}
                                </span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 18 }}>
                        <button
                            className="icon-btn"
                            onClick={() => onSwipe(false)}
                            disabled={!!reveal}
                            style={circleBtnStyle("#4FD1C5")}
                            aria-label="Pass"
                        >
                            <X size={26} />
                        </button>
                        <button
                            className="icon-btn"
                            onClick={() => onSwipe(true)}
                            disabled={!!reveal}
                            style={circleBtnStyle("#FF5C7A")}
                            aria-label="Like"
                        >
                            <Heart size={26} />
                        </button>
                    </div>
                    <p style={{ fontSize: 11, color: "#565A66", textAlign: "center", marginTop: 12 }}>
                        Liking doesn't guarantee a match � only the jury's verdict unlocks chat.
                    </p>
                </div>
            )}

            {done && (
                <div
                    style={{
                        background: "#1A1C23",
                        border: "1px solid #2A2D37",
                        borderRadius: 16,
                        padding: 28,
                        textAlign: "center",
                    }}
                >
                    <p className="display" style={{ fontSize: 26, margin: 0 }}>
                        That's everyone for now
                    </p>
                    <p style={{ color: "#8A8D99", fontSize: 13, marginTop: 6 }}>
                        New candidates would keep entering the deck as more people join and vote.
                    </p>
                </div>
            )}

            {matches.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <p
                        className="mono"
                        style={{ fontSize: 12, color: "#8A8D99", marginBottom: 10, letterSpacing: "0.06em" }}
                    >
                        YOUR LOOKSMATCHES
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {matches.map((m, i) => (
                            <div
                                key={`${m.id}-${i}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background: "#1A1C23",
                                    border: "1px solid #2A2D37",
                                    borderRadius: 10,
                                    padding: "8px 12px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden" }}>
                                        {m.photo ? (
                                            <img
                                                src={m.photo}
                                                alt={m.name}
                                                loading="lazy"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <AvatarFallback profile={m} fontSize={12} />
                                        )}
                                    </div>
                                    <span style={{ fontSize: 14 }}>{m.name}</span>
                                </div>
                                <button
                                    onClick={() => setActiveChat(m)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        background: "transparent",
                                        border: "1px solid #FF5C7A",
                                        color: "#FF5C7A",
                                        borderRadius: 8,
                                        padding: "6px 10px",
                                        fontSize: 12,
                                        cursor: "pointer",
                                    }}
                                >
                                    Chat <ArrowRight size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeChat && (
                <div
                    style={{
                        marginTop: 16,
                        background: "#1A1C23",
                        border: "1px solid #2A2D37",
                        borderRadius: 12,
                        padding: 14,
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div>
                            <p className="mono" style={{ fontSize: 11, color: "#8A8D99", margin: 0 }}>
                                CHAT PREVIEW
                            </p>
                            <p style={{ fontWeight: 700, margin: "4px 0 0" }}>{activeChat.name}</p>
                        </div>
                        <button
                            onClick={() => setActiveChat(null)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#8A8D99",
                                cursor: "pointer",
                                fontSize: 12,
                            }}
                        >
                            close
                        </button>
                    </div>
                    <p style={{ color: "#F2F1ED", fontSize: 13, margin: "12px 0 0" }}>
                        Chat unlock is stubbed for the prototype. No messages are sent or stored yet.
                    </p>
                    <div
                        style={{
                            marginTop: 10,
                            border: "1px solid #2A2D37",
                            borderRadius: 10,
                            padding: "9px 10px",
                            color: "#565A66",
                            fontSize: 12,
                        }}
                    >
                        Message composer placeholder — disabled until chat storage is added.
                    </div>
                </div>
            )}

            <button
                onClick={onReset}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "transparent",
                    border: "none",
                    color: "#565A66",
                    fontSize: 12,
                    marginTop: 22,
                    cursor: "pointer",
                }}
            >
                <RotateCcw size={12} /> reset demo
            </button>
        </>
    );
}
