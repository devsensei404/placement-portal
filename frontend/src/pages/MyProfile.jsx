import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import "./MyProfile.css";

export default function MyProfile() {
  const token     = localStorage.getItem("token");
  const profileId = localStorage.getItem("userId");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState("");

  useEffect(() => {
    fetch(`http://localhost:8080/profiles/get/${profileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile.");
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="profile-page"><Navbar />
      <p className="profile-status">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="profile-page"><Navbar />
      <p className="profile-status profile-error">{error}</p>
    </div>
  );

  // Generate initials for the avatar placeholder
  const initials = profile.name
    ? profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="profile-page">
      <Navbar />
      <main className="profile-main">

        {/* ── Hero Card ── */}
        <div className="profile-hero-card">
          <div className="profile-banner" />

          <div className="profile-hero-body">
            {/* Avatar — placeholder until upload is ready */}
            <div className="profile-avatar">{initials}</div>

            <div className="profile-hero-info">
              <h1 className="profile-hero-name">{profile.name || "No name set"}</h1>
              {profile.jobTitle && (
                <p className="profile-hero-headline">{profile.jobTitle}</p>
              )}
              <p className="profile-hero-meta">
                {[profile.company, profile.location].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>

        {/* ── About ── */}
        {profile.about && (
          <section className="profile-card">
            <h2 className="profile-card-title">About</h2>
            <p className="profile-about-text">{profile.about}</p>
          </section>
        )}

        {/* ── Skills ── */}
        <section className="profile-card">
          <h2 className="profile-card-title">Skills</h2>
          {profile.skills?.length > 0 ? (
            <div className="profile-tags">
              {profile.skills.map((skill, i) => (
                <span key={i} className="profile-tag">{skill}</span>
              ))}
            </div>
          ) : (
            <p className="profile-empty">No skills added yet.</p>
          )}
        </section>

        {/* ── 2-col grid: Experience + right column ── */}
        <div className="profile-two-col">

          {/* Experience */}
          <section className="profile-card">
            <h2 className="profile-card-title">Experience &amp; Internships</h2>
            {profile.experience?.length > 0 ? (
              <div className="profile-entry-list">
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="profile-entry">
                    <p className="profile-entry-title">{exp.title}</p>
                    <p className="profile-entry-sub">
                      {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                    </p>
                    {exp.startDate && (
                      <p className="profile-entry-dates">
                        {formatDate(exp.startDate)} — {exp.working ? "Present" : formatDate(exp.endDate)}
                      </p>
                    )}
                    {exp.description && (
                      <p className="profile-entry-desc">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty">No experience added yet.</p>
            )}
          </section>

          {/* Right column: Certifications + Resume */}
          <div className="profile-right-col">

            {/* Certifications */}
            <section className="profile-card">
              <h2 className="profile-card-title">Certifications</h2>
              {profile.certifications?.length > 0 ? (
                <div className="profile-entry-list">
                  {profile.certifications.map((cert) => (
                    <div key={cert.id} className="profile-entry">
                      <p className="profile-entry-title">{cert.name}</p>
                      <p className="profile-entry-sub">{cert.issuer}</p>
                      {cert.issueDate && (
                        <p className="profile-entry-dates">Issued {formatDate(cert.issueDate)}</p>
                      )}
                      {cert.certificateId && (
                        <p className="profile-entry-desc">ID: {cert.certificateId}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-empty">No certifications added yet.</p>
              )}
            </section>

            {/* Resume — placeholder */}
            <section className="profile-card profile-resume-card">
              <h2 className="profile-card-title">Resume</h2>
              <div className="resume-placeholder-row">
                <div className="resume-pdf-icon">PDF</div>
                <p className="resume-placeholder-text">No resume uploaded yet.</p>
              </div>
              <button className="btn-resume" disabled>
                Upload Resume — Coming Soon
              </button>
            </section>

          </div>
        </div>

      </main>
    </div>
  );
}

function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}