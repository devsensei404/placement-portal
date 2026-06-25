// CandidateProfile.jsx
// Route: /candidate/:id
// Employer-only view-only profile page.
// Fetches GET /profiles/view/{id} (EMPLOYER-gated endpoint).
// Mirrors the MyProfile layout exactly — cover, avatar, bio, skills,
// experience, certifications — with zero edit controls.

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import "./CandidateProfile.css";
import BASE_URL from "../api";

const BASE = BASE_URL;

export default function CandidateProfile() {
  const { id }   = useParams();
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState("");

  useEffect(() => {
    fetch(`${BASE}/profiles/view/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load this profile.");
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-IN", {
      month: "short",
      year:  "numeric",
    });
  }

  function getInitials(name) {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  // ── Loading / Error ──
  if (loading) return (
    <div className="cp-page">
      <Navbar />
      <p className="cp-status">Loading profile…</p>
    </div>
  );

  if (error) return (
    <div className="cp-page">
      <Navbar />
      <div className="cp-status">
        <p className="cp-error">{error}</p>
        <button className="cp-btn-back" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="cp-page">
      <Navbar />
      <main className="cp-main">

        {/* ── Back button ── */}
        <button className="cp-btn-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* ══════════════════════════════
            COVER + AVATAR + NAME BLOCK
        ══════════════════════════════ */}
        <div className="cp-hero-card">

          {/* Cover photo */}
          <div className="cp-cover">
            {profile.coverPhotoUrl ? (
              <img src={profile.coverPhotoUrl} alt="Cover" className="cp-cover-img" />
            ) : (
              <div className="cp-cover-placeholder" />
            )}
          </div>

          {/* Avatar */}
          <div className="cp-avatar-wrap">
            {profile.profilePictureUrl ? (
              <img src={profile.profilePictureUrl} alt={profile.name} className="cp-avatar-img" />
            ) : (
              <div className="cp-avatar-initials">
                {getInitials(profile.name)}
              </div>
            )}
          </div>

          {/* Name + title + meta */}
          <div className="cp-hero-info">
            <h1 className="cp-name">{profile.name || "Unnamed"}</h1>

            {profile.jobTitle && (
              <p className="cp-job-title">
                {profile.jobTitle}
                {profile.company ? ` · ${profile.company}` : ""}
              </p>
            )}

            <div className="cp-meta-chips">
              {profile.location && (
                <span className="cp-meta-chip">📍 {profile.location}</span>
              )}
              {profile.email && (
                <span className="cp-meta-chip">✉️ {profile.email}</span>
              )}
            </div>

            {/* Resume link if present */}
            {profile.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="cp-resume-link"
              >
                📄 View Resume ↗
              </a>
            )}
          </div>
        </div>

        {/* ══════════════════════════════
            ABOUT
        ══════════════════════════════ */}
        {profile.about && (
          <div className="cp-card">
            <h2 className="cp-section-title">About</h2>
            <p className="cp-about-text">{profile.about}</p>
          </div>
        )}

        {/* ══════════════════════════════
            SKILLS
        ══════════════════════════════ */}
        {profile.skills?.length > 0 && (
          <div className="cp-card">
            <h2 className="cp-section-title">Skills</h2>
            <div className="cp-skills-list">
              {profile.skills.map((skill, i) => (
                <span key={i} className="cp-skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            EXPERIENCE
        ══════════════════════════════ */}
        {profile.experience?.length > 0 && (
          <div className="cp-card">
            <h2 className="cp-section-title">Experience</h2>
            <div className="cp-timeline">
              {profile.experience.map((exp, i) => (
                <div key={exp.id ?? i} className="cp-timeline-item">
                  <div className="cp-timeline-dot" />
                  <div className="cp-timeline-body">
                    <p className="cp-exp-title">{exp.title}</p>
                    <p className="cp-exp-company">
                      {exp.company}
                      {exp.location ? ` · ${exp.location}` : ""}
                    </p>
                    <p className="cp-exp-dates">
                      {formatDate(exp.startDate)}
                      {" — "}
                      {exp.working ? "Present" : formatDate(exp.endDate)}
                    </p>
                    {exp.description && (
                      <p className="cp-exp-desc">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            CERTIFICATIONS
        ══════════════════════════════ */}
        {profile.certifications?.length > 0 && (
          <div className="cp-card">
            <h2 className="cp-section-title">Certifications</h2>
            <div className="cp-cert-list">
              {profile.certifications.map((cert, i) => (
                <div key={cert.id ?? i} className="cp-cert-row">
                  <div className="cp-cert-icon">🏅</div>
                  <div className="cp-cert-info">
                    <p className="cp-cert-name">{cert.name}</p>
                    <p className="cp-cert-meta">
                      {cert.issuer}
                      {cert.issueDate ? ` · ${formatDate(cert.issueDate)}` : ""}
                    </p>
                    {cert.certificateId && (
                      <p className="cp-cert-id">ID: {cert.certificateId}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state if profile has almost nothing filled */}
        {!profile.about &&
         !profile.skills?.length &&
         !profile.experience?.length &&
         !profile.certifications?.length && (
          <div className="cp-card cp-empty-profile">
            <p className="cp-empty-title">Profile not filled in yet</p>
            <p className="cp-empty-sub">This candidate hasn't added details to their profile.</p>
          </div>
        )}

      </main>
    </div>
  );
}