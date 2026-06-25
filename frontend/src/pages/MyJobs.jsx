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
    <div className="mj-page">
      <Navbar />
      <main className="mj-main">

        {/* ── Header ── */}
        <div className="mj-header">
          <div>
            <h1 className="mj-title">My Jobs</h1>
            <p className="mj-subtitle">Manage your postings and review applicants</p>
          </div>
          <button className="mj-btn-post" onClick={() => setShowPostModal(true)}>
            + Post New Job
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="mj-stats">
          <div className="mj-stat">
            <p className="mj-stat-label">Jobs Posted</p>
            <p className="mj-stat-value">{jobsLoading ? "—" : totalJobs}</p>
          </div>
          <div className="mj-stat">
            <p className="mj-stat-label">Open</p>
            <p className="mj-stat-value mj-stat-purple">{jobsLoading ? "—" : openJobs}</p>
          </div>
          <div className="mj-stat">
            <p className="mj-stat-label">Total Applicants</p>
            <p className="mj-stat-value">{jobsLoading ? "—" : totalApplicants}</p>
          </div>
        </div>

        {/* ── Error ── */}
        {jobsError && <p className="mj-error">{jobsError}</p>}

        {/* ── Job List ── */}
        {!jobsLoading && !jobsError && jobs.length === 0 && (
          <div className="mj-empty">
            <p className="mj-empty-title">No jobs posted yet</p>
            <p className="mj-empty-sub">Hit "Post New Job" to get started.</p>
          </div>
        )}

        {!jobsLoading && jobs.length > 0 && (
          <div className="mj-job-list">
            {jobs.slice().reverse().map((job) => {
              const isExpanded = expandedJobId === job.id;
              return (
                <div key={job.id} className={`mj-job-card ${isExpanded ? "mj-job-card-open" : ""}`}>

                  {/* ── Card header (clickable) ── */}
                  <div
                    className="mj-job-card-header"
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  >
                    <div className="mj-job-card-left">
                      <div className="mj-job-card-top">
                        <span className={`mj-status-pill ${job.status === "OPEN" ? "mj-pill-open" : "mj-pill-closed"}`}>
                          {job.status}
                        </span>
                        <span className="mj-job-type-chip">{job.jobType?.replace("_", " ")}</span>
                      </div>
                      <h2 className="mj-job-title">{job.jobTitle}</h2>
                      <p className="mj-job-meta">
                        {job.company}
                        {job.location ? ` · ${job.location}` : ""}
                      </p>
                      <p className="mj-job-footer-meta">
                        {job.applicants?.length || 0} applicant{job.applicants?.length !== 1 ? "s" : ""}
                        {job.postTime ? ` · Posted ${formatDate(job.postTime)}` : ""}
                      </p>
                    </div>

                    <div className="mj-job-card-right">
                      <div className="mj-job-actions">
                        <button
                          className="mj-btn-sm mj-btn-ghost"
                          onClick={(e) => openEditModal(job, e)}
                        >
                          Edit
                        </button>
                        <button
                          className={`mj-btn-sm ${job.status === "OPEN" ? "mj-btn-orange" : "mj-btn-green"}`}
                          onClick={(e) => toggleJobStatus(job, e)}
                        >
                          {job.status === "OPEN" ? "Close" : "Reopen"}
                        </button>
                        <button
                          className="mj-btn-sm mj-btn-red"
                          onClick={(e) => deleteJob(job, e)}
                        >
                          Delete
                        </button>
                      </div>
                      <span className="mj-accordion-arrow">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* ── Applicants accordion ── */}
                  {isExpanded && (
                    <div className="mj-applicants-panel">
                      <div className="mj-applicants-header">
                        <span className="mj-applicants-title">
                          Applicants
                        </span>
                        <span className="mj-applicants-count">
                          {job.applicants?.length || 0} total
                        </span>
                      </div>

                      {!job.applicants?.length ? (
                        <p className="mj-no-applicants">No applicants yet for this job.</p>
                      ) : (
                        <div className="mj-applicant-list">
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
                               <div key={`${job.id}-${applicant.applicationId ?? idx}`} className="mj-applicant-row">

                                {/* Top: name + current badge */}
                                <div className="mj-applicant-row-top">
                                  <div>
                                    <p className="mj-applicant-name">{applicant.name}</p>
                                    <p className="mj-applicant-email">{applicant.email}</p>
                                  </div>
                                  <StatusBadge status={applicant.applicationStatus} />
                                </div>

                                {/* Applied date + phone */}
                                <p className="mj-applicant-meta">
                                  Applied {formatDate(applicant.timestamp)}
                                  {applicant.phone ? ` · ${applicant.phone}` : ""}
                                </p>

                                {/* Links */}
                                <div className="mj-applicant-links">
                                  {applicant.resume && (
                                    <a
                                      href={applicant.resume}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mj-applicant-link"
                                    >
                                      📄 Resume ↗
                                    </a>
                                  )}
                                  {applicant.website && (
                                    <a
                                      href={applicant.website}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mj-applicant-link"
                                    >
                                      🔗 Portfolio ↗
                                    </a>
                                  )}
                                </div>

                                {/* Cover letter toggle */}
                                {applicant.coverLetter && (
                                  <>
                                    <button
                                      className="mj-btn-sm mj-btn-ghost"
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
                                      <p className="mj-cover-letter">{applicant.coverLetter}</p>
                                    )}
                                  </>
                                )}

                                {/* Status controls */}
                                <div className="mj-status-controls">
                                  <select
                                    className="mj-status-select"
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
                                      className="mj-interview-input"
                                      type="datetime-local"
                                      value={aState.interviewTime}
                                      onChange={(e) =>
                                        updateAppField(applicant.applicationId, "interviewTime", e.target.value)
                                      }
                                    />
                                  )}

                                  <button
                                    className="mj-btn-sm mj-btn-purple"
                                    onClick={() => saveAppStatus(applicant)}
                                    disabled={aState.saving}
                                  >
                                    {aState.saving ? "Saving…" : "Save"}
                                  </button>

                                  {aState.msg && (
                                    <span
                                      className={
                                        aState.msg.startsWith("✓")
                                          ? "mj-save-success"
                                          : "mj-save-error"
                                      }
                                    >
                                      {aState.msg}
                                    </span>
                                  )}
                                </div>

                                {/* Already-scheduled interview time */}
                                {applicant.applicationStatus === "INTERVIEWING" && applicant.interviewTime && (
                                  <p className="mj-interview-scheduled">
                                    📅 Interview scheduled: {formatDateTime(applicant.interviewTime)}
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
        <div className="mj-overlay" onClick={closePostModal}>
          <div className="mj-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mj-modal-header">
              <h2>Post a New Job</h2>
              <button className="mj-modal-close" onClick={closePostModal}>✕</button>
            </div>

            <div className="mj-modal-body">
              <div className="mj-form-row">
                <div className="mj-form-field">
                  <label>Job Title *</label>
                  <input
                    name="jobTitle"
                    value={form.jobTitle}
                    onChange={handleFormChange}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div className="mj-form-field">
                  <label>Company *</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleFormChange}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="mj-form-row">
                <div className="mj-form-field">
                  <label>Location</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="City / Remote"
                  />
                </div>
                <div className="mj-form-field">
                  <label>Experience</label>
                  <input
                    name="experience"
                    value={form.experience}
                    onChange={handleFormChange}
                    placeholder="e.g. 2–4 years"
                  />
                </div>
              </div>

              <div className="mj-form-row">
                <div className="mj-form-field">
                  <label>Job Type</label>
                  <select name="jobType" value={form.jobType} onChange={handleFormChange}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div className="mj-form-field">
                  <label>
                    Package{" "}
                    <span className="mj-label-hint">
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

              <div className="mj-form-field">
                <label>About the Role</label>
                <textarea
                  name="about"
                  value={form.about}
                  onChange={handleFormChange}
                  placeholder="Short summary of the role..."
                  rows={2}
                />
              </div>

              <div className="mj-form-field">
                <label>Job Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Detailed responsibilities and requirements..."
                  rows={3}
                />
              </div>

              <div className="mj-form-field">
                <label>Skills Required</label>
                <div className="mj-skill-row">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Type a skill and press Enter or Add"
                  />
                  <button className="mj-btn-sm mj-btn-ghost" onClick={addSkill}>Add</button>
                </div>
                {skills.length > 0 && (
                  <div className="mj-skill-tags">
                    {skills.map((s, i) => (
                      <span key={i} className="mj-skill-tag">
                        {s}
                        <button className="mj-skill-remove" onClick={() => removeSkill(s)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {postMsg.text && (
                <p className={postMsg.type === "success" ? "mj-msg-success" : "mj-msg-error"}>
                  {postMsg.text}
                </p>
              )}
            </div>

            <div className="mj-modal-footer">
              <button className="mj-btn-cancel" onClick={closePostModal}>Cancel</button>
              <button className="mj-btn-post" onClick={handlePostJob} disabled={posting}>
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
        <div className="mj-overlay" onClick={() => setEditTarget(null)}>
          <div className="mj-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mj-modal-header">
              <h2>Edit Job</h2>
              <button className="mj-modal-close" onClick={() => setEditTarget(null)}>✕</button>
            </div>

            <div className="mj-modal-body">
              <div className="mj-form-row">
                <div className="mj-form-field">
                  <label>Job Title</label>
                  <input name="jobTitle" value={editForm.jobTitle} onChange={handleEditFormChange} />
                </div>
                <div className="mj-form-field">
                  <label>Company</label>
                  <input name="company" value={editForm.company} onChange={handleEditFormChange} />
                </div>
              </div>

              <div className="mj-form-row">
                <div className="mj-form-field">
                  <label>Location</label>
                  <input name="location" value={editForm.location} onChange={handleEditFormChange} />
                </div>
                <div className="mj-form-field">
                  <label>Experience</label>
                  <input name="experience" value={editForm.experience} onChange={handleEditFormChange} placeholder="e.g. 2–4 years" />
                </div>
              </div>

              <div className="mj-form-row">
                <div className="mj-form-field">
                  <label>Job Type</label>
                  <select name="jobType" value={editForm.jobType} onChange={handleEditFormChange}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div className="mj-form-field">
                  <label>Package</label>
                  <input name="packageOffered" type="number" value={editForm.packageOffered} onChange={handleEditFormChange} />
                </div>
              </div>

              <div className="mj-form-field">
                <label>About the Role</label>
                <textarea name="about" value={editForm.about} onChange={handleEditFormChange} rows={2} />
              </div>

              <div className="mj-form-field">
                <label>Job Description</label>
                <textarea name="description" value={editForm.description} onChange={handleEditFormChange} rows={3} />
              </div>

              <div className="mj-form-field">
                <label>Skills Required</label>
                <div className="mj-skill-row">
                  <input
                    value={editSkillInput}
                    onChange={(e) => setEditSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEditSkill()}
                    placeholder="Add a skill"
                  />
                  <button className="mj-btn-sm mj-btn-ghost" onClick={addEditSkill}>Add</button>
                </div>
                {editSkills.length > 0 && (
                  <div className="mj-skill-tags">
                    {editSkills.map((s, i) => (
                      <span key={i} className="mj-skill-tag">
                        {s}
                        <button className="mj-skill-remove" onClick={() => removeEditSkill(s)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {editError && <p className="mj-msg-error">{editError}</p>}
            </div>

            <div className="mj-modal-footer">
              <button className="mj-btn-cancel" onClick={() => setEditTarget(null)}>Cancel</button>
              <button className="mj-btn-post" onClick={saveEditJob} disabled={editSaving}>
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
