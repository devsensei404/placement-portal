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
    fetch(`http://localhost:8080/jobs/get/${jobId}`, {
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
    <div className="app-detail-page">
      <Navbar />
      <p className="detail-loading">Loading…</p>
    </div>
  );

  if (error) return (
    <div className="app-detail-page">
      <Navbar />
      <div className="detail-error-wrap">
        <p className="detail-error">{error}</p>
        <button className="btn-back" onClick={() => navigate("/my-applications")}>
          ← Back to My Applications
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-detail-page">
      <Navbar />
      <main className="app-detail-main">

        <button className="btn-back" onClick={() => navigate("/my-applications")}>
          ← Back to My Applications
        </button>

        <h1 className="detail-page-title">Application Details</h1>

        <div className="detail-grid">

          {/* ── Section 1: Job Info ── */}
          <div className="detail-card">
            <h2 className="detail-card-heading">Job Info</h2>

            <p className="detail-job-title">{job.jobTitle}</p>
            <p className="detail-company">{job.company}</p>

            <div className="detail-meta-list">
              {job.location && (
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Location</span>
                  <span className="detail-meta-value">{job.location}</span>
                </div>
              )}
              {job.jobType && (
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Type</span>
                  <span className="detail-meta-value">{job.jobType}</span>
                </div>
              )}
              {job.experience && (
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Experience</span>
                  <span className="detail-meta-value">{job.experience}</span>
                </div>
              )}
              {job.packageOffered && (
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Package</span>
                  <span className="detail-meta-value">
                    ₹ {job.packageOffered}{" "}
                    {job.jobType === "FULL_TIME" ? "LPA" : job.jobType === "INTERNSHIP" ? "/ month" : "/ hr"}
                  </span>
                </div>
              )}
            </div>

            {job.skillsRequired?.length > 0 && (
              <div className="detail-skills-section">
                <p className="detail-skills-label">Skills Required</p>
                <div className="detail-skills-list">
                  {job.skillsRequired.map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2: Your Application ── */}
          <div className="detail-card">
            <h2 className="detail-card-heading">Your Application</h2>

            {/* Big status badge */}
            <div className="status-section">
              <p className="detail-meta-label" style={{ marginBottom: "8px" }}>Current Status</p>
              <StatusBadge status={applicant.applicationStatus} large={true} />
            </div>

            {/* Interview time — only shown when INTERVIEWING */}
            {applicant.applicationStatus === "INTERVIEWING" && applicant.interviewTime && (
              <div className="interview-block">
                <p className="interview-label">📅 Interview Scheduled</p>
                <p className="interview-time">{formatDate(applicant.interviewTime)}</p>
              </div>
            )}

            <div className="detail-meta-list" style={{ marginTop: "20px" }}>
              <div className="detail-meta-row">
                <span className="detail-meta-label">Name</span>
                <span className="detail-meta-value">{applicant.name}</span>
              </div>
              <div className="detail-meta-row">
                <span className="detail-meta-label">Email</span>
                <span className="detail-meta-value">{applicant.email}</span>
              </div>
              <div className="detail-meta-row">
                <span className="detail-meta-label">Applied on</span>
                <span className="detail-meta-value">{formatDate(applicant.timestamp)}</span>
              </div>
              {applicant.website && (
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Website</span>
                  <a
                    className="detail-meta-link"
                    href={applicant.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {applicant.website}
                  </a>
                </div>
              )}
              {applicant.resume && (
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Resume</span>
                  <a
                    className="detail-meta-link"
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
              <div className="cover-letter-section">
                <p className="detail-skills-label">Cover Letter</p>
                <p className="cover-letter-text">{applicant.coverLetter}</p>
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
