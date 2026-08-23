// src/components/JobCard.jsx

import { useNavigate } from 'react-router-dom';
import "./JobCard.css";

// Reusable card — used on Dashboard (3 cards) and Browse Jobs (all cards).
// matchScore/matchReason are optional — only passed by StudentDashboard's
// "Recommended For You" section (from GET /jobs/recommendations). Every
// other usage omits them and the badge simply doesn't render.
function JobCard({ job, matchScore, matchReason }) {
  const navigate = useNavigate();

  return (
    <div className="job-card">
      <div className="job-card-info">
        {typeof matchScore === "number" && (
          <div className="job-card-match-badge" title={matchReason || ""}>
            {matchScore}% match
          </div>
        )}
        <h3 className="job-card-title">{job.jobTitle}</h3>
        <p className="job-card-company">{job.company}</p>
        <p className="job-card-location">{job.location}</p>
        {matchReason && <p className="job-card-match-reason">{matchReason}</p>}
      </div>
      <button
        className="btn-view"
        onClick={() => navigate(`/job-details?id=${job.id}`)}
      >
        View
      </button>
    </div>
  );
}

export default JobCard;
