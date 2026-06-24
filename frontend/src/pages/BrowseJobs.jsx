import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import JobCard from "../components/JobCard.jsx";
import "./BrowseJobs.css";

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Filter state
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:8080/jobs/getAll", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
        setFiltered(data);
      })
      .catch((err) => console.error("Failed to fetch jobs:", err));
  }, []);

  // Re-run filters whenever any filter value changes
  useEffect(() => {
    let result = jobs;

    if (search) {
      result = result.filter(
        (job) =>
          job.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
          job.company.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (location) {
      result = result.filter((job) =>
        job.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (jobType) {
      result = result.filter((job) => job.jobType === jobType);
    }

    setFiltered(result);
  }, [search, location, jobType, jobs]);

  function clearFilters() {
    setSearch("");
    setLocation("");
    setJobType("");
  }

  return (
    <div className="browse-page">
      <Navbar />
      <main className="browse-main">
        <h1>Browse Jobs</h1>

        {/* Filter bar */}
        <div className="filter-bar">
          <input
            className="filter-input"
            type="text"
            placeholder="Search by title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            className="filter-input"
            type="text"
            placeholder="Filter by location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <select
            className="filter-select"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
          >
            <option value="">All Job Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="INTERNSHIP">Internship</option>
          </select>

          <button className="btn-clear" onClick={clearFilters}>
            Clear
          </button>
        </div>

        {/* Results count */}
        <p className="results-count">{filtered.length} jobs found</p>

        {/* Job grid */}
        <div className="jobs-grid">
          {filtered.length > 0 ? (
            filtered.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <p className="no-results">No jobs match your filters.</p>
          )}
        </div>
      </main>
    </div>
  );
}