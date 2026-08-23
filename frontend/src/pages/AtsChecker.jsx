// AtsChecker.jsx
// Route: /ats-checker
//
// Standalone AI resume checker. Fully independent of MyProfile — nothing here
// is saved anywhere. A student can upload multiple resume drafts, one at a
// time, and get an instant score for each without touching their saved
// profile resume.
//
// Backend: POST /ats/score (multipart file upload) -> AtsScoreDTO
//   { score, formattingScore, keywordScore, clarityScore,
//     strengths[], missingElements[], suggestions[], summary }

import { useRef, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import "./AtsChecker.css";
import BASE_URL from "../api";

const BASE = BASE_URL;

function UploadIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="M6.5 9.5 12 4l5.5 5.5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function CheckIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function AlertIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <circle cx="12" cy="12" r="9.5" />
    </svg>
  );
}

function BulbIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a6.5 6.5 0 0 0-4 11.6c.6.5 1 1.3 1 2.4h6c0-1.1.4-1.9 1-2.4A6.5 6.5 0 0 0 12 2Z" />
    </svg>
  );
}

function scoreTone(score) {
  if (score >= 80) return "strong";
  if (score >= 50) return "medium";
  return "weak";
}

function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(100, score ?? 0));
  const offset = circumference - (filled / 100) * circumference;
  const tone = scoreTone(filled);

  return (
    <div className={`atc-ring-wrap atc-ring-${tone}`}>
      <svg viewBox="0 0 128 128" width="128" height="128">
        <circle cx="64" cy="64" r={radius} className="atc-ring-track" />
        <circle
          cx="64" cy="64" r={radius}
          className="atc-ring-fill"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
        />
      </svg>
      <div className="atc-ring-label">
        <span className="atc-ring-score">{filled}</span>
        <span className="atc-ring-max">/100</span>
      </div>
    </div>
  );
}

function SubScoreBar({ label, value }) {
  const tone = scoreTone(value ?? 0);
  return (
    <div className="atc-subscore">
      <div className="atc-subscore-top">
        <span className="atc-subscore-label">{label}</span>
        <span className="atc-subscore-value">{value ?? 0}</span>
      </div>
      <div className="atc-subscore-track">
        <div className={`atc-subscore-fill atc-subscore-${tone}`} style={{ width: `${value ?? 0}%` }} />
      </div>
    </div>
  );
}

export default function AtsChecker() {
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]); // { fileName, score }[] — this session only, not persisted

  function pickFile() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    setResult(null);
    setScoring(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BASE}/ats/score`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.errorMessage || "Couldn't score this resume. Try a different file.");
      }

      const data = await res.json();
      setResult(data);
      setHistory((prev) => [{ fileName: file.name, score: data.score }, ...prev].slice(0, 6));
    } catch (err) {
      setError(err.message);
    } finally {
      setScoring(false);
      // allow re-selecting the same file name back to back
      e.target.value = "";
    }
  }

  return (
    <div className="atc-page">
      <Navbar />

      <main className="atc-main">
        <div className="atc-header">
          <h1 className="atc-title">ATS Resume Checker</h1>
          <p className="atc-subtitle">
            Upload a resume image to see how it scores against common ATS
            criteria. Nothing here is saved — check as many drafts as you like.
          </p>
        </div>

        <div className="atc-upload-card">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button className="atc-upload-btn" onClick={pickFile} disabled={scoring}>
            <UploadIcon />
            {scoring ? "Scoring…" : "Upload Resume Image"}
          </button>
          {fileName && !scoring && (
            <p className="atc-filename">Last checked: {fileName}</p>
          )}
          {error && <p className="atc-error">{error}</p>}
        </div>

        {scoring && (
          <div className="atc-loading">
            <div className="atc-spinner" />
            <p>Analyzing your resume…</p>
          </div>
        )}

        {!scoring && result && (
          <div className="atc-result">
            <section className="atc-card atc-score-card">
              <ScoreRing score={result.score} />
              <div className="atc-score-side">
                <h2 className="atc-score-verdict">{result.summary}</h2>
                <div className="atc-subscores">
                  <SubScoreBar label="Formatting" value={result.formattingScore} />
                  <SubScoreBar label="Keywords" value={result.keywordScore} />
                  <SubScoreBar label="Clarity" value={result.clarityScore} />
                </div>
              </div>
            </section>

            <div className="atc-details-grid">
              {result.strengths?.length > 0 && (
                <section className="atc-card">
                  <h3 className="atc-card-title atc-title-good"><CheckIcon /> Strengths</h3>
                  <ul className="atc-list">
                    {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </section>
              )}

              {result.missingElements?.length > 0 && (
                <section className="atc-card">
                  <h3 className="atc-card-title atc-title-warn"><AlertIcon /> Missing</h3>
                  <ul className="atc-list">
                    {result.missingElements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </section>
              )}

              {result.suggestions?.length > 0 && (
                <section className="atc-card atc-card-wide">
                  <h3 className="atc-card-title atc-title-tip"><BulbIcon /> Suggestions</h3>
                  <ul className="atc-list">
                    {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </section>
              )}
            </div>
          </div>
        )}

        {!scoring && !result && !error && (
          <div className="atc-empty">
            <p>Upload a resume image above to get your first score.</p>
          </div>
        )}

        {history.length > 1 && (
          <section className="atc-history">
            <h3 className="atc-history-title">This session</h3>
            <div className="atc-history-list">
              {history.map((h, i) => (
                <div key={i} className="atc-history-row">
                  <span className="atc-history-name">{h.fileName}</span>
                  <span className={`atc-history-score atc-history-${scoreTone(h.score)}`}>{h.score}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
