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
import BASE_URL from "../api";

const BASE = BASE_URL;

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

// ── Inline SVG icons (replace emoji) ──
function IconClipboard() {
  return (
    <svg className="rd2-icon" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="4" width="12" height="17" rx="2" stroke="#111111" strokeWidth="1.6" />
      <rect x="9" y="2.5" width="6" height="3" rx="1" fill="#ffffff" stroke="#111111" strokeWidth="1.6" />
      <line x1="9" y1="11" x2="15" y2="11" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9" y1="14.5" x2="15" y2="14.5" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9" y1="18" x2="12.5" y2="18" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="rd2-icon" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="#111111" strokeWidth="1.6" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" stroke="#111111" strokeWidth="1.6" />
      <line x1="7.5" y1="2.5" x2="7.5" y2="7" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16.5" y1="2.5" x2="16.5" y2="7" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="13.5" r="1" fill="#111111" />
      <circle cx="12" cy="13.5" r="1" fill="#111111" />
      <circle cx="8" cy="17" r="1" fill="#111111" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="rd2-icon" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.2" stroke="#111111" strokeWidth="1.6" />
      <path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16.5" cy="8.5" r="2.4" stroke="#111111" strokeWidth="1.4" />
      <path d="M14.7 13.7c2.4.2 4.3 2.1 4.3 4.8" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

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

    // Fetch top profiles (by completeness score, already filtered/sorted server-side)
    // for the candidates panel
    fetch(`${BASE}/profiles/topProfiles?limit=3`, {
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
    <div className="rd2-page">
      <Navbar />
      <main className="rd2-main">

        {/* ── Header ── */}
        <div className="rd2-header">
          <div>
            <h1 className="rd2-title">Recruiter Dashboard</h1>
            <p className="rd2-subtitle">Overview of your hiring activity</p>
          </div>
          <button className="rd2-btn-post" onClick={() => setShowModal(true)}>
            + Post New Job
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="rd2-stats">
          <div className="rd2-stat-card">
            <p className="rd2-stat-label">Jobs Posted</p>
            <p className="rd2-stat-value">{jobsLoading ? "—" : totalJobs}</p>
          </div>
          <div className="rd2-stat-card">
            <p className="rd2-stat-label">Open Jobs</p>
            <p className="rd2-stat-value rd2-stat-open">{jobsLoading ? "—" : openJobs}</p>
          </div>
          <div className="rd2-stat-card">
            <p className="rd2-stat-label">Total Applicants</p>
            <p className="rd2-stat-value">{jobsLoading ? "—" : totalApplicants}</p>
          </div>
        </div>

        {/* ── Quick link ── */}
        <div className="rd2-quick-links">
          <div className="rd2-quick-card" onClick={() => navigate("/my-jobs")}>
            <div className="rd2-quick-icon"><IconClipboard /></div>
            <div>
              <p className="rd2-quick-title">Manage Jobs</p>
              <p className="rd2-quick-sub">View, edit, close or delete your postings — and review applicants</p>
            </div>
            <span className="rd2-quick-arrow">→</span>
          </div>
        </div>

        {/* ── Lower two-column section ── */}
        <div className="rd2-lower-grid">

          {/* ── LEFT: Upcoming Interviews ── */}
          <div className="rd2-panel">
            <div className="rd2-panel-header">
              <h2 className="rd2-panel-title">
                <IconCalendar />
                Upcoming Interviews
              </h2>
            </div>

            {jobsLoading ? (
              <p className="rd2-panel-empty">Loading…</p>
            ) : interviews.length === 0 ? (
              <div className="rd2-panel-empty-state">
                <p className="rd2-panel-empty-title">No interviews scheduled</p>
                <p className="rd2-panel-empty-sub">Shortlisted applicants will appear here once you set an interview time.</p>
              </div>
            ) : (
              <div className="rd2-interview-list">
                {interviews.map((interview, idx) => (
                  <div key={idx} className="rd2-interview-row">
                    <div className="rd2-interview-avatar">
                      {getInitials(interview.name)}
                    </div>
                    <div className="rd2-interview-info">
                      <p className="rd2-interview-name">{interview.name}</p>
                      <p className="rd2-interview-job">{interview.jobTitle}</p>
                    </div>
                    <div className="rd2-interview-time">
                      <p className="rd2-interview-datetime">{formatDateTime(interview.interviewTime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Browse Candidates ── */}
          <div className="rd2-panel">
            <div className="rd2-panel-header">
              <h2 className="rd2-panel-title">
                <IconUsers />
                Top Candidates
              </h2>
              <button
                className="rd2-panel-link"
                onClick={() => navigate("/candidates")}
              >
                View All →
              </button>
            </div>

            {candidatesLoading ? (
              <p className="rd2-panel-empty">Loading…</p>
            ) : candidates.length === 0 ? (
              <div className="rd2-panel-empty-state">
                <p className="rd2-panel-empty-title">No candidates yet</p>
                <p className="rd2-panel-empty-sub">Registered students will appear here.</p>
              </div>
            ) : (
              <div className="rd2-candidates-scroll">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rd2-candidate-card"
                    onClick={() => navigate(`/candidate/${candidate.id}`)}
                  >
                    <div className="rd2-candidate-avatar">
                      {getInitials(candidate.name)}
                    </div>
                    <div className="rd2-candidate-info">
                      <div className="rd2-candidate-name-row">
                        <p className="rd2-candidate-name">{candidate.name || "Unnamed"}</p>
                        {typeof candidate.profileStrength === "number" && (
                          <span className="rd2-strength-badge" title="Profile completeness">
                            {candidate.profileStrength}%
                          </span>
                        )}
                      </div>
                      <p className="rd2-candidate-title">
                        {candidate.jobTitle || "No title set"}
                        {candidate.company ? ` · ${candidate.company}` : ""}
                      </p>
                      {candidate.skills?.length > 0 && (
                        <div className="rd2-candidate-skills">
                          {candidate.skills.slice(0, 3).map((s, i) => (
                            <span key={i} className="rd2-skill-chip">{s}</span>
                          ))}
                          {candidate.skills.length > 3 && (
                            <span className="rd2-skill-chip rd2-skill-more">+{candidate.skills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="rd2-candidate-arrow">→</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Post Job Modal ── */}
      {showModal && (
        <div className="rd2-modal-overlay" onClick={closeModal}>
          <div className="rd2-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rd2-modal-header">
              <h2>Post a New Job</h2>
              <button className="rd2-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="rd2-modal-body">
              <div className="rd2-form-row">
                <div className="rd2-form-field">
                  <label>Job Title *</label>
                  <input name="jobTitle" value={form.jobTitle} onChange={handleFormChange} placeholder="e.g. Software Engineer" />
                </div>
                <div className="rd2-form-field">
                  <label>Company *</label>
                  <input name="company" value={form.company} onChange={handleFormChange} placeholder="Company name" />
                </div>
              </div>

              <div className="rd2-form-row">
                <div className="rd2-form-field">
                  <label>Location</label>
                  <input name="location" value={form.location} onChange={handleFormChange} placeholder="City / Remote" />
                </div>
                <div className="rd2-form-field">
                  <label>Experience</label>
                  <input name="experience" value={form.experience} onChange={handleFormChange} placeholder="e.g. 2–4 years" />
                </div>
              </div>

              <div className="rd2-form-row">
                <div className="rd2-form-field">
                  <label>Job Type</label>
                  <select name="jobType" value={form.jobType} onChange={handleFormChange}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div className="rd2-form-field">
                  <label>
                    Package{" "}
                    <span className="rd2-label-hint">
                      ({form.jobType === "FULL_TIME" ? "LPA" : form.jobType === "INTERNSHIP" ? "₹/month" : "₹/hr"})
                    </span>
                  </label>
                  <input name="packageOffered" type="number" value={form.packageOffered} onChange={handleFormChange} placeholder="e.g. 12" />
                </div>
              </div>

              <div className="rd2-form-field">
                <label>About the Role</label>
                <textarea name="about" value={form.about} onChange={handleFormChange} placeholder="Short summary..." rows={2} />
              </div>

              <div className="rd2-form-field">
                <label>Job Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Detailed responsibilities..." rows={3} />
              </div>

              <div className="rd2-form-field">
                <label>Skills Required</label>
                <div className="rd2-skill-row">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Type a skill and press Enter or Add"
                  />
                  <button className="rd2-btn-sm-ghost" onClick={addSkill}>Add</button>
                </div>
                {skills.length > 0 && (
                  <div className="rd2-skill-tags">
                    {skills.map((s, i) => (
                      <span key={i} className="rd2-skill-tag">
                        {s}
                        <button className="rd2-skill-remove" onClick={() => removeSkill(s)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {postMsg.text && (
                <p className={postMsg.type === "success" ? "rd2-msg-success" : "rd2-msg-error"}>
                  {postMsg.text}
                </p>
              )}
            </div>

            <div className="rd2-modal-footer">
              <button className="rd2-btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="rd2-btn-post" onClick={handlePostJob} disabled={posting}>
                {posting ? "Posting..." : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
