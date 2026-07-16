import React, { useState, useCallback, useRef } from "react";
import { Scale, Sparkles, ArrowRight, RotateCcw, Heart, X, Undo2, Camera, User, Lock } from "lucide-react";

// ---- Mock candidate pool -----------------------------------------------
// Placeholder portraits for prototyping only. Before real users, swap this
// array for your sourced set — each entry just needs { name, age, tagline,
// photo }. See the chat notes on AI-generated vs. public-domain sourcing;
// either way this is the only place that needs to change.
const PROFILES = [
  { id: 1, name: "Mara", age: 27, tagline: "Full-time chaos coordinator.", photo: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: 2, name: "Devon", age: 29, tagline: "Vinyl and cold brew evangelist.", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: 3, name: "Priya", age: 25, tagline: "Professional plant-killer.", photo: "https://randomuser.me/api/portraits/women/68.jpg" },
  { id: 4, name: "Callum", age: 31, tagline: "Loses board games gracefully.", photo: "https://randomuser.me/api/portraits/men/12.jpg" },
  { id: 5, name: "Yuki", age: 28, tagline: "Collects houseplants and bad puns.", photo: "https://randomuser.me/api/portraits/women/21.jpg" },
  { id: 6, name: "Isla", age: 26, tagline: "Terrible at karaoke, does it anyway.", photo: "https://randomuser.me/api/portraits/women/77.jpg" },
  { id: 7, name: "Theo", age: 30, tagline: "Makes a mean bowl of ramen.", photo: "https://randomuser.me/api/portraits/men/5.jpg" },
  { id: 8, name: "Nadia", age: 24, tagline: "Weekend rock climber.", photo: "https://randomuser.me/api/portraits/women/90.jpg" },
  { id: 9, name: "Rafael", age: 33, tagline: "Still figuring out sourdough.", photo: "https://randomuser.me/api/portraits/men/55.jpg" },
  { id: 10, name: "Sana", age: 27, tagline: "Reads two books at once, always.", photo: "https://randomuser.me/api/portraits/women/33.jpg" },
];

const DAILY_QUOTA = 10;
const YOU_ID = 0;

// ---- Deterministic stand-in for crowd consensus ------------------------
// In production, "looksmatched" is decided by aggregating one vote per
// distinct voter per pair (unique constraint on (pair_id, voter_id) in the
// DB) until a threshold/ratio is met. This demo has only one voter (you),
// so it simulates "enough of the crowd has weighed in" by resolving each
// pair against a fixed hidden outcome the moment it's needed.
function seededRandom(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
function trueVerdict(key) {
  return seededRandom(key) < 0.42 ? "match" : "no-match";
}
function pairKey(a, b) {
  return [a, b].sort((x, y) => x - y).join("-");
}

function buildShuffledVotingQueue() {
  // Only pairs among the mock pool — your own profile is never in your own
  // jury queue, since you don't get to vote on pairs involving yourself.
  const pairs = [];
  for (let i = 0; i < PROFILES.length; i++) {
    for (let j = i + 1; j < PROFILES.length; j++) pairs.push([PROFILES[i], PROFILES[j]]);
  }
  for (let i = pairs.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[k]] = [pairs[k], pairs[i]];
  }
  return pairs;
}

function buildShuffledSwipeQueue() {
  const arr = [...PROFILES];
  for (let i = arr.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[k]] = [arr[k], arr[i]];
  }
  return arr;
}

