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
import BASE_URL from "../api";

function IconPin() {
  return (
    <svg className="ma2-pin-icon" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21.5s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"
        stroke="#555555"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.4" stroke="#555555" strokeWidth="1.6" />
    </svg>
  );
}

export default function MyApplications() {
  const token  = localStorage.getItem("token");
  const userId = Number(localStorage.getItem("userId")); // stored as string, need number to compare
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]); // flat list of { job, applicant } pairs
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  // ── Open assessments, keyed by jobId ──
  // Only populated for applications whose status is APPLIED/INTERVIEWING,
  // since only those are eligible to take an assessment right now.
  const [openAssessmentByJobId, setOpenAssessmentByJobId] = useState({});

  useEffect(() => {
    fetch(`${BASE_URL}/jobs/getAll`, {
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

        // For each eligible, distinct job, check whether it has an OPEN assessment.
        const eligibleJobIds = [
          ...new Set(
            matched
              .filter(
                ({ applicant }) =>
                  applicant.applicationStatus === "APPLIED" ||
                  applicant.applicationStatus === "INTERVIEWING"
              )
              .map(({ job }) => job.id)
          ),
        ];

        Promise.all(
          eligibleJobIds.map((jobId) =>
            fetch(`${BASE_URL}/assessments/job/${jobId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => (r.ok ? r.json() : []))
              .then((assessmentsForJob) => {
                const open = assessmentsForJob.find((a) => a.status === "OPEN");
                return [jobId, open || null];
              })
              .catch(() => [jobId, null])
          )
        ).then((pairs) => {
          const map = {};
          pairs.forEach(([jobId, assessment]) => {
            if (assessment) map[jobId] = assessment;
          });
          setOpenAssessmentByJobId(map);
        });
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
    <div className="ma2-page">
      <Navbar />
      <main className="ma2-main">

        <div className="ma2-header">
          <h1 className="ma2-title">My Applications</h1>
          <p className="ma2-sub">
            {loading ? "Loading…" : `${applications.length} application${applications.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {error && <p className="ma2-error">{error}</p>}

        {!loading && !error && applications.length === 0 && (
          <div className="ma2-empty-state">
            <p className="ma2-empty-title">No applications yet</p>
            <p className="ma2-empty-sub">Browse open jobs and hit Apply to get started.</p>
            <button className="ma2-btn-primary" onClick={() => navigate("/browse-jobs")}>
              Browse Jobs
            </button>
          </div>
        )}

        <div className="ma2-apps-list">
          {applications.map(({ job, applicant }) => (
            <div className="ma2-app-card" key={applicant.applicantId + "-" + job.id}>

              <div className="ma2-app-card-left">
                <h2 className="ma2-app-job-title">{job.jobTitle}</h2>
                <p className="ma2-app-company">{job.company}</p>
                <div className="ma2-app-meta-row">
                  {job.location && (
                    <span className="ma2-app-meta-chip">
                      <IconPin /> {job.location}
                    </span>
                  )}
                  {job.jobType && <span className="ma2-app-meta-chip">{job.jobType}</span>}
                </div>
                <p className="ma2-app-date">Applied on {formatDate(applicant.timestamp)}</p>
              </div>

              <div className="ma2-app-card-right">
                <StatusBadge status={applicant.applicationStatus} />
                {(applicant.applicationStatus === "APPLIED" ||
                  applicant.applicationStatus === "INTERVIEWING") &&
                  openAssessmentByJobId[job.id] && (
                    <button
                      className="ma2-btn-take-assessment"
                      onClick={() =>
                        navigate(`/assessments/${openAssessmentByJobId[job.id].assessmentId}/take`)
                      }
                    >
                      Take Assessment
                    </button>
                  )}
                <button
                  className="ma2-btn-view-details"
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
