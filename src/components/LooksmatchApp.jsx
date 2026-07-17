import React, { useState, useCallback, useEffect, useRef } from "react";
import { Scale } from "lucide-react";

import { LockedState } from "./LockedState";
import { ProfileTab } from "./ProfileTab";
import { VotingPhase } from "./VotingPhase";
import { SwipePhase } from "./SwipePhase";

import { PROFILES, DAILY_QUOTA, YOU_ID } from "../constants/profiles";
import { buildShuffledVotingQueue, buildShuffledSwipeQueue } from "../utils/queueBuilder";
import { computeVerdict, pairKey } from "../utils/verdictEngine";
import { fbGet, fbPost, fbPut } from "../utils/firebase";
import { canWrite, recordWrite } from "../utils/rateLimiter";
import { globalStyles } from "../styles/globalStyles";
import { tabBtnStyle } from "../styles/buttonStyles";

const VOTE_CHOICES = ["sameLeague", "aOverB", "bOverA"];

function createEmptyVoteTally() {
    return { sameLeague: 0, aOverB: 0, bOverA: 0, totalVotes: 0, lastUpdated: 0 };
}

function normalizeVoteTally(data) {
    const empty = createEmptyVoteTally();
    if (!data || typeof data !== "object") return empty;

    return {
        sameLeague: Number(data.sameLeague) || 0,
        aOverB: Number(data.aOverB) || 0,
        bOverA: Number(data.bOverA) || 0,
        totalVotes: Number(data.totalVotes) || 0,
        lastUpdated: Number(data.lastUpdated) || 0,
    };
}

function incrementVoteTally(data, choice) {
    const tally = normalizeVoteTally(data);
    return {
        ...tally,
        [choice]: tally[choice] + 1,
        totalVotes: tally.totalVotes + 1,
        lastUpdated: Date.now(),
    };
}

function decrementVoteTally(data, choice) {
    const tally = normalizeVoteTally(data);
    const nextChoiceCount = Math.max(0, tally[choice] - 1);
    const decrement = tally[choice] > nextChoiceCount ? 1 : 0;

    return {
        ...tally,
        [choice]: nextChoiceCount,
        totalVotes: Math.max(0, tally.totalVotes - decrement),
        lastUpdated: Date.now(),
    };
}

async function syncVoteToFirebase(key, choice) {
    if (!VOTE_CHOICES.includes(choice) || !canWrite()) return;

    const data = incrementVoteTally(await fbGet(`votes/${key}`), choice);
    const result = await fbPut(`votes/${key}`, data);
    if (result) recordWrite();
}

async function syncVoteUndoToFirebase(key, choice) {
    if (!VOTE_CHOICES.includes(choice) || !canWrite()) return;

    const data = decrementVoteTally(await fbGet(`votes/${key}`), choice);
    const result = await fbPut(`votes/${key}`, data);
    if (result) recordWrite();
}