export default function LooksmatchApp() {
  const [tab, setTab] = useState("profile"); // 'profile' | 'vote' | 'match'

  const [profile, setProfile] = useState({ name: "", age: "", tagline: "", photo: null });
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [votingQueue] = useState(buildShuffledVotingQueue);
  const [swipeQueue] = useState(buildShuffledSwipeQueue);
  const [resolved, setResolved] = useState({}); // pairKey -> 'match' | 'no-match' (hidden store)

  const [votesToday, setVotesToday] = useState(0);
  const [votingCursor, setVotingCursor] = useState(0);
  const [voteFlash, setVoteFlash] = useState(false);
  const [voteHistory, setVoteHistory] = useState([]); // stack for undo

  const [swipeCursor, setSwipeCursor] = useState(0);
  const [reveal, setReveal] = useState(null); // { verdict, candidate, liked }
  const [matches, setMatches] = useState([]);
  const [swipeHistory, setSwipeHistory] = useState([]); // stack for undo
  const revealTimer = useRef(null);

  const swipingUnlocked = profileSubmitted && votesToday >= DAILY_QUOTA;
  const swipeDone = swipeCursor >= swipeQueue.length;

  const submitProfile = () => {
    if (!profile.name.trim() || !profile.age || !profile.photo) {
      setSubmitError("Add a name, age, and photo before submitting.");
      return;
    }
    setSubmitError("");
    setProfileSubmitted(true);
    setTab("vote");
  };

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

      setSwipeHistory((h) => [...h, { candidate: currentCandidate, cursorBefore: swipeCursor, verdict, liked, addedMatch }]);

      revealTimer.current = setTimeout(() => {
        setReveal(null);
        setSwipeCursor((c) => c + 1);
      }, 1500);
    },
    [currentCandidate, reveal, resolved, swipeCursor]
  );

  const undoSwipe = useCallback(() => {
    if (reveal) return; // avoid racing the reveal timer
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

  return (
    <div style={{ background: "#0E0F13", color: "#F2F1ED", minHeight: "100%", fontFamily: "'Inter', sans-serif", padding: "24px 16px 40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
        .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.03em; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        @keyframes stampIn {
          0% { transform: scale(2.2) rotate(-8deg); opacity: 0; }
          60% { transform: scale(0.95) rotate(-8deg); opacity: 1; }
          100% { transform: scale(1) rotate(-8deg); opacity: 1; }
        }
        .stamp-anim { animation: stampIn 0.5s cubic-bezier(.2,1.4,.4,1) forwards; }
        .vote-btn { transition: transform 0.15s ease, opacity 0.15s ease; }
        .vote-btn:hover { transform: translateY(-2px); }
        .vote-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
        .vote-btn:focus-visible { outline: 2px solid #F2B84B; outline-offset: 2px; }
        .icon-btn { transition: transform 0.15s ease; }
        .icon-btn:hover { transform: scale(1.08); }
        .icon-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
        .card-flash { transition: opacity 0.15s ease; }
        .field input, .field textarea { width: 100%; background: #1A1C23; border: 1px solid #2A2D37; color: #F2F1ED; border-radius: 10px; padding: 10px 12px; font-size: 14px; font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .field input:focus, .field textarea:focus { outline: 2px solid #F2B84B; outline-offset: 1px; }
        .tab-btn { transition: color 0.15s ease, border-color 0.15s ease; }
        .tab-btn:disabled { color: #45474F !important; cursor: not-allowed; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Scale size={20} color="#F2B84B" />
          <span className="mono" style={{ fontSize: 12, color: "#8A8D99", letterSpacing: "0.08em" }}>
            LOOKSMATCH
          </span>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 22, borderBottom: "1px solid #2A2D37" }}>
          <button className="tab-btn" onClick={() => setTab("profile")} style={tabBtnStyle(tab === "profile")}>
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

function LockedState({ text, onGo, goLabel = "Go to profile" }) {
  return (
    <div style={{ background: "#1A1C23", border: "1px solid #2A2D37", borderRadius: 16, padding: 32, textAlign: "center" }}>
      <Lock size={24} color="#565A66" style={{ marginBottom: 10 }} />
      <p style={{ color: "#8A8D99", fontSize: 14, margin: "0 0 18px" }}>{text}</p>
      <button onClick={onGo} className="vote-btn" style={{ ...voteBtnStyle("#F2B84B"), padding: "9px 18px" }}>
        {goLabel}
      </button>
    </div>
  );
}

function VotingPhase({ pair, votesToday, quota, flash, onVote, onUndo, canUndo, onGoToMatch }) {
  if (!pair || votesToday >= quota) {
    return (
      <div style={{ background: "#1A1C23", border: "1px solid #2A2D37", borderRadius: 16, padding: 32, textAlign: "center" }}>
        <Sparkles size={26} color="#F2B84B" style={{ marginBottom: 10 }} />
        <p className="display" style={{ fontSize: 30, margin: 0 }}>
          Jury duty done
        </p>
        <p style={{ color: "#8A8D99", fontSize: 14, margin: "8px 0 20px" }}>
          Head to the Match tab to see who you're looksmatched with.
        </p>
        <button onClick={onGoToMatch} className="vote-btn" style={{ ...voteBtnStyle("#FF5C7A"), padding: "10px 20px" }}>
          Go to Match
        </button>
      </div>
    );
  }

  const [a, b] = pair;
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
        <button className="vote-btn" onClick={() => onVote(a, b)} style={voteBtnStyle("#FF5C7A")}>
          Looksmatch — same league
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="vote-btn" onClick={() => onVote(a, b)} style={{ ...voteBtnStyle("#4FD1C5"), flex: 1 }}>
            {a.name} is out of {b.name}'s league
          </button>
          <button className="vote-btn" onClick={() => onVote(a, b)} style={{ ...voteBtnStyle("#F2B84B"), flex: 1 }}>
            {b.name} is out of {a.name}'s league
          </button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#565A66", textAlign: "center", marginTop: 14 }}>
        You won't see how the crowd voted — that's what keeps the verdict honest.
      </p>
    </>
  );
}

function SwipePhase({ candidate, reveal, onSwipe, onUndo, canUndo, matches, done }) {
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
                  {reveal.verdict === "match" ? "LOOKSMATCHED ✓" : "NOT LOOKSMATCHED"}
                </span>
                <span className="mono" style={{ fontSize: 11, opacity: 0.85 }}>
                  {reveal.verdict === "match" ? "chat unlocked" : "no chat — different leagues"}
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
            Liking doesn't guarantee a match — only the jury's verdict unlocks chat.
          </p>
        </div>
      )}

      {done && (
        <div style={{ background: "#1A1C23", border: "1px solid #2A2D37", borderRadius: 16, padding: 28, textAlign: "center" }}>
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
          <p className="mono" style={{ fontSize: 12, color: "#8A8D99", marginBottom: 10, letterSpacing: "0.06em" }}>
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
                  <img src={m.photo} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                  <span style={{ fontSize: 14 }}>{m.name}</span>
                </div>
                <button
                  onClick={() => alert(`Chat opened with ${m.name} (placeholder).`)}
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

      <button
        onClick={() => window.location.reload()}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "#565A66", fontSize: 12, marginTop: 22, cursor: "pointer" }}
      >
        <RotateCcw size={12} /> reset demo
      </button>
    </>
  );
}

function ProfileTab({ profile, setProfile, profileSubmitted, submitError, onSubmit }) {
  const fileInputRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((p) => ({ ...p, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  return (
    <>
      <h1 className="display" style={{ fontSize: 34, lineHeight: 1, margin: "0 0 4px" }}>
        Your profile
      </h1>
      <p style={{ color: "#8A8D99", fontSize: 13, margin: "0 0 20px" }}>
        This is what the jury will vote on.
      </p>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
      <div
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
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
            <img src={profile.photo} alt="Your profile" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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

      {submitError && (
        <p style={{ fontSize: 12, color: "#FF5C7A", marginTop: 14 }}>{submitError}</p>
      )}

      <button onClick={onSubmit} className="vote-btn" style={{ ...voteBtnStyle("#FF5C7A"), width: "100%", marginTop: 16, padding: "12px 14px" }}>
        {profileSubmitted ? "Update profile" : "Submit profile"}
      </button>

      {profileSubmitted && (
        <p style={{ fontSize: 12, color: "#4FD1C5", marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={13} /> In the voting pool. Edits here update it live.
        </p>
      )}
    </>
  );
}

function PhotoCard({ profile, large }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 14, overflow: "hidden", background: "#1A1C23" }}>
        <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <p style={{ fontWeight: 600, margin: "10px 0 0", fontSize: large ? 18 : 15 }}>
        {profile.name}, {profile.age}
      </p>
      <p style={{ color: "#8A8D99", fontSize: large ? 13 : 12, margin: "2px 0 0" }}>{profile.tagline}</p>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11, color: "#8A8D99", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" };

function voteBtnStyle(color) {
  return { background: "transparent", border: `1px solid ${color}`, color, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
}
function circleBtnStyle(color) {
  return { width: 56, height: 56, borderRadius: "50%", border: `2px solid ${color}`, color, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
}
const undoBtnStyle = { background: "transparent", border: "1px solid #2A2D37", color: "#8A8D99", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" };
function tabBtnStyle(active) {
  return {
    background: "transparent",
    border: "none",
    borderBottom: active ? "2px solid #F2B84B" : "2px solid transparent",
    color: active ? "#F2F1ED" : "#8A8D99",
    padding: "8px 14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: -1,
  };
}
