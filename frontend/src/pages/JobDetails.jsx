import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import ReportButton from "../components/ReportButton.jsx";
import BASE_URL from "../api";
import "./JobDetails.css";

function timeAgo(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

function StarRow({ rating = 4.2 }) {
  const full = Math.floor(rating);
  return (
    <div className="exp-star-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? "star filled" : "star empty"}>★</span>
      ))}
    </div>
  );
}

export default function JobDetails() {
  const [job, setJob] = useState(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", website: "", resume: "", coverLetter: "",
  });

  // ── interview exp state ──────────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [ownReview, setOwnReview] = useState(null);   // from getMine — null means not posted
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [editMsg, setEditMsg] = useState("");
  const [expError, setExpError] = useState("");
  const [expSuccess, setExpSuccess] = useState("");

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const accountType = localStorage.getItem("accountType");
  const jobId = new URLSearchParams(window.location.search).get("id");
  const navigate = useNavigate();

  const canReport = accountType === "APPLICANT" || accountType === "EMPLOYER" || accountType === "COMPANY";

  // ── fetch job ────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/jobs/get/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setJob(data))
      .catch((err) => console.error("Failed to fetch job:", err));
  }, [jobId]);

  // ── fetch reviews (others) + own review in parallel ──────
  function fetchReviews() {
    setReviewsLoading(true);

    const othersPromise = fetch(`${BASE_URL}/intexp/getAll/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => res.json());

    // getMine is APPLICANT only — EMPLOYER skips it
    const minePromise = accountType === "APPLICANT"
      ? fetch(`${BASE_URL}/intexp/getMine/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
          // 200 with null body when no review exists
          const text = res.text();
          return text.then((t) => (t ? JSON.parse(t) : null));
        })
      : Promise.resolve(null);

    Promise.all([othersPromise, minePromise])
      .then(([others, mine]) => {
        setReviews(others || []);
        setOwnReview(mine);             // null = not posted, object = has review
        if (mine) setEditMsg(mine.msg); // pre-fill edit textarea
      })
      .catch((err) => console.error("Failed to fetch reviews:", err))
      .finally(() => setReviewsLoading(false));
  }

  useEffect(() => {
    if (jobId) fetchReviews();
  }, [jobId]);

  // ── apply ────────────────────────────────────────────────
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleApply() {
    fetch(`${BASE_URL}/jobs/apply/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        applicantId: Number(userId),
        name: form.name, email: form.email, phone: Number(form.phone),
        website: form.website, resume: form.resume, coverLetter: form.coverLetter,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Applied Successfully") {
          setApplied(true); setShowModal(false); setError("");
        } else {
          setError(data.errorMessage || "Something went wrong.");
        }
      })
      .catch((err) => console.error("Apply failed:", err));
  }

  // ── review: post ─────────────────────────────────────────
  function handlePostReview() {
    setExpError(""); setExpSuccess("");
    if (!formMsg.trim()) { setExpError("Review cannot be empty."); return; }
    fetch(`${BASE_URL}/intexp/post`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ msg: formMsg.trim(), jobId: Number(jobId) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Review Posted Successfully") {
          setExpSuccess("Review posted.");
          setFormMsg("");
          fetchReviews(); // refetch both — getMine will now return the new review
        } else {
          setExpError(data.errorMessage || "Could not post review.");
        }
      })
      .catch(() => setExpError("Network error. Please try again."));
  }

  // ── review: update ───────────────────────────────────────
  function handleUpdateReview() {
    setExpError(""); setExpSuccess("");
    if (!editMsg.trim()) { setExpError("Review cannot be empty."); return; }
    fetch(`${BASE_URL}/intexp/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ msg: editMsg.trim(), jobId: Number(jobId) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Review Updated Successfully") {
          setExpSuccess("Review updated.");
          setEditMode(false);
          fetchReviews();
        } else {
          setExpError(data.errorMessage || "Could not update review.");
        }
      })
      .catch(() => setExpError("Network error. Please try again."));
  }

  // ── review: delete ───────────────────────────────────────
  function handleDeleteReview() {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    setExpError(""); setExpSuccess("");
    fetch(`${BASE_URL}/intexp/delete/${jobId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Review Deleted Successfully") {
          setOwnReview(null);
          setEditMsg("");
          setEditMode(false);
          setExpSuccess("Review deleted.");
          fetchReviews();
        } else {
          setExpError(data.errorMessage || "Could not delete review.");
        }
      })
      .catch(() => setExpError("Network error. Please try again."));
  }

  if (!job) return <div className="loading">Loading...</div>;

  return (
    <div className="job-details-page">
      <Navbar />
      <main className="job-details-main">

        <div className="job-header">
          <div className="job-header-top-row">
            <h1 className="job-title">{job.jobTitle}</h1>
            {canReport && (
              <ReportButton targetType="JOB" targetId={Number(jobId)} />
            )}
          </div>
          <p className="job-meta"><span className="meta-label">Company:</span> {job.company}</p>
          <p className="job-meta"><span className="meta-label">Location:</span> {job.location}</p>
          <p className="job-meta"><span className="meta-label">Job Type:</span> {job.jobType}</p>
          <p className="job-meta"><span className="meta-label">Experience:</span> {job.experience}</p>
          {job.packageOffered && (
            <p className="job-package">
              ₹ {job.packageOffered}{" "}
              {job.jobType === "FULL_TIME" ? "LPA" : job.jobType === "INTERNSHIP" ? "per month" : "per hour"}
            </p>
          )}
        </div>

        {job.about && (
          <section className="job-section">
            <h2>About the Role</h2>
            <p>{job.about}</p>
          </section>
        )}

        {job.description && (
          <section className="job-section">
            <h2>Job Description</h2>
            <p>{job.description}</p>
          </section>
        )}

        {job.skillsRequired?.length > 0 && (
          <section className="job-section">
            <h2>Skills Required</h2>
            <div className="skills-list">
              {job.skillsRequired.map((skill, i) => (
                <span key={i} className="skill-tag">{skill}</span>
              ))}
            </div>
          </section>
        )}

        <div className="apply-section">
          {applied ? (
            <p className="success-msg">✓ Applied successfully!</p>
          ) : (
            <>
              {error && <p className="error-msg">{error}</p>}
              {accountType === "APPLICANT" && (
                <button className="btn-apply" onClick={() => setShowModal(true)}>
                  Apply Now
                </button>
              )}
            </>
          )}
          {accountType === "APPLICANT" && job.postedBy && (
            <button
              className="btn-chat-recruiter"
              onClick={() => navigate(`/chats/${job.postedBy}`)}
            >
              Chat with Recruiter
            </button>
          )}
        </div>

        {/* ══ INTERVIEW EXPERIENCES ══ */}
        <section className="exp-section">

          <div className="exp-section-header">
            <div className="exp-heading-row">
              <h2 className="exp-heading">Interview Experiences</h2>
              <span className="exp-count">
                {reviews.length + (ownReview ? 1 : 0)}{" "}
                {reviews.length + (ownReview ? 1 : 0) === 1 ? "review" : "reviews"}
              </span>
            </div>
            <div className="exp-rating-block">
              <span className="exp-rating-number">4.2</span>
              <div className="exp-rating-right">
                <StarRow rating={4.2} />
                <span className="exp-rating-soon">Rating system coming soon</span>
              </div>
            </div>
          </div>

          {/* Write form — only when APPLICANT and hasn't posted yet */}
          {accountType === "APPLICANT" && !ownReview && (
            <div className="exp-write-card">
              <p className="exp-write-label">Share your interview experience</p>
              <div className="exp-textarea-wrap">
                <textarea
                  className="exp-textarea"
                  placeholder="What was the interview process like? How many rounds? What topics were covered?"
                  value={formMsg}
                  onChange={(e) => setFormMsg(e.target.value)}
                  maxLength={2000}
                  rows={4}
                />
                <span className={`exp-char-count ${formMsg.length >= 1800 ? "exp-char-warn" : ""}`}>
                  {formMsg.length} / 2000
                </span>
              </div>
              {expError && <p className="exp-error">{expError}</p>}
              {expSuccess && <p className="exp-success">{expSuccess}</p>}
              <button className="exp-btn-submit" onClick={handlePostReview}>Post Review</button>
            </div>
          )}

          {/* Banners shown when write form is hidden */}
          {ownReview && expSuccess && <p className="exp-success exp-success-banner">{expSuccess}</p>}
          {ownReview && expError && <p className="exp-error exp-error-banner">{expError}</p>}

          {reviewsLoading ? (
            <p className="exp-status">Loading reviews…</p>
          ) : (reviews.length === 0 && !ownReview) ? (
            <div className="exp-empty">
              <p className="exp-empty-title">No reviews yet</p>
              <p className="exp-empty-sub">
                {accountType === "APPLICANT"
                  ? "Be the first to share your interview experience."
                  : "Applicants who interviewed here can share their experience."}
              </p>
            </div>
          ) : (
            <div className="exp-list">

              {ownReview && (
                <div className="exp-card exp-card-own">
                  <div className="exp-card-top">
                    <div className="exp-avatar">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" fill="#111111" />
                        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" fill="#111111" />
                      </svg>
                    </div>
                    <div className="exp-card-meta">
                      <span className="exp-anon-label">Anonymous Applicant · You</span>
                      <span className="exp-time">{timeAgo(ownReview.createdAt)}</span>
                    </div>
                    <div className="exp-own-actions">
                      <button
                        className="exp-btn-edit"
                        onClick={() => { setEditMode((prev) => !prev); setExpError(""); setExpSuccess(""); }}
                      >
                        {editMode ? "Cancel" : "Edit"}
                      </button>
                      <button className="exp-btn-delete" onClick={handleDeleteReview}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {editMode ? (
                    <div className="exp-edit-block">
                      <div className="exp-textarea-wrap">
                        <textarea
                          className="exp-textarea"
                          value={editMsg}
                          onChange={(e) => setEditMsg(e.target.value)}
                          maxLength={2000}
                          rows={4}
                        />
                        <span className={`exp-char-count ${editMsg.length >= 1800 ? "exp-char-warn" : ""}`}>
                          {editMsg.length} / 2000
                        </span>
                      </div>
                      {expError && <p className="exp-error">{expError}</p>}
                      {expSuccess && <p className="exp-success">{expSuccess}</p>}
                      <button className="exp-btn-submit" onClick={handleUpdateReview}>Save Changes</button>
                    </div>
                  ) : (
                    <p className="exp-msg">{ownReview.msg}</p>
                  )}
                </div>
              )}

              {reviews.map((review, idx) => (
                <div key={review.id ?? idx} className="exp-card">
                  <div className="exp-card-top">
                    <div className="exp-avatar">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" fill="#111111" />
                        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" fill="#111111" />
                      </svg>
                    </div>
                    <div className="exp-card-meta">
                      <span className="exp-anon-label">Anonymous Applicant</span>
                      <span className="exp-time">{timeAgo(review.createdAt)}</span>
                    </div>
                    {canReport && review.id != null && (
                      <ReportButton targetType="INTERVIEW_EXP" targetId={review.id} />
                    )}
                  </div>
                  <p className="exp-msg">{review.msg}</p>
                </div>
              ))}

            </div>
          )}
        </section>

      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Apply for {job.jobTitle}</h2>
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
            <label>Email</label>
            <input name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit number" type="number" />
            <label>Website / LinkedIn</label>
            <input name="website" value={form.website} onChange={handleChange} placeholder="https://..." />
            <label>Resume Link</label>
            <input name="resume" value={form.resume} onChange={handleChange} placeholder="Google Drive or any public link" />
            <label>Cover Letter</label>
            <textarea name="coverLetter" value={form.coverLetter} onChange={handleChange} placeholder="Why are you a good fit?" rows={4} />
            {error && <p className="error-msg">{error}</p>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-apply" onClick={handleApply}>Submit Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
