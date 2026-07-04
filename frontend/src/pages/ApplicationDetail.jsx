// ApplicationDetail.jsx
// Route: /application-detail?id={jobId}&applicantId={applicantId}
//
// Fetches the job by jobId, then finds the specific applicant entry
// by matching applicantId from the query param.
// Shows two sections: Job Info + Your Application.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import "./ApplicationDetail.css";
import BASE_URL from "../api";

export default function ApplicationDetail() {
  const token      = localStorage.getItem("token");
  const navigate   = useNavigate();

  // Read both params from the URL
  const params      = new URLSearchParams(window.location.search);
  const jobId       = params.get("id");
  const applicantId = Number(params.get("applicantId"));

  const [job, setJob]             = useState(null);
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    fetch(`${BASE_URL}/jobs/get/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load job details.");
        return res.json();
      })
      .then((data) => {
        setJob(data);
        // Find this user's specific applicant entry
        const match = data.applicants?.find(
          (a) => Number(a.applicantId) === applicantId
        );
        if (!match) throw new Error("Application record not found.");
        setApplicant(match);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  function formatDate(isoString) {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) return (
    <div className="apd-page">
      <Navbar />
      <p className="apd-loading">Loading…</p>
    </div>
  );

  if (error) return (
    <div className="apd-page">
      <Navbar />
      <div className="apd-error-wrap">
        <p className="apd-error">{error}</p>
        <button className="apd-btn-back" onClick={() => navigate("/my-applications")}>
          ← Back to My Applications
        </button>
      </div>
    </div>
  );

  return (
    <div className="apd-page">
      <Navbar />
      <main className="apd-main">

        <button className="apd-btn-back" onClick={() => navigate("/my-applications")}>
          ← Back to My Applications
        </button>

        <h1 className="apd-page-title">Application Details</h1>

        <div className="apd-grid">

          {/* ── Section 1: Job Info ── */}
          <div className="apd-card">
            <h2 className="apd-card-heading">Job Info</h2>

            <p className="apd-job-title">{job.jobTitle}</p>
            <p className="apd-company">{job.company}</p>

            <div className="apd-meta-list">
              {job.location && (
                <div className="apd-meta-row">
                  <span className="apd-meta-label">Location</span>
                  <span className="apd-meta-value">{job.location}</span>
                </div>
              )}
              {job.jobType && (
                <div className="apd-meta-row">
                  <span className="apd-meta-label">Type</span>
                  <span className="apd-meta-value">{job.jobType}</span>
                </div>
              )}
              {job.experience && (
                <div className="apd-meta-row">
                  <span className="apd-meta-label">Experience</span>
                  <span className="apd-meta-value">{job.experience}</span>
                </div>
              )}
              {job.packageOffered && (
                <div className="apd-meta-row">
                  <span className="apd-meta-label">Package</span>
                  <span className="apd-meta-value">
                    ₹ {job.packageOffered}{" "}
                    {job.jobType === "FULL_TIME" ? "LPA" : job.jobType === "INTERNSHIP" ? "/ month" : "/ hr"}
                  </span>
                </div>
              )}
            </div>

            {job.skillsRequired?.length > 0 && (
              <div className="apd-skills-section">
                <p className="apd-skills-label">Skills Required</p>
                <div className="apd-skills-list">
                  {job.skillsRequired.map((skill, i) => (
                    <span key={i} className="apd-skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2: Your Application ── */}
          <div className="apd-card">
            <h2 className="apd-card-heading">Your Application</h2>

            {/* Big status badge */}
            <div className="apd-status-section">
              <p className="apd-meta-label">Current Status</p>
              <StatusBadge status={applicant.applicationStatus} large={true} />
            </div>

            {/* Interview time — only shown when INTERVIEWING */}
            {applicant.applicationStatus === "INTERVIEWING" && applicant.interviewTime && (
              <div className="apd-interview-block">
                <p className="apd-interview-label">
                  <svg
                    className="apd-interview-icon"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="#111111"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Interview Scheduled
                </p>
                <p className="apd-interview-time">{formatDate(applicant.interviewTime)}</p>
              </div>
            )}

            <div className="apd-meta-list apd-meta-list--applicant">
              <div className="apd-meta-row">
                <span className="apd-meta-label">Name</span>
                <span className="apd-meta-value">{applicant.name}</span>
              </div>
              <div className="apd-meta-row">
                <span className="apd-meta-label">Email</span>
                <span className="apd-meta-value">{applicant.email}</span>
              </div>
              <div className="apd-meta-row">
                <span className="apd-meta-label">Applied on</span>
                <span className="apd-meta-value">{formatDate(applicant.timestamp)}</span>
              </div>
              {applicant.website && (
                <div className="apd-meta-row">
                  <span className="apd-meta-label">Website</span>
                  <a
                    className="apd-meta-link"
                    href={applicant.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {applicant.website}
                  </a>
                </div>
              )}
              {applicant.resume && (
                <div className="apd-meta-row">
                  <span className="apd-meta-label">Resume</span>
                  <a
                    className="apd-meta-link"
                    href={applicant.resume}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Resume ↗
                  </a>
                </div>
              )}
            </div>

            {applicant.coverLetter && (
              <div className="apd-cover-letter-section">
                <p className="apd-skills-label">Cover Letter</p>
                <p className="apd-cover-letter-text">{applicant.coverLetter}</p>
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
