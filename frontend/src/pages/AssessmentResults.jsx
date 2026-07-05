// AssessmentResults.jsx
// Route: /assessments/:assessmentId/results
//
// Recruiter view: submitted-attempt summaries, expandable per-applicant
// question-by-question breakdown (fetched and cached on click).

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import "./AssessmentResults.css";
import BASE_URL from "../api";

const BASE = BASE_URL;

export default function AssessmentResults() {
  const { assessmentId } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedApplicantId, setExpandedApplicantId] = useState(null);
  // Cache of detail breakdowns, keyed by applicantId
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/assessments/${assessmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to load assessment.");
        return res.json();
      }),
      fetch(`${BASE}/assessments/${assessmentId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to load results.");
        return res.json();
      }),
    ])
      .then(([assessmentData, resultsData]) => {
        setAssessment(assessmentData);
        setResults(resultsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [assessmentId]);

  function formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function formatDuration(seconds) {
    if (seconds == null) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  async function toggleRow(applicantId) {
    if (expandedApplicantId === applicantId) {
      setExpandedApplicantId(null);
      return;
    }
    setExpandedApplicantId(applicantId);
    if (detailCache[applicantId]) return; // already fetched

    setDetailLoading(true);
    setDetailError("");
    try {
      const res = await fetch(`${BASE}/assessments/${assessmentId}/results/${applicantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to load breakdown.");
      }
      const data = await res.json();
      setDetailCache((prev) => ({ ...prev, [applicantId]: data }));
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="ar-page">
      <Navbar />
      <main className="ar-main">

        <button className="ar-btn-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {loading && <p className="ar-loading">Loading…</p>}
        {error && <p className="ar-error">{error}</p>}

        {assessment && (
          <div className="ar-header">
            <h1 className="ar-title">{assessment.title} — Results</h1>
            <p className="ar-subtitle">{results.length} submission{results.length !== 1 ? "s" : ""}</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="ar-empty">
            <p className="ar-empty-title">No submitted attempts yet</p>
            <p className="ar-empty-sub">Results will appear here once applicants complete the assessment.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="ar-table">
            <div className="ar-table-header">
              <span>Applicant ID</span>
              <span>Score</span>
              <span>Submitted</span>
              <span>Time Taken</span>
              <span></span>
            </div>

            {results.map((r) => (
              <div key={r.attemptId} className="ar-row-group">
                <div
                  className="ar-table-row"
                  onClick={() => toggleRow(r.applicantId)}
                >
                  <span>{r.applicantId}</span>
                  <span>{r.score}</span>
                  <span>{formatDateTime(r.submitTime)}</span>
                  <span>{formatDuration(r.timeTakenSeconds)}</span>
                  <span className="ar-arrow">{expandedApplicantId === r.applicantId ? "▲" : "▼"}</span>
                </div>

                {expandedApplicantId === r.applicantId && (
                  <div className="ar-detail-panel">
                    {detailLoading && !detailCache[r.applicantId] && <p className="ar-loading">Loading breakdown…</p>}
                    {detailError && !detailCache[r.applicantId] && <p className="ar-error">{detailError}</p>}
                    {detailCache[r.applicantId] && (
                      <div className="ar-detail-list">
                        {detailCache[r.applicantId].map((d) => (
                          <div key={d.questionId} className="ar-detail-item">
                            <p className="ar-detail-q">{d.questionText}</p>
                            <p className="ar-detail-meta">
                              Selected: <strong className={d.selectedOption === d.correctOption ? "ar-correct" : "ar-wrong"}>
                                {d.selectedOption || "—"}
                              </strong>
                              {" · "}Correct: <strong>{d.correctOption}</strong>
                              {" · "}Marks: <strong>{d.awardedMarks}</strong>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
