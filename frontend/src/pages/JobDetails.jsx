import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import "./JobDetails.css";

export default function JobDetails() {
  const [job, setJob] = useState(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  // Modal open/close state
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    resume: "",
    coverLetter: "",
  });

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const jobId = new URLSearchParams(window.location.search).get("id");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:8080/jobs/get/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setJob(data))
      .catch((err) => console.error("Failed to fetch job:", err));
  }, [jobId]);

  // Update form state on input change
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Called when user submits the modal form
  function handleApply() {
    fetch(`http://localhost:8080/jobs/apply/${jobId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        applicantId: Number(userId),
        name: form.name,
        email: form.email,
        phone: Number(form.phone),
        website: form.website,
        resume: form.resume,
        coverLetter: form.coverLetter,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Applied Successfully") {
          setApplied(true);
          setShowModal(false);
          setError("");
        } else {
          setError(data.errorMessage || "Something went wrong.");
        }
      })
      .catch((err) => console.error("Apply failed:", err));
  }

  if (!job) return <div className="loading">Loading...</div>;

  return (
    <div className="job-details-page">
      <Navbar />
      <main className="job-details-main">

        {/* Header block */}
        <div className="job-header">
          <h1 className="job-title">{job.jobTitle}</h1>
          <p className="job-meta"><span className="meta-label">Company:</span> {job.company}</p>
          <p className="job-meta"><span className="meta-label">Location:</span> {job.location}</p>
          <p className="job-meta"><span className="meta-label">Job Type:</span> {job.jobType}</p>
          <p className="job-meta"><span className="meta-label">Experience:</span> {job.experience}</p>
          {job.packageOffered && (
            <p className="job-package">
                ₹ {job.packageOffered} {job.jobType === "FULL_TIME" ? "LPA" : job.jobType === "INTERNSHIP" ?"per month":"per hour"}
            </p>
          )}
        </div>

        {/* About */}
        {job.about && (
          <section className="job-section">
            <h2>About the Role</h2>
            <p>{job.about}</p>
          </section>
        )}

        {/* Description */}
        {job.description && (
          <section className="job-section">
            <h2>Job Description</h2>
            <p>{job.description}</p>
          </section>
        )}

        {/* Skills */}
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

        {/* Apply button or success message */}
        <div className="apply-section">
          {applied ? (
            <p className="success-msg">✓ Applied successfully!</p>
          ) : (
            <>
              {error && <p className="error-msg">{error}</p>}
              <button className="btn-apply" onClick={() => setShowModal(true)}>
                Apply Now
              </button>
            </>
          )}
        </div>

      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Apply for {job.jobTitle}</h2>

            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
            />

            <label>Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
            />

            <label>Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit number"
              type="number"
            />

            <label>Website / LinkedIn</label>
            <input
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://..."
            />

            <label>Resume Link</label>
            <input
              name="resume"
              value={form.resume}
              onChange={handleChange}
              placeholder="Google Drive or any public link"
            />

            <label>Cover Letter</label>
            <textarea
              name="coverLetter"
              value={form.coverLetter}
              onChange={handleChange}
              placeholder="Why are you a good fit?"
              rows={4}
            />

            {error && <p className="error-msg">{error}</p>}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-apply" onClick={handleApply}>
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}