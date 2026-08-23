// CandidateProfile.jsx
// Route: /candidate/:id
// Employer-only view-only profile page.
// Fetches GET /profiles/view/{id} (EMPLOYER-gated endpoint).
// Mirrors the MyProfile layout exactly — cover, avatar, bio, skills,
// experience, certifications — with zero edit controls.

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import ReportButton from "../components/ReportButton.jsx";
import "./CandidateProfile.css";
import BASE_URL from "../api";

const BASE = BASE_URL;

export default function CandidateProfile() {
  const { id }   = useParams();
  const token    = localStorage.getItem("token");
  const accountType = localStorage.getItem("accountType");
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState("");

  const canReport = accountType === "EMPLOYER" || accountType === "COMPANY";

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
        <div className="cp-hero-card" style={{ animationDelay: "0s" }}>

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
            <div className="cp-name-row">
              <h1 className="cp-name">{profile.name || "Unnamed"}</h1>
              {canReport && (
                <ReportButton targetType="PROFILE" targetId={Number(id)} />
              )}
            </div>

            {profile.jobTitle && (
              <p className="cp-job-title">
                {profile.jobTitle}
                {profile.company ? ` · ${profile.company}` : ""}
              </p>
            )}

            <div className="cp-meta-chips">
              {profile.location && (
                <span className="cp-meta-chip">
                  <svg
                    className="cp-chip-icon"
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="#111111"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {profile.location}
                </span>
              )}
            </div>

            {/* Contact icons: Mail / GitHub / LinkedIn — replaces the old plain-text
                email chip with a clickable icon, plus GitHub/LinkedIn if the
                candidate has added them. */}
            <div className="cp-contact-icons">
              {profile.email && (
                <a
                  className="cp-contact-icon"
                  href={`mailto:${profile.email}`}
                  title={profile.email}
                  aria-label="Email"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2.5" y="4.5" width="19" height="15" rx="2.2" />
                    <path d="M3 6.5 12 13l9-6.5" />
                  </svg>
                </a>
              )}
              {profile.githubUrl && (
                <a
                  className="cp-contact-icon"
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="GitHub"
                  aria-label="GitHub"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.43-2.7 5.41-5.27 5.7.42.36.78 1.07.78 2.16 0 1.56-.02 2.82-.02 3.2 0 .31.21.67.8.56A10.51 10.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
                  </svg>
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  className="cp-contact-icon"
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="LinkedIn"
                  aria-label="LinkedIn"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
                  </svg>
                </a>
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
                <svg
                  className="cp-resume-icon"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="16" y2="17" />
                </svg>
                View Resume ↗
              </a>
            )}
          </div>
        </div>

        {/* ══════════════════════════════
            ABOUT
        ══════════════════════════════ */}
        {profile.about && (
          <div className="cp-card" style={{ animationDelay: "0.05s" }}>
            <h2 className="cp-section-title">About</h2>
            <p className="cp-about-text">{profile.about}</p>
          </div>
        )}

        {/* ══════════════════════════════
            SKILLS
        ══════════════════════════════ */}
        {profile.skills?.length > 0 && (
          <div className="cp-card" style={{ animationDelay: "0.1s" }}>
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
          <div className="cp-card" style={{ animationDelay: "0.15s" }}>
            <h2 className="cp-section-title">Experience</h2>
            <div className="cp-timeline">
              {profile.experience.map((exp, i) => (
                <div
                  key={exp.id ?? i}
                  className="cp-timeline-item"
                  style={{ animationDelay: `${0.15 + i * 0.05}s` }}
                >
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
          <div className="cp-card" style={{ animationDelay: "0.2s" }}>
            <h2 className="cp-section-title">Certifications</h2>
            <div className="cp-cert-list">
              {profile.certifications.map((cert, i) => (
                <div
                  key={cert.id ?? i}
                  className="cp-cert-row"
                  style={{ animationDelay: `${0.2 + i * 0.05}s` }}
                >
                  <div className="cp-cert-icon">
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#111111"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="8" r="6" />
                      <path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5" />
                    </svg>
                  </div>
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
          <div className="cp-card cp-empty-profile" style={{ animationDelay: "0.05s" }}>
            <p className="cp-empty-title">Profile not filled in yet</p>
            <p className="cp-empty-sub">This candidate hasn't added details to their profile.</p>
          </div>
        )}

      </main>
    </div>
  );
}
