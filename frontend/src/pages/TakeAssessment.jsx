// TakeAssessment.jsx
// Route: /assessments/:assessmentId/take
//
// Applicant view: starts the attempt, renders all questions in a
// scrollable list, runs a client-side countdown timer, auto-submits
// on timeout, and shows the result (or a "submitted" message) after.

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import "./TakeAssessment.css";
import BASE_URL from "../api";

const BASE = BASE_URL;

// Error codes thrown by startAssessment in AssessmentServiceImpl:
// ASSESSMENT_NOT_FOUND, ASSESSMENT_NOT_OPEN, ASSESSMENT_HAS_NO_QUESTIONS,
// ASSESSMENT_MAX_ATTEMPTS_REACHED
function friendlyStartError(code) {
  switch (code) {
    case "ASSESSMENT_NOT_FOUND":
      return "This assessment could not be found.";
    case "ASSESSMENT_NOT_OPEN":
      return "This assessment is not currently open.";
    case "ASSESSMENT_HAS_NO_QUESTIONS":
      return "This assessment has no questions yet. Please check back later.";
    case "ASSESSMENT_MAX_ATTEMPTS_REACHED":
      return "You've already used all your attempts for this assessment.";
    default:
      return null;
  }
}

export default function TakeAssessment() {
  const { assessmentId } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null); // AttemptPaperDTO
  const [startError, setStartError] = useState("");
  const [starting, setStarting] = useState(true);

  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }

  const [secondsLeft, setSecondsLeft] = useState(null);
  const timerRef = useRef(null);
  const submittedRef = useRef(false); // guards against double submit (timer + manual click)

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // AssessmentResultDTO, if returned
  const [submittedOnly, setSubmittedOnly] = useState(false); // true if only ResponseDTO came back
  const [submitError, setSubmitError] = useState("");

  // Guards against firing POST /start twice — most notably React 18
  // StrictMode's dev-only mount→cleanup→mount, which would otherwise
  // create two separate AssessmentAttempt rows on the backend for a
  // single real attempt (surfaces later as a "non-unique result" error
  // when fetching that applicant's result breakdown).
  const hasStartedRef = useRef(false);

  // ── Start the attempt on mount ──
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    fetch(`${BASE}/assessments/${assessmentId}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(friendlyStartError(err.errorMessage) || err.errorMessage || "Could not start assessment.");
        }
        return res.json();
      })
      .then((data) => {
        setPaper(data);
        setSecondsLeft(data.durationMinutes * 60);
      })
      .catch((err) => {
        hasStartedRef.current = false; // allow a real retry (e.g. user navigates back and re-enters)
        setStartError(err.message);
      })
      .finally(() => setStarting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  // ── Countdown timer ── started once paper/secondsLeft is set, cleaned up on unmount
  useEffect(() => {
    if (secondsLeft === null || result || submittedOnly) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!submittedRef.current) handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft === null]);

  // Extra safety: always clear the interval if the component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function selectAnswer(questionId, option) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  async function handleSubmit(isAutoSubmit = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    setSubmitting(true);
    setSubmitError("");

    const answerList = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId: Number(questionId),
      selectedOption,
    }));

    try {
      const res = await fetch(`${BASE}/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attemptId: paper.attemptId,
          answers: answerList,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to submit assessment.");
      }

      const data = await res.json();
      if (data.score !== undefined) {
        setResult(data);
      } else {
        setSubmittedOnly(true);
      }
    } catch (err) {
      setSubmitError(err.message);
      submittedRef.current = false; // allow retry on genuine failure
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render states ──

  if (starting) {
    return (
      <div className="ta-page">
        <Navbar />
        <p className="ta-status">Loading assessment…</p>
      </div>
    );
  }

  if (startError) {
    return (
      <div className="ta-page">
        <Navbar />
        <div className="ta-main">
          <p className="ta-error">{startError}</p>
          <button className="ta-btn-cancel" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="ta-page">
        <Navbar />
        <div className="ta-main">
          <div className="ta-result-card">
            <h1 className="ta-result-title">Assessment Submitted</h1>
            <div className="ta-result-grid">
              <div className="ta-result-stat">
                <span className="ta-result-label">Score</span>
                <span className="ta-result-value">{result.score}</span>
              </div>
              <div className="ta-result-stat">
                <span className="ta-result-label">Percentage</span>
                <span className="ta-result-value">{result.percentage}%</span>
              </div>
              <div className="ta-result-stat">
                <span className="ta-result-label">Correct</span>
                <span className="ta-result-value ta-green">{result.correct}</span>
              </div>
              <div className="ta-result-stat">
                <span className="ta-result-label">Wrong</span>
                <span className="ta-result-value ta-red">{result.wrong}</span>
              </div>
              <div className="ta-result-stat">
                <span className="ta-result-label">Skipped</span>
                <span className="ta-result-value">{result.skipped}</span>
              </div>
            </div>
            <button className="ta-btn-primary" onClick={() => navigate("/browse-jobs")}>
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submittedOnly) {
    return (
      <div className="ta-page">
        <Navbar />
        <div className="ta-main">
          <div className="ta-result-card">
            <h1 className="ta-result-title">Submitted Successfully</h1>
            <p className="ta-result-note">Results will be shared with you later.</p>
            <button className="ta-btn-primary" onClick={() => navigate("/browse-jobs")}>
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ta-page">
      <Navbar />
      <div className="ta-timer-bar">
        <span className="ta-timer-label">Time Remaining</span>
        <span className={`ta-timer-value ${secondsLeft <= 60 ? "ta-timer-critical" : ""}`}>
          {formatTime(secondsLeft)}
        </span>
      </div>

      <main className="ta-main">
        <h1 className="ta-title">{paper.title}</h1>
        {paper.negativeMarking && (
          <p className="ta-negative-note">
            Negative marking is enabled: -{paper.negativeMarksPerWrong} for each wrong answer.
          </p>
        )}

        {submitError && <p className="ta-error">{submitError}</p>}

        <div className="ta-question-list">
          {paper.questions.map((q, idx) => (
            <div key={q.questionId} className="ta-question-card" style={{ animationDelay: `${idx * 0.03}s` }}>
              <p className="ta-question-num">Question {idx + 1} of {paper.questions.length}</p>
              <p className="ta-question-text">{q.questionText}</p>
              <div className="ta-options">
                {["A", "B", "C", "D"].map((opt) => (
                  <label key={opt} className="ta-option">
                    <input
                      type="radio"
                      name={`q-${q.questionId}`}
                      checked={answers[q.questionId] === opt}
                      onChange={() => selectAnswer(q.questionId, opt)}
                    />
                    <span className="ta-option-letter">{opt}</span>
                    <span>{q[`option${opt}`]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ta-submit-bar">
          <span className="ta-answered-count">
            {Object.keys(answers).length} of {paper.questions.length} answered
          </span>
          <button
            className="ta-btn-primary"
            onClick={() => handleSubmit(false)}
            disabled={submitting || submittedRef.current}
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>
      </main>
    </div>
  );
}
