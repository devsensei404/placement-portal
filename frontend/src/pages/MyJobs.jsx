// MyJobs.jsx
// Route: /my-jobs
//
// Full job management for recruiters.
// Sections:
//   1. Header with "Post New Job" button
//   2. Stats row — total posted, open, total applicants
//   3. Job cards list — each card: title, company, location, type, status,
//      applicant count, posted date, action buttons (Edit, Close/Reopen, Delete)
//   4. Clicking a job card toggles an accordion panel showing applicants.
//      Each applicant row: name, email, applied date, status badge,
//      status dropdown + interview datetime (shown only when INTERVIEWING), Save button.
//   5. Post Job modal (same form as dashboard)
//   6. Edit Job modal

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import "./MyJobs.css";
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

// Small hand-drawn line icons (feather-style) — replace the emoji that used
// to sit inline in the applicant/interview copy.
function LinkIcon() {
  return (
    <svg
      className="mj2-icon-inline"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#111111"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="mj2-icon-inline"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#111111"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export default function MyJobs() {
  const token  = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // ── Jobs state ──
  const [jobs,        setJobs       ] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError,   setJobsError  ] = useState("");

  // ── Accordion: which job is expanded ──
  const [expandedJobId, setExpandedJobId] = useState(null);

  // ── Post Job modal ──
  const [showPostModal, setShowPostModal] = useState(false);
  const [form,          setForm         ] = useState(EMPTY_FORM);
  const [skillInput,    setSkillInput   ] = useState("");
  const [skills,        setSkills       ] = useState([]);
  const [posting,       setPosting      ] = useState(false);
  const [postMsg,       setPostMsg      ] = useState({ text: "", type: "" });

  // ── Edit Job modal ──
  const [editTarget,     setEditTarget    ] = useState(null);
  const [editForm,       setEditForm      ] = useState(EMPTY_FORM);
  const [editSkills,     setEditSkills    ] = useState([]);
  const [editSkillInput, setEditSkillInput] = useState("");
  const [editSaving,     setEditSaving    ] = useState(false);
  const [editError,      setEditError     ] = useState("");

  // ── Per-applicant status state ──
  // { [applicationId]: { status, interviewTime, saving, msg } }
  const [appState, setAppState] = useState({});

  // ── Cover letter expand ──
  const [expandedCL, setExpandedCL] = useState({});

  // ─────────────────────────────────
  // FETCH JOBS
  // ─────────────────────────────────
  useEffect(() => {
    fetchJobs();
  }, []);

  function fetchJobs() {
    setJobsLoading(true);
    fetch(`${BASE}/jobs/postedBy/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load jobs.");
        return res.json();
      })
      .then((data) => {
        setJobs(data);
        // Keep expanded job in sync after refresh
        setExpandedJobId((prev) => {
          if (!prev) return null;
          const still = data.find((j) => j.id === prev);
          return still ? prev : null;
        });
      })
      .catch((err) => setJobsError(err.message))
      .finally(() => setJobsLoading(false));
  }

  // ─────────────────────────────────
  // STATS
  // ─────────────────────────────────
  const totalJobs       = jobs.length;
  const openJobs        = jobs.filter((j) => j.status === "OPEN").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicants?.length || 0), 0);

  // ─────────────────────────────────
  // POST JOB
  // ─────────────────────────────────
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

  function closePostModal() {
    setShowPostModal(false);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to post job.");
      }
      setPostMsg({ text: "Job posted successfully!", type: "success" });
      fetchJobs();
      setTimeout(() => closePostModal(), 1200);
    } catch (err) {
      setPostMsg({ text: err.message, type: "error" });
    } finally {
      setPosting(false);
    }
  }

  // ─────────────────────────────────
  // CLOSE / REOPEN
  // ─────────────────────────────────
  async function toggleJobStatus(job, e) {
    e.stopPropagation();
    const endpoint = job.status === "OPEN" ? "close" : "reopen";
    try {
      const res = await fetch(`${BASE}/jobs/${endpoint}/${job.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      fetchJobs();
    } catch {
      alert("Failed to update job status.");
    }
  }

  // ─────────────────────────────────
  // DELETE
  // ─────────────────────────────────
  async function deleteJob(job, e) {
    e.stopPropagation();
    if (job.applicants?.length > 0) {
      alert("Cannot delete a job that already has applicants.");
      return;
    }
    if (!window.confirm(`Delete "${job.jobTitle}"?`)) return;
    try {
      const res = await fetch(`${BASE}/jobs/delete/${job.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      if (expandedJobId === job.id) setExpandedJobId(null);
      fetchJobs();
    } catch {
      alert("Failed to delete job.");
    }
  }

  // ─────────────────────────────────
  // EDIT JOB MODAL
  // ─────────────────────────────────
  function openEditModal(job, e) {
    e.stopPropagation();
    setEditTarget(job);
    setEditForm({
      jobTitle:       job.jobTitle       || "",
      company:        job.company        || "",
      location:       job.location       || "",
      experience:     job.experience     || "",
      jobType:        job.jobType        || "FULL_TIME",
      packageOffered: job.packageOffered != null ? job.packageOffered : "",
      about:          job.about          || "",
      description:    job.description    || "",
    });
    setEditSkills(job.skillsRequired ? [...job.skillsRequired] : []);
    setEditSkillInput("");
    setEditError("");
  }

  function handleEditFormChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  function addEditSkill() {
    const t = editSkillInput.trim();
    if (!t || editSkills.includes(t)) return;
    setEditSkills([...editSkills, t]);
    setEditSkillInput("");
  }

  function removeEditSkill(s) {
    setEditSkills(editSkills.filter((x) => x !== s));
  }

  async function saveEditJob() {
    setEditSaving(true);
    setEditError("");
    try {
      const payload = {
        ...editForm,
        packageOffered: editForm.packageOffered !== "" ? Number(editForm.packageOffered) : null,
        skillsRequired: editSkills,
      };
      const res = await fetch(`${BASE}/jobs/update/${editTarget.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to update job.");
      }
      setEditTarget(null);
      fetchJobs();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  // ─────────────────────────────────
  // APPLICANT STATUS
  // ─────────────────────────────────
  function initAppState(applicant) {
    setAppState((prev) => {
      if (prev[applicant.applicationId]) return prev;
      return {
        ...prev,
        [applicant.applicationId]: {
          status:        applicant.applicationStatus,
          interviewTime: applicant.interviewTime
            ? applicant.interviewTime.slice(0, 16)
            : "",
          saving: false,
          msg:    "",
        },
      };
    });
  }

  function updateAppField(id, field, value) {
    setAppState((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  async function saveAppStatus(applicant) {
    const state = appState[applicant.applicationId];
    if (!state) return;
    updateAppField(applicant.applicationId, "saving", true);
    updateAppField(applicant.applicationId, "msg", "");
    try {
      const payload = {
        id:                applicant.applicationId,
        applicantId:       applicant.applicationId,
        applicationStatus: state.status,
        interviewTime:     state.status === "INTERVIEWING" && state.interviewTime
          ? state.interviewTime + ":00"
          : null,
      };
      const res = await fetch(`${BASE}/jobs/changeAppStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to update status.");
      }
      updateAppField(applicant.applicationId, "msg", "✓ Saved");
      fetchJobs();
    } catch (err) {
      updateAppField(applicant.applicationId, "msg", err.message);
    } finally {
      updateAppField(applicant.applicationId, "saving", false);
    }
  }

  // ─────────────────────────────────
  // HELPERS
  // ─────────────────────────────────
  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  function formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  // ─────────────────────────────────
  // RENDER
  // ─────────────────────────────────
  return (
    <div className="mj2-page">
      <Navbar />
      <main className="mj2-main">

        {/* ── Header ── */}
        <div className="mj2-header">
          <div>
            <h1 className="mj2-title">My Jobs</h1>
            <p className="mj2-subtitle">Manage your postings and review applicants</p>
          </div>
          <button className="mj2-btn-post" onClick={() => setShowPostModal(true)}>
            + Post New Job
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="mj2-stats">
          <div className="mj2-stat">
            <p className="mj2-stat-label">Jobs Posted</p>
            <p className="mj2-stat-value">{jobsLoading ? "—" : totalJobs}</p>
          </div>
          <div className="mj2-stat">
            <p className="mj2-stat-label">Open</p>
            <p className="mj2-stat-value mj2-stat-accent">{jobsLoading ? "—" : openJobs}</p>
          </div>
          <div className="mj2-stat">
            <p className="mj2-stat-label">Total Applicants</p>
            <p className="mj2-stat-value">{jobsLoading ? "—" : totalApplicants}</p>
          </div>
        </div>

        {/* ── Error ── */}
        {jobsError && <p className="mj2-error">{jobsError}</p>}

        {/* ── Job List ── */}
        {!jobsLoading && !jobsError && jobs.length === 0 && (
          <div className="mj2-empty">
            <p className="mj2-empty-title">No jobs posted yet</p>
            <p className="mj2-empty-sub">Hit "Post New Job" to get started.</p>
          </div>
        )}

        {!jobsLoading && jobs.length > 0 && (
          <div className="mj2-job-list">
            {jobs.slice().reverse().map((job) => {
              const isExpanded = expandedJobId === job.id;
              return (
                <div key={job.id} className={`mj2-job-card ${isExpanded ? "mj2-job-card-open" : ""}`}>

                  {/* ── Card header (clickable) ── */}
                  <div
                    className="mj2-job-card-header"
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  >
                    <div className="mj2-job-card-left">
                      <div className="mj2-job-card-top">
                        <span className={`mj2-status-pill ${job.status === "OPEN" ? "mj2-pill-open" : "mj2-pill-closed"}`}>
                          {job.status}
                        </span>
                        <span className="mj2-job-type-chip">{job.jobType?.replace("_", " ")}</span>
                      </div>
                      <h2 className="mj2-job-title">{job.jobTitle}</h2>
                      <p className="mj2-job-meta">
                        {job.company}
                        {job.location ? ` · ${job.location}` : ""}
                      </p>
                      <p className="mj2-job-footer-meta">
                        {job.applicants?.length || 0} applicant{job.applicants?.length !== 1 ? "s" : ""}
                        {job.postTime ? ` · Posted ${formatDate(job.postTime)}` : ""}
                      </p>
                    </div>

                    <div className="mj2-job-card-right">
                      <div className="mj2-job-actions">
                        <button
                          className="mj2-btn-sm mj2-btn-ghost"
                          onClick={(e) => openEditModal(job, e)}
                        >
                          Edit
                        </button>
                        <button
                          className={`mj2-btn-sm ${job.status === "OPEN" ? "mj2-btn-orange" : "mj2-btn-green"}`}
                          onClick={(e) => toggleJobStatus(job, e)}
                        >
                          {job.status === "OPEN" ? "Close" : "Reopen"}
                        </button>
                        <button
                          className="mj2-btn-sm mj2-btn-red"
                          onClick={(e) => deleteJob(job, e)}
                        >
                          Delete
                        </button>
                      </div>
                      <span className="mj2-accordion-arrow">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* ── Applicants accordion ── */}
                  {isExpanded && (
                    <div className="mj2-applicants-panel">
                      <div className="mj2-applicants-header">
                        <span className="mj2-applicants-title">
                          Applicants
                        </span>
                        <span className="mj2-applicants-count">
                          {job.applicants?.length || 0} total
                        </span>
                      </div>

                      {!job.applicants?.length ? (
                        <p className="mj2-no-applicants">No applicants yet for this job.</p>
                      ) : (
                        <div className="mj2-applicant-list">
                          {job.applicants.map((applicant,idx) => {
                            // Lazy-init per-applicant state
                            if (!appState[applicant.applicationId]) {
                              initAppState(applicant);
                            }
                            const aState = appState[applicant.applicationId] || {
                              status:        applicant.applicationStatus,
                              interviewTime: "",
                              saving:        false,
                              msg:           "",
                            };

                            return (
                               <div key={`${job.id}-${applicant.applicationId ?? idx}`} className="mj2-applicant-row">

                                {/* Top: name + current badge */}
                                <div className="mj2-applicant-row-top">
                                  <div>
                                    <p className="mj2-applicant-name">{applicant.name}</p>
                                    <p className="mj2-applicant-email">{applicant.email}</p>
                                  </div>
                                  <StatusBadge status={applicant.applicationStatus} />
                                </div>

                                {/* Applied date + phone */}
                                <p className="mj2-applicant-meta">
                                  Applied {formatDate(applicant.timestamp)}
                                  {applicant.phone ? ` · ${applicant.phone}` : ""}
                                </p>

                                {/* Links */}
                                <div className="mj2-applicant-links">
                                  {applicant.resume && (
                                    <a
                                      href={applicant.resume}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mj2-applicant-link"
                                    >
                                       Resume ↗
                                    </a>
                                  )}
                                  {applicant.website && (
                                    <a
                                      href={applicant.website}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mj2-applicant-link"
                                    >
                                      <LinkIcon /> Portfolio ↗
                                    </a>
                                  )}
                                </div>

                                {/* Cover letter toggle */}
                                {applicant.coverLetter && (
                                  <>
                                    <button
                                      className="mj2-btn-sm mj2-btn-ghost"
                                      style={{ marginTop: "8px", alignSelf: "flex-start" }}
                                      onClick={() =>
                                        setExpandedCL((prev) => ({
                                          ...prev,
                                          [applicant.applicationId]: !prev[applicant.applicationId],
                                        }))
                                      }
                                    >
                                      {expandedCL[applicant.applicationId] ? "Hide" : "Read"} Cover Letter
                                    </button>
                                    {expandedCL[applicant.applicationId] && (
                                      <p className="mj2-cover-letter">{applicant.coverLetter}</p>
                                    )}
                                  </>
                                )}

                                {/* Status controls */}
                                <div className="mj2-status-controls">
                                  <select
                                    className="mj2-status-select"
                                    value={aState.status}
                                    onChange={(e) =>
                                      updateAppField(applicant.applicationId, "status", e.target.value)
                                    }
                                  >
                                    <option value="APPLIED">Applied</option>
                                    <option value="INTERVIEWING">Interviewing</option>
                                    <option value="OFFERED">Offered</option>
                                    <option value="REJECTED">Rejected</option>
                                  </select>

                                  {aState.status === "INTERVIEWING" && (
                                    <input
                                      className="mj2-interview-input"
                                      type="datetime-local"
                                      value={aState.interviewTime}
                                      onChange={(e) =>
                                        updateAppField(applicant.applicationId, "interviewTime", e.target.value)
                                      }
                                    />
                                  )}

                                  <button
                                    className="mj2-btn-sm mj2-btn-primary"
                                    onClick={() => saveAppStatus(applicant)}
                                    disabled={aState.saving}
                                  >
                                    {aState.saving ? "Saving…" : "Save"}
                                  </button>

                                  <button
                                    className="mj2-btn-sm mj2-btn-ghost"
                                    onClick={() => navigate(`/chats/${applicant.applicantId}`)}
                                  >
                                     Message
                                  </button>

                                  {aState.msg && (
                                    <span
                                      className={
                                        aState.msg.startsWith("✓")
                                          ? "mj2-save-success"
                                          : "mj2-save-error"
                                      }
                                    >
                                      {aState.msg}
                                    </span>
                                  )}
                                </div>

                                {/* Already-scheduled interview time */}
                                {applicant.applicationStatus === "INTERVIEWING" && applicant.interviewTime && (
                                  <p className="mj2-interview-scheduled">
                                    <CalendarIcon /> Interview scheduled: {formatDateTime(applicant.interviewTime)}
                                  </p>
                                )}

                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ══════════════════════════════
          POST JOB MODAL
      ══════════════════════════════ */}
      {showPostModal && (
        <div className="mj2-overlay" onClick={closePostModal}>
          <div className="mj2-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mj2-modal-header">
              <h2>Post a New Job</h2>
              <button className="mj2-modal-close" onClick={closePostModal}>✕</button>
            </div>

            <div className="mj2-modal-body">
              <div className="mj2-form-row">
                <div className="mj2-form-field">
                  <label>Job Title *</label>
                  <input
                    name="jobTitle"
                    value={form.jobTitle}
                    onChange={handleFormChange}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div className="mj2-form-field">
                  <label>Company *</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleFormChange}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="mj2-form-row">
                <div className="mj2-form-field">
                  <label>Location</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="City / Remote"
                  />
                </div>
                <div className="mj2-form-field">
                  <label>Experience</label>
                  <input
                    name="experience"
                    value={form.experience}
                    onChange={handleFormChange}
                    placeholder="e.g. 2–4 years"
                  />
                </div>
              </div>

              <div className="mj2-form-row">
                <div className="mj2-form-field">
                  <label>Job Type</label>
                  <select name="jobType" value={form.jobType} onChange={handleFormChange}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div className="mj2-form-field">
                  <label>
                    Package{" "}
                    <span className="mj2-label-hint">
                      ({form.jobType === "FULL_TIME" ? "LPA" : form.jobType === "INTERNSHIP" ? "₹/month" : "₹/hr"})
                    </span>
                  </label>
                  <input
                    name="packageOffered"
                    type="number"
                    value={form.packageOffered}
                    onChange={handleFormChange}
                    placeholder="e.g. 12"
                  />
                </div>
              </div>

              <div className="mj2-form-field">
                <label>About the Role</label>
                <textarea
                  name="about"
                  value={form.about}
                  onChange={handleFormChange}
                  placeholder="Short summary of the role..."
                  rows={2}
                />
              </div>

              <div className="mj2-form-field">
                <label>Job Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Detailed responsibilities and requirements..."
                  rows={3}
                />
              </div>

              <div className="mj2-form-field">
                <label>Skills Required</label>
                <div className="mj2-skill-row">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Type a skill and press Enter or Add"
                  />
                  <button className="mj2-btn-sm mj2-btn-ghost" onClick={addSkill}>Add</button>
                </div>
                {skills.length > 0 && (
                  <div className="mj2-skill-tags">
                    {skills.map((s, i) => (
                      <span key={i} className="mj2-skill-tag">
                        {s}
                        <button className="mj2-skill-remove" onClick={() => removeSkill(s)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {postMsg.text && (
                <p className={postMsg.type === "success" ? "mj2-msg-success" : "mj2-msg-error"}>
                  {postMsg.text}
                </p>
              )}
            </div>

            <div className="mj2-modal-footer">
              <button className="mj2-btn-cancel" onClick={closePostModal}>Cancel</button>
              <button className="mj2-btn-post" onClick={handlePostJob} disabled={posting}>
                {posting ? "Posting..." : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          EDIT JOB MODAL
      ══════════════════════════════ */}
      {editTarget && (
        <div className="mj2-overlay" onClick={() => setEditTarget(null)}>
          <div className="mj2-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mj2-modal-header">
              <h2>Edit Job</h2>
              <button className="mj2-modal-close" onClick={() => setEditTarget(null)}>✕</button>
            </div>

            <div className="mj2-modal-body">
              <div className="mj2-form-row">
                <div className="mj2-form-field">
                  <label>Job Title</label>
                  <input name="jobTitle" value={editForm.jobTitle} onChange={handleEditFormChange} />
                </div>
                <div className="mj2-form-field">
                  <label>Company</label>
                  <input name="company" value={editForm.company} onChange={handleEditFormChange} />
                </div>
              </div>

              <div className="mj2-form-row">
                <div className="mj2-form-field">
                  <label>Location</label>
                  <input name="location" value={editForm.location} onChange={handleEditFormChange} />
                </div>
                <div className="mj2-form-field">
                  <label>Experience</label>
                  <input name="experience" value={editForm.experience} onChange={handleEditFormChange} placeholder="e.g. 2–4 years" />
                </div>
              </div>

              <div className="mj2-form-row">
                <div className="mj2-form-field">
                  <label>Job Type</label>
                  <select name="jobType" value={editForm.jobType} onChange={handleEditFormChange}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div className="mj2-form-field">
                  <label>Package</label>
                  <input name="packageOffered" type="number" value={editForm.packageOffered} onChange={handleEditFormChange} />
                </div>
              </div>

              <div className="mj2-form-field">
                <label>About the Role</label>
                <textarea name="about" value={editForm.about} onChange={handleEditFormChange} rows={2} />
              </div>

              <div className="mj2-form-field">
                <label>Job Description</label>
                <textarea name="description" value={editForm.description} onChange={handleEditFormChange} rows={3} />
              </div>

              <div className="mj2-form-field">
                <label>Skills Required</label>
                <div className="mj2-skill-row">
                  <input
                    value={editSkillInput}
                    onChange={(e) => setEditSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEditSkill()}
                    placeholder="Add a skill"
                  />
                  <button className="mj2-btn-sm mj2-btn-ghost" onClick={addEditSkill}>Add</button>
                </div>
                {editSkills.length > 0 && (
                  <div className="mj2-skill-tags">
                    {editSkills.map((s, i) => (
                      <span key={i} className="mj2-skill-tag">
                        {s}
                        <button className="mj2-skill-remove" onClick={() => removeEditSkill(s)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {editError && <p className="mj2-msg-error">{editError}</p>}
            </div>

            <div className="mj2-modal-footer">
              <button className="mj2-btn-cancel" onClick={() => setEditTarget(null)}>Cancel</button>
              <button className="mj2-btn-post" onClick={saveEditJob} disabled={editSaving}>
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
