import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import JobCard from "../components/JobCard.jsx";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/jobs/getAll", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecentJobs(data.slice(-3).reverse()))
      .catch((err) => console.error("Failed to fetch jobs:", err));
  }, []);

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-main">
        <h1>Dashboard</h1>
        <p className="welcome">Welcome back, student #{userId}</p>

        {/* Quick stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Jobs Applied</span>
            <span className="stat-value">0</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Notifications</span>
            <span className="stat-value">0</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Profile Status</span>
            <span className="stat-value">Incomplete</span>
          </div>
        </div>

        {/* Recent Jobs */}
        <section className="recent-jobs-section">
          <h2 className="section-heading">Latest Job Openings</h2>
          <div className="jobs-grid">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          <div className="view-more-wrapper">
            <button
              className="btn-view-more"
              onClick={() => navigate("/browse-jobs")}
            >
              View More Jobs
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}