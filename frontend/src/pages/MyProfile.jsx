import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar.jsx";
import "./MyProfile.css";
import BASE_URL from "../api";

const BASE = BASE_URL;

// ── Line icons (replace emoji glyphs; stroke follows currentColor so they
// automatically pick up button text color, including on hover-invert states) ──
function EditIcon({ size = 14 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function CloseIcon({ size = 14 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

// ── Contact icons (GitHub / LinkedIn / Mail) — link out from the profile hero ──
function GithubIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.43-2.7 5.41-5.27 5.7.42.36.78 1.07.78 2.16 0 1.56-.02 2.82-.02 3.2 0 .31.21.67.8.56A10.51 10.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

function MailIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.2" />
      <path d="M3 6.5 12 13l9-6.5" />
    </svg>
  );
}

export default function MyProfile() {
  const token     = localStorage.getItem("token");
  const profileId = localStorage.getItem("userId");

  const [profile,  setProfile ] = useState(null);
  const [loading,  setLoading ] = useState(true);
  const [error,    setError   ] = useState("");

  // ── edit mode flags per section ──
  const [editingBasic,  setEditingBasic ] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);

  // ── basic info form state ──
  const [basicForm, setBasicForm] = useState({
    name: "", jobTitle: "", company: "", location: "", about: "",
    githubUrl: "", linkedinUrl: ""
  });
  const [basicSaving, setBasicSaving] = useState(false);
  const [basicError,  setBasicError ] = useState("");

  // ── skills state ──
  const [skillInput,   setSkillInput  ] = useState("");
  const [skillsList,   setSkillsList  ] = useState([]);
  const [skillsSaving, setSkillsSaving] = useState(false);

  // ── experience modal state ──
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [expEditTarget, setExpEditTarget] = useState(null); // null = add, object = edit
  const [expForm, setExpForm] = useState({
    title: "", company: "", location: "",
    startDate: "", endDate: "", working: false, description: ""
  });
  const [expSaving, setExpSaving] = useState(false);
  const [expError,  setExpError ] = useState("");

  // ── certification modal state ──
  const [certModalOpen,   setCertModalOpen  ] = useState(false);
  const [certEditTarget,  setCertEditTarget ] = useState(null);
  const [certForm, setCertForm] = useState({
    name: "", issuer: "", issueDate: "", certificateId: ""
  });
  const [certSaving, setCertSaving] = useState(false);
  const [certError,  setCertError ] = useState("");

  // ── upload loading states ──
  const [uploadingPic,   setUploadingPic  ] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // ── file input refs ──
  const picInputRef    = useRef(null);
  const coverInputRef  = useRef(null);
  const resumeInputRef = useRef(null);

  // ── fetch profile ──
  useEffect(() => {
    fetchProfile();
  }, []);

  function fetchProfile() {
    setLoading(true);
    fetch(`${BASE}/profiles/get/${profileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile.");
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  // ─────────────────────────────────────────
  // BASIC INFO
  // ─────────────────────────────────────────
  function openBasicEdit() {
    setBasicForm({
      name:     profile.name     || "",
      jobTitle: profile.jobTitle || "",
      company:  profile.company  || "",
      location: profile.location || "",
      about:    profile.about    || "",
      githubUrl:   profile.githubUrl   || "",
      linkedinUrl: profile.linkedinUrl || "",
    });
    setBasicError("");
    setEditingBasic(true);
  }

  function handleBasicChange(e) {
    setBasicForm({ ...basicForm, [e.target.name]: e.target.value });
  }

  async function saveBasicInfo() {
    setBasicSaving(true);
    setBasicError("");
    try {
      const res = await fetch(`${BASE}/profiles/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: Number(profileId), ...basicForm }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to save.");
      }
      const updated = await res.json();
      setProfile(updated);
      setEditingBasic(false);
    } catch (err) {
      setBasicError(err.message);
    } finally {
      setBasicSaving(false);
    }
  }

  // ─────────────────────────────────────────
  // SKILLS
  // ─────────────────────────────────────────
  function openSkillsEdit() {
    setSkillsList(profile.skills ? [...profile.skills] : []);
    setSkillInput("");
    setEditingSkills(true);
  }

  function addSkill() {
    const trimmed = skillInput.trim();
    if (!trimmed || skillsList.includes(trimmed)) return;
    setSkillsList([...skillsList, trimmed]);
    setSkillInput("");
  }

  function removeSkill(skill) {
    setSkillsList(skillsList.filter((s) => s !== skill));
  }

  async function saveSkills() {
    setSkillsSaving(true);
    try {
      const res = await fetch(`${BASE}/profiles/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: Number(profileId), skills: skillsList }),
      });
      if (!res.ok) throw new Error("Failed to save skills.");
      const updated = await res.json();
      setProfile(updated);
      setEditingSkills(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSkillsSaving(false);
    }
  }

  // ─────────────────────────────────────────
  // EXPERIENCE
  // ─────────────────────────────────────────
  function openAddExp() {
    setExpEditTarget(null);
    setExpForm({ title: "", company: "", location: "", startDate: "", endDate: "", working: false, description: "" });
    setExpError("");
    setExpModalOpen(true);
  }

  function openEditExp(exp) {
    setExpEditTarget(exp);
    setExpForm({
      title:       exp.title       || "",
      company:     exp.company     || "",
      location:    exp.location    || "",
      startDate:   exp.startDate   ? exp.startDate.slice(0, 10)  : "",
      endDate:     exp.endDate     ? exp.endDate.slice(0, 10)    : "",
      working:     exp.working     || false,
      description: exp.description || "",
    });
    setExpError("");
    setExpModalOpen(true);
  }

  function handleExpChange(e) {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setExpForm({ ...expForm, [e.target.name]: val });
  }

  async function saveExp() {
    setExpSaving(true);
    setExpError("");
    try {
      // dates need to be ISO datetime strings for the backend LocalDateTime
      const payload = {
        ...expForm,
        startDate: expForm.startDate ? expForm.startDate + "T00:00:00" : null,
        endDate:   expForm.working   ? null : expForm.endDate ? expForm.endDate + "T00:00:00" : null,
      };

      let url, method;
      if (expEditTarget) {
        url    = `${BASE}/profiles/${profileId}/experience/${expEditTarget.id}`;
        method = "PUT";
      } else {
        url    = `${BASE}/profiles/${profileId}/experience`;
        method = "POST";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to save experience.");
      }

      setExpModalOpen(false);
      fetchProfile(); // re-fetch to get updated list
    } catch (err) {
      setExpError(err.message);
    } finally {
      setExpSaving(false);
    }
  }

  async function deleteExp(expId) {
    if (!window.confirm("Delete this experience entry?")) return;
    try {
      const res = await fetch(`${BASE}/profiles/${profileId}/experience/${expId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete.");
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  }

  // ─────────────────────────────────────────
  // CERTIFICATIONS
  // ─────────────────────────────────────────
  function openAddCert() {
    setCertEditTarget(null);
    setCertForm({ name: "", issuer: "", issueDate: "", certificateId: "" });
    setCertError("");
    setCertModalOpen(true);
  }

  function openEditCert(cert) {
    setCertEditTarget(cert);
    setCertForm({
      name:          cert.name          || "",
      issuer:        cert.issuer        || "",
      issueDate:     cert.issueDate     ? cert.issueDate.slice(0, 10) : "",
      certificateId: cert.certificateId || "",
    });
    setCertError("");
    setCertModalOpen(true);
  }

  function handleCertChange(e) {
    setCertForm({ ...certForm, [e.target.name]: e.target.value });
  }

  async function saveCert() {
    setCertSaving(true);
    setCertError("");
    try {
      const payload = {
        ...certForm,
        issueDate: certForm.issueDate ? certForm.issueDate + "T00:00:00" : null,
      };

      let url, method;
      if (certEditTarget) {
        url    = `${BASE}/profiles/${profileId}/certifications/${certEditTarget.id}`;
        method = "PUT";
      } else {
        url    = `${BASE}/profiles/${profileId}/certifications`;
        method = "POST";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorMessage || "Failed to save certification.");
      }

      setCertModalOpen(false);
      fetchProfile();
    } catch (err) {
      setCertError(err.message);
    } finally {
      setCertSaving(false);
    }
  }

  async function deleteCert(certId) {
    if (!window.confirm("Delete this certification?")) return;
    try {
      const res = await fetch(`${BASE}/profiles/${profileId}/certifications/${certId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete.");
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  }

  // ─────────────────────────────────────────
  // CLOUDINARY UPLOADS
  // ─────────────────────────────────────────
  async function handlePicUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${BASE}/profiles/${profileId}/picture`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed.");
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPic(false);
    }
  }

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${BASE}/profiles/${profileId}/cover`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed.");
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleResumeUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${BASE}/profiles/${profileId}/resume`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed.");
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingResume(false);
    }
  }

  // ─────────────────────────────────────────
  // RENDER GUARDS
  // ─────────────────────────────────────────
  if (loading) return (
    <div className="mpf-page"><Navbar />
      <p className="mpf-status">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="mpf-page"><Navbar />
      <p className="mpf-status mpf-error">{error}</p>
    </div>
  );

  const initials = profile.name
    ? profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="mpf-page">
      <Navbar />
      <main className="mpf-main">

        {/* ── Hero Card ── */}
        <div className="mpf-hero-card">

          {/* Banner / cover photo */}
          <div
            className="mpf-banner"
            style={profile.coverPhotoUrl ? {
              backgroundImage: `url(${profile.coverPhotoUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}}
          >
            <button
              className="mpf-btn-upload-cover"
              onClick={() => coverInputRef.current.click()}
              disabled={uploadingCover}
            >
              {uploadingCover ? "Uploading..." : (<><EditIcon /> Edit Cover</>)}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleCoverUpload}
            />
          </div>

          <div className="mpf-hero-body">
            {/* Avatar with upload overlay */}
            <div className="mpf-avatar-wrap" onClick={() => picInputRef.current.click()}>
              {profile.profilePictureUrl ? (
                <img src={profile.profilePictureUrl} alt="Profile" className="mpf-avatar-image" />
              ) : (
                <div className="mpf-avatar">{initials}</div>
              )}
              <div className="mpf-avatar-overlay">
                {uploadingPic ? "..." : <EditIcon size={18} />}
              </div>
              <input
                ref={picInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePicUpload}
              />
            </div>

            <div className="mpf-hero-info">
              {editingBasic ? (
                /* ── Basic Info Edit Form ── */
                <div className="mpf-basic-edit-form">
                  <div className="mpf-basic-edit-row">
                    <div className="mpf-basic-edit-field">
                      <label>Name</label>
                      <input name="name" value={basicForm.name} onChange={handleBasicChange} placeholder="Your full name" />
                    </div>
                    <div className="mpf-basic-edit-field">
                      <label>Job Title</label>
                      <input name="jobTitle" value={basicForm.jobTitle} onChange={handleBasicChange} placeholder="e.g. Software Engineer" />
                    </div>
                  </div>
                  <div className="mpf-basic-edit-row">
                    <div className="mpf-basic-edit-field">
                      <label>Company</label>
                      <input name="company" value={basicForm.company} onChange={handleBasicChange} placeholder="Current company" />
                    </div>
                    <div className="mpf-basic-edit-field">
                      <label>Location</label>
                      <input name="location" value={basicForm.location} onChange={handleBasicChange} placeholder="City, Country" />
                    </div>
                  </div>
                  <div className="mpf-basic-edit-row">
                    <div className="mpf-basic-edit-field">
                      <label>GitHub URL</label>
                      <input name="githubUrl" value={basicForm.githubUrl} onChange={handleBasicChange} placeholder="https://github.com/yourname" />
                    </div>
                    <div className="mpf-basic-edit-field">
                      <label>LinkedIn URL</label>
                      <input name="linkedinUrl" value={basicForm.linkedinUrl} onChange={handleBasicChange} placeholder="https://linkedin.com/in/yourname" />
                    </div>
                  </div>
                  <div className="mpf-basic-edit-field">
                    <label>About</label>
                    <textarea name="about" value={basicForm.about} onChange={handleBasicChange} placeholder="Write a short bio..." rows={3} />
                  </div>
                  {basicError && <p className="mpf-form-error">{basicError}</p>}
                  <div className="mpf-edit-actions">
                    <button className="mpf-btn-cancel-edit" onClick={() => setEditingBasic(false)}>Cancel</button>
                    <button className="mpf-btn-save-edit" onClick={saveBasicInfo} disabled={basicSaving}>
                      {basicSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Basic Info Display ── */
                <>
                  <h1 className="mpf-hero-name">{profile.name || "No name set"}</h1>
                  {profile.jobTitle && <p className="mpf-hero-headline">{profile.jobTitle}</p>}
                  <p className="mpf-hero-meta">
                    {[profile.company, profile.location].filter(Boolean).join(" · ")}
                  </p>

                  {/* ── Contact icons: Mail always shown (from email), GitHub/LinkedIn only if set ── */}
                  <div className="mpf-contact-icons">
                    {profile.email && (
                      <a
                        className="mpf-contact-icon"
                        href={`mailto:${profile.email}`}
                        title={profile.email}
                        aria-label="Email"
                      >
                        <MailIcon />
                      </a>
                    )}
                    {profile.githubUrl && (
                      <a
                        className="mpf-contact-icon"
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="GitHub"
                        aria-label="GitHub"
                      >
                        <GithubIcon />
                      </a>
                    )}
                    {profile.linkedinUrl && (
                      <a
                        className="mpf-contact-icon"
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="LinkedIn"
                        aria-label="LinkedIn"
                      >
                        <LinkedinIcon />
                      </a>
                    )}
                  </div>

                  <button className="mpf-btn-edit-section" onClick={openBasicEdit}><EditIcon /> Edit</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── About (shown only when not editing basic — about is edited inline above) ── */}
        {!editingBasic && profile.about && (
          <section className="mpf-card">
            <h2 className="mpf-card-title">About</h2>
            <p className="mpf-about-text">{profile.about}</p>
          </section>
        )}

        {/* ── Skills ── */}
        <section className="mpf-card">
          <div className="mpf-card-header">
            <h2 className="mpf-card-title">Skills</h2>
            {!editingSkills && (
              <button className="mpf-btn-edit-section" onClick={openSkillsEdit}><EditIcon /> Edit</button>
            )}
          </div>

          {editingSkills ? (
            <div className="mpf-skills-edit">
              <div className="mpf-skill-input-row">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Type a skill and press Enter or Add"
                />
                <button className="mpf-btn-add-skill" onClick={addSkill}>Add</button>
              </div>
              <div className="mpf-tags" style={{ marginTop: "12px" }}>
                {skillsList.map((skill, i) => (
                  <span key={i} className="mpf-tag mpf-tag-removable">
                    {skill}
                    <button className="mpf-btn-remove-skill" onClick={() => removeSkill(skill)}>
                      <CloseIcon size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mpf-edit-actions" style={{ marginTop: "16px" }}>
                <button className="mpf-btn-cancel-edit" onClick={() => setEditingSkills(false)}>Cancel</button>
                <button className="mpf-btn-save-edit" onClick={saveSkills} disabled={skillsSaving}>
                  {skillsSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            profile.skills?.length > 0 ? (
              <div className="mpf-tags">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="mpf-tag">{skill}</span>
                ))}
              </div>
            ) : (
              <p className="mpf-empty">No skills added yet.</p>
            )
          )}
        </section>

        {/* ── Two-column grid ── */}
        <div className="mpf-two-col">

          {/* ── Experience ── */}
          <section className="mpf-card">
            <div className="mpf-card-header">
              <h2 className="mpf-card-title">Experience &amp; Internships</h2>
              <button className="mpf-btn-add-section" onClick={openAddExp}>+ Add</button>
            </div>
            {profile.experience?.length > 0 ? (
              <div className="mpf-entry-list">
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="mpf-entry">
                    <div className="mpf-entry-header">
                      <p className="mpf-entry-title">{exp.title}</p>
                      <div className="mpf-entry-actions">
                        <button className="mpf-btn-entry-action" onClick={() => openEditExp(exp)}><EditIcon /></button>
                        <button className="mpf-btn-entry-action mpf-btn-entry-delete" onClick={() => deleteExp(exp.id)}><CloseIcon /></button>
                      </div>
                    </div>
                    <p className="mpf-entry-sub">
                      {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                    </p>
                    {exp.startDate && (
                      <p className="mpf-entry-dates">
                        {formatDate(exp.startDate)} — {exp.working ? "Present" : formatDate(exp.endDate)}
                      </p>
                    )}
                    {exp.description && (
                      <p className="mpf-entry-desc">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mpf-empty">No experience added yet.</p>
            )}
          </section>

          {/* ── Right column ── */}
          <div className="mpf-right-col">

            {/* ── Certifications ── */}
            <section className="mpf-card">
              <div className="mpf-card-header">
                <h2 className="mpf-card-title">Certifications</h2>
                <button className="mpf-btn-add-section" onClick={openAddCert}>+ Add</button>
              </div>
              {profile.certifications?.length > 0 ? (
                <div className="mpf-entry-list">
                  {profile.certifications.map((cert) => (
                    <div key={cert.id} className="mpf-entry">
                      <div className="mpf-entry-header">
                        <p className="mpf-entry-title">{cert.name}</p>
                        <div className="mpf-entry-actions">
                          <button className="mpf-btn-entry-action" onClick={() => openEditCert(cert)}><EditIcon /></button>
                          <button className="mpf-btn-entry-action mpf-btn-entry-delete" onClick={() => deleteCert(cert.id)}><CloseIcon /></button>
                        </div>
                      </div>
                      <p className="mpf-entry-sub">{cert.issuer}</p>
                      {cert.issueDate && (
                        <p className="mpf-entry-dates">Issued {formatDate(cert.issueDate)}</p>
                      )}
                      {cert.certificateId && (
                        <p className="mpf-entry-desc">ID: {cert.certificateId}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mpf-empty">No certifications added yet.</p>
              )}
            </section>

            {/* ── Resume ── */}
            <section className="mpf-card mpf-resume-card">
              <h2 className="mpf-card-title">Resume</h2>
              {profile.resumeUrl ? (
                <div className="mpf-resume-exists-row">
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mpf-btn-resume"
                  >
                    View Resume ↗
                  </a>
                  <button
                    className="mpf-btn-resume-reupload"
                    onClick={() => resumeInputRef.current.click()}
                    disabled={uploadingResume}
                  >
                    {uploadingResume ? "Uploading..." : "Replace"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mpf-resume-placeholder-row">
                    <div className="mpf-resume-pdf-icon">PDF</div>
                    <p className="mpf-resume-placeholder-text">No resume uploaded yet.</p>
                  </div>
                  <button
                    className="mpf-btn-resume"
                    onClick={() => resumeInputRef.current.click()}
                    disabled={uploadingResume}
                  >
                    {uploadingResume ? "Uploading..." : "Upload Resume"}
                  </button>
                </>
              )}
              <input
                ref={resumeInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleResumeUpload}
              />
            </section>

          </div>
        </div>

      </main>

      {/* ── Experience Modal ── */}
      {expModalOpen && (
        <div className="mpf-modal-overlay" onClick={() => setExpModalOpen(false)}>
          <div className="mpf-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{expEditTarget ? "Edit Experience" : "Add Experience"}</h2>

            <label>Job Title</label>
            <input name="title" value={expForm.title} onChange={handleExpChange} placeholder="e.g. Software Engineer Intern" />

            <label>Company</label>
            <input name="company" value={expForm.company} onChange={handleExpChange} placeholder="Company name" />

            <label>Location</label>
            <input name="location" value={expForm.location} onChange={handleExpChange} placeholder="City, Country" />

            <label>Start Date</label>
            <input name="startDate" type="date" value={expForm.startDate} onChange={handleExpChange} />

            <div className="mpf-checkbox-row">
              <input
                type="checkbox"
                id="working"
                name="working"
                checked={expForm.working}
                onChange={handleExpChange}
                style={{ width: "auto" }}
              />
              <label htmlFor="working" style={{ marginBottom: 0 }}>I currently work here</label>
            </div>

            {!expForm.working && (
              <>
                <label>End Date</label>
                <input name="endDate" type="date" value={expForm.endDate} onChange={handleExpChange} />
              </>
            )}

            <label>Description</label>
            <textarea name="description" value={expForm.description} onChange={handleExpChange} placeholder="What did you do?" rows={3} />

            {expError && <p className="mpf-form-error">{expError}</p>}

            <div className="mpf-modal-actions">
              <button className="mpf-btn-cancel" onClick={() => setExpModalOpen(false)}>Cancel</button>
              <button className="mpf-btn-apply" onClick={saveExp} disabled={expSaving}>
                {expSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Certification Modal ── */}
      {certModalOpen && (
        <div className="mpf-modal-overlay" onClick={() => setCertModalOpen(false)}>
          <div className="mpf-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{certEditTarget ? "Edit Certification" : "Add Certification"}</h2>

            <label>Certificate Name</label>
            <input name="name" value={certForm.name} onChange={handleCertChange} placeholder="e.g. AWS Cloud Practitioner" />

            <label>Issuing Organisation</label>
            <input name="issuer" value={certForm.issuer} onChange={handleCertChange} placeholder="e.g. Amazon Web Services" />

            <label>Issue Date</label>
            <input name="issueDate" type="date" value={certForm.issueDate} onChange={handleCertChange} />

            <label>Certificate ID</label>
            <input name="certificateId" value={certForm.certificateId} onChange={handleCertChange} placeholder="Optional credential ID" />

            {certError && <p className="mpf-form-error">{certError}</p>}

            <div className="mpf-modal-actions">
              <button className="mpf-btn-cancel" onClick={() => setCertModalOpen(false)}>Cancel</button>
              <button className="mpf-btn-apply" onClick={saveCert} disabled={certSaving}>
                {certSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

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

