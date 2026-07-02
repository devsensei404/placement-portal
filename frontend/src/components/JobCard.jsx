// src/components/JobCard.jsx

import { useNavigate } from 'react-router-dom';
import "./JobCard.css";

// Reusable card — used on Dashboard (3 cards) and Browse Jobs (all cards)
function JobCard({ job }) {
  const navigate = useNavigate();

  return (
    <div className="job-card">
      <div className="job-card-info">
        <h3 className="job-card-title">{job.jobTitle}</h3>
        <p className="job-card-company">{job.company}</p>
        <p className="job-card-location">{job.location}</p>
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
