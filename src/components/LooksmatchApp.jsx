import React, { useState, useCallback, useRef } from "react";
import { Scale } from "lucide-react";

import { LockedState } from "./LockedState";
import { ProfileTab } from "./ProfileTab";
import { VotingPhase } from "./VotingPhase";
import { SwipePhase } from "./SwipePhase";

import { PROFILES, DAILY_QUOTA, YOU_ID } from "../constants/profiles";
import { buildShuffledVotingQueue, buildShuffledSwipeQueue } from "../utils/queueBuilder";
import { pairKey, trueVerdict } from "../utils/verdictEngine";
import { globalStyles } from "../styles/globalStyles";
import { tabBtnStyle } from "../styles/buttonStyles";

/**
 * Main Looksmatch Application
 *
 * Three-phase workflow:
 * 1. Profile: User submits their own profile
 * 2. Vote: User performs jury duty by rating candidate pairs
 * 3. Match: User swipes on candidates, sees results based on jury verdict
 */
export default function LooksmatchApp() {
    // Tab state
    const [tab, setTab] = useState("profile"); // 'profile' | 'vote' | 'match'

    // Profile state
    const [profile, setProfile] = useState({ name: "", age: "", tagline: "", photo: null });
    const [profileSubmitted, setProfileSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Queue state
    const [votingQueue] = useState(() => buildShuffledVotingQueue(PROFILES));
    const [swipeQueue] = useState(() => buildShuffledSwipeQueue(PROFILES));
    const [resolved, setResolved] = useState({}); // pairKey -> 'match' | 'no-match'

    // Voting phase state
    const [votesToday, setVotesToday] = useState(0);
    const [votingCursor, setVotingCursor] = useState(0);
    const [voteFlash, setVoteFlash] = useState(false);
    const [voteHistory, setVoteHistory] = useState([]);

    // Swiping phase state
    const [swipeCursor, setSwipeCursor] = useState(0);
    const [reveal, setReveal] = useState(null); // { verdict, candidate, liked }
    const [matches, setMatches] = useState([]);
    const [swipeHistory, setSwipeHistory] = useState([]);
    const revealTimer = useRef(null);

    // Derived state
    const swipingUnlocked = profileSubmitted && votesToday >= DAILY_QUOTA;
    const swipeDone = swipeCursor >= swipeQueue.length;

    // ---- PROFILE PHASE ----

    const submitProfile = () => {
        if (!profile.name.trim() || !profile.age || !profile.photo) {
            setSubmitError("Add a name, age, and photo before submitting.");
            return;
        }
        setSubmitError("");
        setProfileSubmitted(true);
        setTab("vote");
    };

    // ---- VOTING PHASE ----

    const currentVotingPair = votingQueue[votingCursor];

    const castVote = useCallback(
        (a, b) => {
            const key = pairKey(a.id, b.id);
            const hadPrevious = key in resolved;
            const prevValue = resolved[key];

            setResolved((prev) => (key in prev ? prev : { ...prev, [key]: trueVerdict(key) }));
            setVoteFlash(true);
            setTimeout(() => setVoteFlash(false), 220);

            setVoteHistory((h) => [...h, { key, cursorBefore: votingCursor, hadPrevious, prevValue }]);
            setVotesToday((v) => v + 1);
            setVotingCursor((c) => c + 1);
        },
        [votingCursor, resolved]
    );

    const undoVote = useCallback(() => {
        setVoteHistory((h) => {
            if (h.length === 0) return h;
            const last = h[h.length - 1];
            setVotingCursor(last.cursorBefore);
            setVotesToday((v) => Math.max(0, v - 1));
            setResolved((prev) => {
                const copy = { ...prev };
                if (last.hadPrevious) copy[last.key] = last.prevValue;
                else delete copy[last.key];
                return copy;
            });
            return h.slice(0, -1);
        });
    }, []);

    // ---- SWIPING PHASE ----

    const currentCandidate = swipeQueue[swipeCursor];

    const swipe = useCallback(
        (liked) => {
            if (!currentCandidate || reveal) return;
            const key = pairKey(YOU_ID, currentCandidate.id);
            const verdict = resolved[key] || trueVerdict(key);
            setResolved((prev) => ({ ...prev, [key]: verdict }));
            setReveal({ verdict, candidate: currentCandidate, liked });

            const addedMatch = verdict === "match";
            if (addedMatch) setMatches((prev) => [...prev, currentCandidate]);

            setSwipeHistory((h) => [
                ...h,
                { candidate: currentCandidate, cursorBefore: swipeCursor, verdict, liked, addedMatch },
            ]);

            revealTimer.current = setTimeout(() => {
                setReveal(null);
                setSwipeCursor((c) => c + 1);
            }, 1500);
        },
        [currentCandidate, reveal, resolved, swipeCursor]
    );

    const undoSwipe = useCallback(() => {
        if (reveal) return;
        setSwipeHistory((h) => {
            if (h.length === 0) return h;
            const last = h[h.length - 1];
            if (revealTimer.current) clearTimeout(revealTimer.current);
            setSwipeCursor(last.cursorBefore);
            if (last.addedMatch) {
                setMatches((prev) => {
                    const idx = prev.map((m) => m.id).lastIndexOf(last.candidate.id);
                    if (idx === -1) return prev;
                    return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
                });
            }
            return h.slice(0, -1);
        });
    }, [reveal]);

    // ---- RENDER ----

    return (
        <div
            style={{
                background: "#0E0F13",
                color: "#F2F1ED",
                minHeight: "100vh",
                fontFamily: "'Inter', sans-serif",
                padding: "24px 16px 40px",
            }}
        >
            <style>{globalStyles}</style>

            <div style={{ maxWidth: 480, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <Scale size={20} color="#F2B84B" />
                    <span className="mono" style={{ fontSize: 12, color: "#8A8D99", letterSpacing: "0.08em" }}>
                        LOOKSMATCH
                    </span>
                </div>

                {/* Tab bar */}
                <div style={{ display: "flex", gap: 4, marginBottom: 22, borderBottom: "1px solid #2A2D37" }}>
                    <button
                        className="tab-btn"
                        onClick={() => setTab("profile")}
                        style={tabBtnStyle(tab === "profile")}
                    >
                        Profile
                    </button>
                    <button
                        className="tab-btn"
                        onClick={() => profileSubmitted && setTab("vote")}
                        disabled={!profileSubmitted}
                        style={tabBtnStyle(tab === "vote")}
                    >
                        Vote
                    </button>
                    <button
                        className="tab-btn"
                        onClick={() => profileSubmitted && setTab("match")}
                        disabled={!profileSubmitted}
                        style={tabBtnStyle(tab === "match")}
                    >
                        Match
                    </button>
                </div>

                {/* Tab content */}
                {tab === "profile" && (
                    <ProfileTab
                        profile={profile}
                        setProfile={setProfile}
                        profileSubmitted={profileSubmitted}
                        submitError={submitError}
                        onSubmit={submitProfile}
                    />
                )}

                {tab === "vote" &&
                    (profileSubmitted ? (
                        <VotingPhase
                            pair={currentVotingPair}
                            votesToday={votesToday}
                            quota={DAILY_QUOTA}
                            flash={voteFlash}
                            onVote={castVote}
                            onUndo={undoVote}
                            canUndo={voteHistory.length > 0}
                            onGoToMatch={() => setTab("match")}
                        />
                    ) : (
                        <LockedState text="Submit your profile first to start voting." onGo={() => setTab("profile")} />
                    ))}

                {tab === "match" &&
                    (!profileSubmitted ? (
                        <LockedState text="Submit your profile first." onGo={() => setTab("profile")} />
                    ) : !swipingUnlocked ? (
                        <LockedState
                            text={`Vote on ${DAILY_QUOTA - votesToday} more pair${DAILY_QUOTA - votesToday === 1 ? "" : "s"} to unlock swiping.`}
                            onGo={() => setTab("vote")}
                            goLabel="Go vote"
                        />
                    ) : (
                        <SwipePhase
                            candidate={currentCandidate}
                            reveal={reveal}
                            onSwipe={swipe}
                            onUndo={undoSwipe}
                            canUndo={swipeHistory.length > 0 && !reveal}
                            matches={matches}
                            done={swipeDone}
                        />
                    ))}
            </div>
        </div>
    );
}
