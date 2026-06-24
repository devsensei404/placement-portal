// RecruiterDashboard.jsx
// Route: /recruiter-dashboard
//
// Sections:
//   1. Header + Post New Job button
//   2. Stats row
//   3. Quick link to Manage Jobs
//   4. Two-column lower section:
//      LEFT  — Upcoming Interviews (derived from jobs already fetched)
//      RIGHT — Browse Candidates (GET /profiles/getAll, show 3, scroll window, View More → /candidates)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import "./RecruiterDashboard.css";

const BASE = "http://localhost:8080";

const EMPTY_FORM = {
  jobTitle: "",
  company: "",
  location: "",
  experience: "",
  jobType: "FULL_TIME",
  packageOffered: "",
  about: "",
  description: "",
};

export default function RecruiterDashboard() {
  const token  = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // ── Jobs (for stats + interviews) ──
  const [jobs,        setJobs       ] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  // ── Candidates ──
  const [candidates,        setCandidates       ] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);

  // ── Post Job modal ──
  const [showModal,  setShowModal ] = useState(false);
  const [form,       setForm      ] = useState(EMPTY_FORM);
  const [skillInput, setSkillInput] = useState("");
  const [skills,     setSkills    ] = useState([]);
  const [posting,    setPosting   ] = useState(false);
  const [postMsg,    setPostMsg   ] = useState({ text: "", type: "" });

  useEffect(() => {
    // Fetch recruiter's jobs
    fetch(`${BASE}/jobs/postedBy/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => setJobs(data))
      .catch(() => {})
      .finally(() => setJobsLoading(false));

    // Fetch all profiles for candidates panel
    fetch(`${BASE}/profiles/getAll`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => setCandidates(data))
      .catch(() => {})
      .finally(() => setCandidatesLoading(false));
  }, []);

  // ── Stats ──
  const totalJobs       = jobs.length;
  const openJobs        = jobs.filter((j) => j.status === "OPEN").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicants?.length || 0), 0);

  // ── Derive upcoming interviews from jobs ──
  // Flatten all applicants across all jobs where status === INTERVIEWING and interviewTime exists
  const interviews = jobs
    .flatMap((job) =>
      (job.applicants || [])
        .filter((a) => a.applicationStatus === "INTERVIEWING" && a.interviewTime)
        .map((a) => ({ ...a, jobTitle: job.jobTitle, company: job.company }))
    )
    .sort((a, b) => new Date(a.interviewTime) - new Date(b.interviewTime)); // soonest first

  // ── Post Job ──
  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function addSkill() {
    const t = skillInput.trim();
    if (!t || skills.includes(t)) return;
    setSkills([...skills, t]);
    setSkillInput("");
  }

  function removeSkill(s) {
    setSkills(skills.filter((x) => x !== s));
  }

  function closeModal() {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSkills([]);
    setSkillInput("");
    setPostMsg({ text: "", type: "" });
  }

  async function handlePostJob() {
    if (!form.jobTitle || !form.company) {
      setPostMsg({ text: "Job title and company are required.", type: "error" });
      return;
    }
    setPosting(true);
    setPostMsg({ text: "", type: "" });
    try {
      const payload = {
        ...form,
        packageOffered: form.packageOffered ? Number(form.packageOffered) : null,
        skillsRequired: skills,
      };
      const res = await fetch(`${BASE}/jobs/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to post job.");
      }
      setPostMsg({ text: "Job posted successfully!", type: "success" });
      const updated = await fetch(`${BASE}/jobs/postedBy/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
      setJobs(updated);
      setTimeout(() => closeModal(), 1200);
    } catch (err) {
      setPostMsg({ text: err.message, type: "error" });
    } finally {
      setPosting(false);
    }
  }

  // ── Helpers ──
  function formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function getInitials(name) {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  // ── Render ──
  return (
    <div className="rd-page">
      <Navbar />
      <main className="rd-main">

        {/* ── Header ── */}
        <div className="rd-header">
          <div>
            <h1 className="rd-title">Recruiter Dashboard</h1>
            <p className="rd-subtitle">Overview of your hiring activity</p>
          </div>
          <button className="rd-btn-post" onClick={() => setShowModal(true)}>
            + Post New Job
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="rd-stats">
          <div className="rd-stat-card">
            <p className="rd-stat-label">Jobs Posted</p>
            <p className="rd-stat-value">{jobsLoading ? "—" : totalJobs}</p>
          </div>
          <div className="rd-stat-card">
            <p className="rd-stat-label">Open Jobs</p>
            <p className="rd-stat-value rd-stat-open">{jobsLoading ? "—" : openJobs}</p>
          </div>
          <div className="rd-stat-card">
            <p className="rd-stat-label">Total Applicants</p>
            <p className="rd-stat-value">{jobsLoading ? "—" : totalApplicants}</p>
          </div>
        </div>

        {/* ── Quick link ── */}
        <div className="rd-quick-links">
          <div className="rd-quick-card" onClick={() => navigate("/my-jobs")}>
            <div className="rd-quick-icon">📋</div>
            <div>
              <p className="rd-quick-title">Manage Jobs</p>
              <p className="rd-quick-sub">View, edit, close or delete your postings — and review applicants</p>
            </div>
            <span className="rd-quick-arrow">→</span>
          </div>
        </div>

        {/* ── Lower two-column section ── */}
        <div className="rd-lower-grid">

          {/* ── LEFT: Upcoming Interviews ── */}
          <div className="rd-panel">
            <div className="rd-panel-header">
              <h2 className="rd-panel-title">📅 Upcoming Interviews</h2>
            </div>

            {jobsLoading ? (
              <p className="rd-panel-empty">Loading…</p>
            ) : interviews.length === 0 ? (
              <div className="rd-panel-empty-state">
                <p className="rd-panel-empty-title">No interviews scheduled</p>
                <p className="rd-panel-empty-sub">Shortlisted applicants will appear here once you set an interview time.</p>
              </div>
            ) : (
              <div className="rd-interview-list">
                {interviews.map((interview, idx) => (
                  <div key={idx} className="rd-interview-row">
                    <div className="rd-interview-avatar">
                      {getInitials(interview.name)}
                    </div>
                    <div className="rd-interview-info">
                      <p className="rd-interview-name">{interview.name}</p>
                      <p className="rd-interview-job">{interview.jobTitle}</p>
                    </div>
                    <div className="rd-interview-time">
                      <p className="rd-interview-datetime">{formatDateTime(interview.interviewTime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Browse Candidates ── */}
          <div className="rd-panel">
            <div className="rd-panel-header">
              <h2 className="rd-panel-title">👥 Browse Candidates</h2>
              <button
                className="rd-panel-link"
                onClick={() => navigate("/candidates")}
              >
                View All →
              </button>
            </div>

            {candidatesLoading ? (
              <p className="rd-panel-empty">Loading…</p>
            ) : candidates.length === 0 ? (
              <div className="rd-panel-empty-state">
                <p className="rd-panel-empty-title">No candidates yet</p>
                <p className="rd-panel-empty-sub">Registered students will appear here.</p>
              </div>
            ) : (
              <div className="rd-candidates-scroll">
                {candidates.slice(0, 3).map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rd-candidate-card"
                    onClick={() => navigate(`/candidate/${candidate.id}`)}
                  >
                    <div className="rd-candidate-avatar">
                      {getInitials(candidate.name)}
                    </div>
                    <div className="rd-candidate-info">
                      <p className="rd-candidate-name">{candidate.name || "Unnamed"}</p>
                      <p className="rd-candidate-title">
                        {candidate.jobTitle || "No title set"}
                        {candidate.company ? ` · ${candidate.company}` : ""}
                      </p>
                      {candidate.skills?.length > 0 && (
                        <div className="rd-candidate-skills">
                          {candidate.skills.slice(0, 3).map((s, i) => (
                            <span key={i} className="rd-skill-chip">{s}</span>
                          ))}
                          {candidate.skills.length > 3 && (
                            <span className="rd-skill-chip rd-skill-more">+{candidate.skills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="rd-candidate-arrow">→</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Post Job Modal ── */}
      {showModal && (
        <div className="rd-modal-overlay" onClick={closeModal}>
          <div className="rd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rd-modal-header">
              <h2>Post a New Job</h2>
              <button className="rd-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="rd-modal-body">
              <div className="rd-form-row">
                <div className="rd-form-field">
                  <label>Job Title *</label>
                  <input name="jobTitle" value={form.jobTitle} onChange={handleFormChange} placeholder="e.g. Software Engineer" />
                </div>
                <div className="rd-form-field">
                  <label>Company *</label>
                  <input name="company" value={form.company} onChange={handleFormChange} placeholder="Company name" />
                </div>
              </div>

              <div className="rd-form-row">
                <div className="rd-form-field">
                  <label>Location</label>
                  <input name="location" value={form.location} onChange={handleFormChange} placeholder="City / Remote" />
                </div>
                <div className="rd-form-field">
                  <label>Experience</label>
                  <input name="experience" value={form.experience} onChange={handleFormChange} placeholder="e.g. 2–4 years" />
                </div>
              </div>

              <div className="rd-form-row">
                <div className="rd-form-field">
                  <label>Job Type</label>
                  <select name="jobType" value={form.jobType} onChange={handleFormChange}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div className="rd-form-field">
                  <label>
                    Package{" "}
                    <span className="rd-label-hint">
                      ({form.jobType === "FULL_TIME" ? "LPA" : form.jobType === "INTERNSHIP" ? "₹/month" : "₹/hr"})
                    </span>
                  </label>
                  <input name="packageOffered" type="number" value={form.packageOffered} onChange={handleFormChange} placeholder="e.g. 12" />
                </div>
              </div>

              <div className="rd-form-field">
                <label>About the Role</label>
                <textarea name="about" value={form.about} onChange={handleFormChange} placeholder="Short summary..." rows={2} />
              </div>

              <div className="rd-form-field">
                <label>Job Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Detailed responsibilities..." rows={3} />
              </div>

              <div className="rd-form-field">
                <label>Skills Required</label>
                <div className="rd-skill-row">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Type a skill and press Enter or Add"
                  />
                  <button className="rd-btn-sm-ghost" onClick={addSkill}>Add</button>
                </div>
                {skills.length > 0 && (
                  <div className="rd-skill-tags">
                    {skills.map((s, i) => (
                      <span key={i} className="rd-skill-tag">
                        {s}
                        <button className="rd-skill-remove" onClick={() => removeSkill(s)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {postMsg.text && (
                <p className={postMsg.type === "success" ? "rd-msg-success" : "rd-msg-error"}>
                  {postMsg.text}
                </p>
              )}
            </div>

            <div className="rd-modal-footer">
              <button className="rd-btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="rd-btn-post" onClick={handlePostJob} disabled={posting}>
                {posting ? "Posting..." : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}