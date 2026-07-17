import React from "react";
import { Sparkles, Undo2 } from "lucide-react";
import { PhotoCard } from "./PhotoCard";
import { voteBtnStyle, undoBtnStyle } from "../styles/buttonStyles";
import { pairKey } from "../utils/verdictEngine";

/**
 * VotingPhase - Displays a pair of candidates and voting buttons
 */
export function VotingPhase({ pair, votesToday, quota, flash, tallies, onVote, onUndo, canUndo, onGoToMatch }) {
    if (!pair || votesToday >= quota) {
        return (
            <div
                style={{
                    background: "#1A1C23",
                    border: "1px solid #2A2D37",
                    borderRadius: 16,
                    padding: 32,
                    textAlign: "center",
                }}
            >
                <Sparkles size={26} color="#F2B84B" style={{ marginBottom: 10 }} />
                <p className="display" style={{ fontSize: 30, margin: 0 }}>
                    Jury duty done
                </p>
                <p style={{ color: "#8A8D99", fontSize: 14, margin: "8px 0 20px" }}>
                    Head to the Match tab to see who you're looksmatched with.
                </p>
                <button
                    onClick={onGoToMatch}
                    className="vote-btn"
                    style={{ ...voteBtnStyle("#FF5C7A"), padding: "10px 20px" }}
                >
                    Go to Match
                </button>
            </div>
        );
    }

    const [a, b] = pair;
    const currentPairKey = pairKey(a.id, b.id);
    const pairTally = tallies?.[currentPairKey];
    return (
        <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <h1 className="display" style={{ fontSize: 34, lineHeight: 1, margin: "0 0 4px" }}>
                    Same league or not?
                </h1>
                <button
                    className="vote-btn"
                    onClick={onUndo}
                    disabled={!canUndo}
                    style={{ ...undoBtnStyle, display: "flex", alignItems: "center", gap: 4 }}
                >
                    <Undo2 size={13} /> undo
                </button>
            </div>
            <p style={{ color: "#8A8D99", fontSize: 13, margin: "0 0 18px" }}>
                Jury duty: {votesToday}/{quota} today
            </p>

            <div className="card-flash" style={{ opacity: flash ? 0.4 : 1, display: "flex", gap: 10 }}>
                <PhotoCard profile={a} />
                <PhotoCard profile={b} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <button className="vote-btn" onClick={() => onVote(a, b, "sameLeague")} style={voteBtnStyle("#FF5C7A")}>
                    Looksmatch — same league
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        className="vote-btn"
                        onClick={() => onVote(a, b, "aOverB")}
                        style={{ ...voteBtnStyle("#4FD1C5"), flex: 1 }}
                    >
                        {a.name} is out of {b.name}'s league
                    </button>
                    <button
                        className="vote-btn"
                        onClick={() => onVote(a, b, "bOverA")}
                        style={{ ...voteBtnStyle("#F2B84B"), flex: 1 }}
                    >
                        {b.name} is out of {a.name}'s league
                    </button>
                </div>
            </div>

            {pairTally && (
                <p style={{ fontSize: 11, color: "#565A66", textAlign: "center", marginTop: 8 }}>
                    {pairTally.totalVotes} session vote{pairTally.totalVotes === 1 ? "" : "s"} on this pair
                </p>
            )}

            <p style={{ fontSize: 11, color: "#565A66", textAlign: "center", marginTop: 14 }}>
                Firebase is only used for photo intake; vote tallies stay in this tab for the prototype.
            </p>
        </>
    );
}
