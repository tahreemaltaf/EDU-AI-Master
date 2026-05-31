import React, { useState, useEffect } from "react";
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";

const Flashcards = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [feedback, setFeedback] = useState(null);

  const [hint, setHint] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);

  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    mastered: 0,
    learning: 0,
    forgotten: 0,
  });

  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/flashcards"
        );
        setFlashcards(res.data.flashcards || []);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const topics = [...new Set(flashcards.map((f) => f.topic))];

  const filtered =
    filter === "all"
      ? flashcards
      : flashcards.filter((f) => f.topic === filter);

  const card = filtered[currentIndex];

  const progress =
    filtered.length > 0
      ? Math.round(((currentIndex + 1) / filtered.length) * 100)
      : 0;

  const reset = () => {
  setIsFlipped(false);
  setHint("");
  setShowHint(false);
  setFeedback(null);
};

  const next = () => {
    reset();
    setCurrentIndex((i) => Math.min(i + 1, filtered.length - 1));
  };

  const prev = () => {
    reset();
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const speak = (text) => {
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  const generateHint = async (e) => {
    e.stopPropagation();

    try {
      setHintLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/generate-hint",
        {
          question: card.front,
          answer: card.back,
        }
      );

      setHint(res.data.hint);
      setShowHint(true);
    } catch {
      setHint("Think about key concepts...");
      setShowHint(true);
    } finally {
      setHintLoading(false);
    }
  };

  const handleRate = async (e, quality) => {
    e.stopPropagation();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/review-flashcard",
        {
          topic: card.topic,
          quality,
        }
      );

      setSessionStats((p) => ({
        reviewed: p.reviewed + 1,
        mastered: quality === 3 ? p.mastered + 1 : p.mastered,
        learning:
          quality === 1 || quality === 2
            ? p.learning + 1
            : p.learning,
        forgotten: quality === 0 ? p.forgotten + 1 : p.forgotten,
      }));

      setFeedback("Saved ✔");

      setTimeout(() => {
        setFeedback(null);
        setIsFlipped(false);

        setTimeout(() => {
          setCurrentIndex((i) => {
            if (i < filtered.length - 1) return i + 1;
            setShowSummary(true);
            return i;
          });
        }, 300);
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <Layers size={50} />
        Loading flashcards...
      </div>
    );
  }

  if (showSummary) {
    return (
      <div style={styles.summary}>
        <h1>🎉 Session Complete</h1>
        <p>Reviewed: {sessionStats.reviewed}</p>
        <p>Mastered: {sessionStats.mastered}</p>
        <p>Learning: {sessionStats.learning}</p>
        <p>Forgotten: {sessionStats.forgotten}</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Active Recall</h1>

      {/* FILTERS */}
      <div style={styles.filters}>
        <button
          style={styles.filterBtn}
          onClick={() => setFilter("all")}
        >
          All
        </button>

        {topics.map((t) => (
          <button
            key={t}
            style={styles.filterBtn}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* PROGRESS */}
      <div style={styles.progressWrap}>
        <div style={styles.ring}>{progress}%</div>
      </div>

      {card && (
        <div
          style={styles.stage}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            style={{
              ...styles.card,
              transform: isFlipped
                ? "rotateY(180deg)"
                : "rotateY(0deg)",
            }}
          >
            {/* FRONT */}
            <div style={styles.front}>
              <div style={styles.topic}>{card.topic}</div>

              <h2>{card.front}</h2>

              <div style={styles.actionRow}>
                <button
                  style={styles.hintBtn}
                  onClick={generateHint}
                >
                  🧠 Hint
                </button>

                <button
                  style={styles.readBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(card.front);
                  }}
                >
                  🔊 Read
                </button>
              </div>

              {showHint && (
                <div style={styles.hint}>
                  {hintLoading ? "Loading..." : hint}
                </div>
              )}
            </div>

            {/* BACK */}
            <div style={styles.back}>
              <CheckCircle2 />

              <p>{card.back}</p>

              <button
                onClick={(e) => handleRate(e, 3)}
                style={styles.masterBtn}
              >
                Mark as Done
              </button>

              {feedback && (
                <p style={styles.feedback}>{feedback}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <div style={styles.nav}>
        <button onClick={prev}>
          <ChevronLeft />
        </button>

        <span>
          {currentIndex + 1} / {filtered.length}
        </span>

        <button onClick={next}>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Flashcards;

/* ================= STYLES ================= */

const styles = {
  wrapper: {
    padding: 40,
    maxWidth: 900,
    margin: "auto",
    color: "white",
    background: "#0f172a",
    minHeight: "100vh",
  },

  title: {
    textAlign: "center",
    fontSize: "2.5rem",
    marginBottom: 20,
  },

  filters: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 25,
  },

  filterBtn: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    cursor: "pointer",
  },

  progressWrap: {
    display: "flex",
    justifyContent: "center",
    margin: 20,
  },

  ring: {
    width: 70,
    height: 70,
    borderRadius: "50%",
    border: "6px solid #06b6d4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  stage: {
    perspective: 1200,
    display: "flex",
    justifyContent: "center",
  },

  card: {
    width: 600,
    height: 420,
    position: "relative",
    transformStyle: "preserve-3d",
    transition: "0.6s",
  },

  front: {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    padding: 30,
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",

    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    textAlign: "center",
  },

  back: {
    position: "absolute",
    inset: 0,
    transform: "rotateY(180deg)",
    backfaceVisibility: "hidden",
    padding: 30,
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",

    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    textAlign: "center",
  },

  topic: {
    color: "#06b6d4",
    marginBottom: 10,
  },

  actionRow: {
    display: "flex",
    gap: 8,
    marginTop: 18,
    justifyContent: "center",
  },

  hintBtn: {
    padding: "6px 10px",
    borderRadius: 10,
    background: "#8b5cf6",
    border: "none",
    color: "white",
    fontSize: "0.85rem",
    cursor: "pointer",
  },

  readBtn: {
    padding: "6px 10px",
    borderRadius: 10,
    background: "#06b6d4",
    border: "none",
    color: "white",
    fontSize: "0.85rem",
    cursor: "pointer",
  },

  hint: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    background: "rgba(139,92,246,0.2)",
  },

  masterBtn: {
    padding: "8px 12px",
    borderRadius: 10,
    background: "#22c55e",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  feedback: {
    marginTop: 10,
    color: "#06b6d4",
  },

  nav: {
    display: "flex",
    justifyContent: "center",
    gap: 20,
    marginTop: 20,
  },

  center: {
    textAlign: "center",
    marginTop: 100,
    color: "white",
  },

  summary: {
    textAlign: "center",
    marginTop: 100,
    color: "white",
  },
};