async function uploadPhotoToFirebase(photo) {
    if (!photo || !canWrite()) return null;

    const result = await fbPost("photos", {
        data: photo,
        createdAt: Date.now(),
    });
    if (result) recordWrite();
    return result;
}

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
    const [photoUploadStatus, setPhotoUploadStatus] = useState("");
    const lastUploadedPhoto = useRef(null);

    // Queue state
    const [votingQueue] = useState(() => buildShuffledVotingQueue(PROFILES));
    const [swipeQueue] = useState(() => buildShuffledSwipeQueue(PROFILES));
    const [resolved, setResolved] = useState({}); // pairKey -> 'match' | 'no-match'
    const [voteTallies, setVoteTallies] = useState({}); // pairKey -> Firebase vote tally

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
        if (lastUploadedPhoto.current === profile.photo) {
            setPhotoUploadStatus("Photo already queued; skipping duplicate upload.");
        } else {
            setPhotoUploadStatus("Uploading compressed photo to Firebase for static sync...");
            uploadPhotoToFirebase(profile.photo).then((result) => {
                if (result) lastUploadedPhoto.current = profile.photo;
                setPhotoUploadStatus(
                    result
                        ? "Photo received. GitHub Actions can mirror it into static Pages assets."
                        : "Photo upload skipped; profile still works locally."
                );
            });
        }
        setProfileSubmitted(true);
        setTab("vote");
    };

    // ---- VOTING PHASE ----

    const currentVotingPair = votingQueue[votingCursor];
    const currentVotingKey = currentVotingPair ? pairKey(currentVotingPair[0].id, currentVotingPair[1].id) : null;

    useEffect(() => {
        if (!currentVotingKey) return undefined;

        let cancelled = false;
        fbGet(`votes/${currentVotingKey}`).then((data) => {
            if (!cancelled && data) {
                setVoteTallies((prev) => ({ ...prev, [currentVotingKey]: data }));
            }
        });

        return () => {
            cancelled = true;
        };
    }, [currentVotingKey]);

    const castVote = useCallback(
        (a, b, choice) => {
            const key = pairKey(a.id, b.id);
            const hadPrevious = key in resolved;
            const prevValue = resolved[key];
            const optimisticTally = VOTE_CHOICES.includes(choice)
                ? incrementVoteTally(voteTallies[key], choice)
                : null;
            setVoteTallies((prev) => {
                if (!VOTE_CHOICES.includes(choice)) return prev;

                return { ...prev, [key]: incrementVoteTally(prev[key], choice) };
            });

            syncVoteToFirebase(key, choice);
            setResolved((prev) =>
                key in prev ? prev : { ...prev, [key]: computeVerdict(optimisticTally, key) }
            );
            setVoteFlash(true);
            setTimeout(() => setVoteFlash(false), 220);

            setVoteHistory((h) => [...h, { key, cursorBefore: votingCursor, hadPrevious, prevValue, choice }]);
            setVotesToday((v) => v + 1);
            setVotingCursor((c) => c + 1);
        },
        [votingCursor, resolved, voteTallies]
    );

    const undoVote = useCallback(() => {
        const last = voteHistory[voteHistory.length - 1];
        if (!last) return;

        setVotingCursor(last.cursorBefore);
        setVotesToday((v) => Math.max(0, v - 1));
        setResolved((prev) => {
            const copy = { ...prev };
            if (last.hadPrevious) copy[last.key] = last.prevValue;
            else delete copy[last.key];
            return copy;
        });
        setVoteTallies((prev) => {
            if (!VOTE_CHOICES.includes(last.choice)) return prev;
            return { ...prev, [last.key]: decrementVoteTally(prev[last.key], last.choice) };
        });
        syncVoteUndoToFirebase(last.key, last.choice);
        setVoteHistory((h) => h.slice(0, -1));
    }, [voteHistory]);

    // ---- SWIPING PHASE ----

    const currentCandidate = swipeQueue[swipeCursor];
    const currentSwipeKey = currentCandidate ? pairKey(YOU_ID, currentCandidate.id) : null;

    useEffect(() => {
        if (!currentSwipeKey) return undefined;

        let cancelled = false;
        fbGet(`votes/${currentSwipeKey}`).then((data) => {
            if (!cancelled && data) {
                setVoteTallies((prev) => ({ ...prev, [currentSwipeKey]: data }));
            }
        });

        return () => {
            cancelled = true;
        };
    }, [currentSwipeKey]);

    const swipe = useCallback(
        (liked) => {
            if (!currentCandidate || reveal) return;
            const key = pairKey(YOU_ID, currentCandidate.id);
            const verdict = resolved[key] || computeVerdict(voteTallies[key] || null, key);
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
        [currentCandidate, reveal, resolved, swipeCursor, voteTallies]
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
                        photoUploadStatus={photoUploadStatus}
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
                            tallies={voteTallies}
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
