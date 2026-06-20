// MyApplications.jsx
// Route: /my-applications
// Fetches all jobs, filters to ones where the current user has applied,
// and renders one application card per match.
//
// NOTE FOR BACKEND FIX LATER:
// We have no /applications/{userId} endpoint yet, so we fetch all jobs
// and filter client-side by applicantId === userId.
// When that endpoint exists, replace the fetch + filter below with a
// single GET /applications/{userId} call.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import "./MyApplications.css";

export default function MyApplications() {
  const token  = localStorage.getItem("token");
  const userId = Number(localStorage.getItem("userId")); // stored as string, need number to compare
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]); // flat list of { job, applicant } pairs
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/jobs/getAll", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load jobs.");
        return res.json();
      })
      .then((jobs) => {
        // Each job has an applicants array. Find entries where applicantId matches userId.
        // applicantId in the Applicant entity is the user's profile/userId (see backend note).
        const matched = [];
        jobs.forEach((job) => {
          if (!job.applicants) return;
          job.applicants.forEach((applicant) => {
            if (Number(applicant.applicantId) === userId) {
              matched.push({ job, applicant });
            }
          });
        });

        // Sort by timestamp — latest application first
        // a and b are two { job, applicant } objects being compared at a time
        // subtracting b - a means newer timestamps come first
        matched.sort((a, b) => new Date(b.applicant.timestamp) - new Date(a.applicant.timestamp));

        setApplications(matched);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(isoString) {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="my-apps-page">
      <Navbar />
      <main className="my-apps-main">

        <div className="my-apps-header">
          <h1 className="my-apps-title">My Applications</h1>
          <p className="my-apps-sub">
            {loading ? "Loading…" : `${applications.length} application${applications.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {error && <p className="my-apps-error">{error}</p>}

        {!loading && !error && applications.length === 0 && (
          <div className="empty-state">
            <p className="empty-title">No applications yet</p>
            <p className="empty-sub">Browse open jobs and hit Apply to get started.</p>
            <button className="btn-primary" onClick={() => navigate("/browse-jobs")}>
              Browse Jobs
            </button>
          </div>
        )}

        <div className="apps-list">
          {applications.map(({ job, applicant }) => (
            <div className="app-card" key={applicant.applicantId + "-" + job.id}>

              <div className="app-card-left">
                <h2 className="app-job-title">{job.jobTitle}</h2>
                <p className="app-company">{job.company}</p>
                <div className="app-meta-row">
                  {job.location && <span className="app-meta-chip">📍 {job.location}</span>}
                  {job.jobType  && <span className="app-meta-chip">{job.jobType}</span>}
                </div>
                <p className="app-date">Applied on {formatDate(applicant.timestamp)}</p>
              </div>

              <div className="app-card-right">
                <StatusBadge status={applicant.applicationStatus} />
                <button
                  className="btn-view-details"
                  onClick={() =>
                    navigate(`/application-detail?id=${job.id}&applicantId=${applicant.applicantId}`)
                  }
                >
                  View Details
                </button>
              </div>

            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
