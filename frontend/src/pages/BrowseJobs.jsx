import { useState, useEffect } from 'react';
import JobCard from '../components/JobCard';
import "./BrowseJobs.css";

function BrowseJobs() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://localhost:8080/jobs/getAll', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        // No slice here — show all jobs
        setJobs(data);
      })
      .catch(err => console.error('Failed to fetch jobs:', err));
  }, []);

  return (
    <div className="browse-jobs-page">
      <h2 className="section-heading">Browse Jobs</h2>

      <div className="jobs-grid">
        {jobs.slice().reverse().map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

export default BrowseJobs;