// ManageAssessments.jsx
// Route: /assessments/manage/:jobId
//
// Recruiter view: list assessments for a job, create new ones,
// open/close them, and navigate to question management / results.

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import "./ManageAssessments.css";
import BASE_URL from "../api";

const BASE = BASE_URL;

const EMPTY_FORM = {
  title: "",
  description: "",
  durationMinutes: "",
  totalMarks: "",
  negativeMarking: false,
  negativeMarksPerWrong: "0.25",
  showResultImmediately: true,
  maxAttempts: "1",
};

export default function ManageAssessments() {
  const { jobId } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState({ text: "", type: "" });

  // Per-assessment "toggling status" loading flag, keyed by assessmentId
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  function fetchAssessments() {
    setLoading(true);
    fetch(`${BASE}/assessments/job/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load assessments.");
        return res.json();
      })
      .then((data) => setAssessments(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function handleFormChange(e) {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    setForm(EMPTY_FORM);
    setCreateMsg({ text: "", type: "" });
  }

  async function handleCreate() {
    if (!form.title || !form.durationMinutes || !form.totalMarks) {
      setCreateMsg({ text: "Title, duration, and total marks are required.", type: "error" });
      return;
    }
    setCreating(true);
    setCreateMsg({ text: "", type: "" });
    try {
      const payload = {
        title: form.title,
        description: form.description,
        durationMinutes: Number(form.durationMinutes),
        totalMarks: Number(form.totalMarks),
        negativeMarking: form.negativeMarking,
        negativeMarksPerWrong: form.negativeMarking
          ? Number(form.negativeMarksPerWrong || 0)
          : 0.25,
        showResultImmediately: form.showResultImmediately,
        maxAttempts: Number(form.maxAttempts || 1),
        jobId: Number(jobId),
      };
      const res = await fetch(`${BASE}/assessments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to create assessment.");
      }
      setCreateMsg({ text: "Assessment created!", type: "success" });
      fetchAssessments();
      setTimeout(() => closeCreateModal(), 900);
    } catch (err) {
      setCreateMsg({ text: err.message, type: "error" });
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(assessment) {
    const endpoint = assessment.status === "OPEN" ? "close" : "open";
    setTogglingId(assessment.assessmentId);
    try {
      const res = await fetch(`${BASE}/assessments/${assessment.assessmentId}/${endpoint}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to update status.");
      }
      fetchAssessments();
    } catch (err) {
      alert(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="ma-page">
      <Navbar />
      <main className="ma-main">

        <div className="ma-header">
          <div>
            <button className="ma-btn-back" onClick={() => navigate("/my-jobs")}>
              ← Back to My Jobs
            </button>
            <h1 className="ma-title">Assessments</h1>
            <p className="ma-subtitle">Manage assessments for this job posting</p>
          </div>
          <button className="ma-btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create Assessment
          </button>
        </div>

        {error && <p className="ma-error">{error}</p>}

        {loading && <p className="ma-loading">Loading…</p>}

        {!loading && !error && assessments.length === 0 && (
          <div className="ma-empty">
            <p className="ma-empty-title">No assessments yet</p>
            <p className="ma-empty-sub">Create one to start screening applicants.</p>
          </div>
        )}

        {!loading && assessments.length > 0 && (
          <div className="ma-list">
            {assessments.map((a, i) => (
              <div key={a.assessmentId} className="ma-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="ma-card-left">
                  <div className="ma-card-top">
                    <span className={`ma-status-pill ma-pill-${a.status?.toLowerCase()}`}>
                      {a.status}
                    </span>
                  </div>
                  <h2 className="ma-card-title">{a.title}</h2>
                  {a.description && <p className="ma-card-desc">{a.description}</p>}
                  <p className="ma-card-meta">
                    {a.totalQuestions ?? 0} question{a.totalQuestions !== 1 ? "s" : ""}
                    {" · "}{a.durationMinutes} min
                    {" · "}{a.totalMarks} marks
                    {a.negativeMarking ? ` · -${a.negativeMarksPerWrong} per wrong` : ""}
                  </p>
                </div>

                <div className="ma-card-actions">
                  <button
                    className="ma-btn-sm ma-btn-ghost"
                    onClick={() => navigate(`/assessments/${a.assessmentId}/questions`)}
                  >
                    Manage Questions
                  </button>
                  {(a.status === "OPEN" || a.status === "CLOSED") && (
                    <button
                      className="ma-btn-sm ma-btn-ghost"
                      onClick={() => navigate(`/assessments/${a.assessmentId}/results`)}
                    >
                      View Results
                    </button>
                  )}
                  <button
                    className={`ma-btn-sm ${a.status === "OPEN" ? "ma-btn-orange" : "ma-btn-green"}`}
                    onClick={() => toggleStatus(a)}
                    disabled={togglingId === a.assessmentId}
                  >
                    {togglingId === a.assessmentId
                      ? "…"
                      : a.status === "OPEN" ? "Close" : "Open"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="ma-overlay" onClick={closeCreateModal}>
          <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-header">
              <h2>Create Assessment</h2>
              <button className="ma-modal-close" onClick={closeCreateModal}>✕</button>
            </div>

            <div className="ma-modal-body">
              <div className="ma-form-field">
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. Technical Screening Round" />
              </div>

              <div className="ma-form-field">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="What this assessment covers..." />
              </div>

              <div className="ma-form-row">
                <div className="ma-form-field">
                  <label>Duration (minutes) *</label>
                  <input name="durationMinutes" type="number" value={form.durationMinutes} onChange={handleFormChange} placeholder="e.g. 30" />
                </div>
                <div className="ma-form-field">
                  <label>Total Marks *</label>
                  <input name="totalMarks" type="number" value={form.totalMarks} onChange={handleFormChange} placeholder="e.g. 50" />
                </div>
              </div>

              <div className="ma-form-row">
                <div className="ma-form-field">
                  <label>Max Attempts</label>
                  <input name="maxAttempts" type="number" value={form.maxAttempts} onChange={handleFormChange} placeholder="1" />
                </div>
                <div className="ma-form-field ma-checkbox-field">
                  <label>
                    <input
                      type="checkbox"
                      name="showResultImmediately"
                      checked={form.showResultImmediately}
                      onChange={handleFormChange}
                    />
                    {" "}Show result immediately
                  </label>
                </div>
              </div>

              <div className="ma-form-field ma-checkbox-field">
                <label>
                  <input
                    type="checkbox"
                    name="negativeMarking"
                    checked={form.negativeMarking}
                    onChange={handleFormChange}
                  />
                  {" "}Enable negative marking
                </label>
              </div>

              {form.negativeMarking && (
                <div className="ma-form-field">
                  <label>Negative marks per wrong answer</label>
                  <input
                    name="negativeMarksPerWrong"
                    type="number"
                    step="0.01"
                    value={form.negativeMarksPerWrong}
                    onChange={handleFormChange}
                  />
                </div>
              )}

              {createMsg.text && (
                <p className={createMsg.type === "success" ? "ma-msg-success" : "ma-msg-error"}>
                  {createMsg.text}
                </p>
              )}
            </div>

            <div className="ma-modal-footer">
              <button className="ma-btn-cancel" onClick={closeCreateModal}>Cancel</button>
              <button className="ma-btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create Assessment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
