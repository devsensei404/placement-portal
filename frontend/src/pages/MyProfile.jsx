import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar.jsx";
import "./MyProfile.css";

const BASE = "http://localhost:8080";

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
    name: "", jobTitle: "", company: "", location: "", about: ""
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
    <div className="profile-page"><Navbar />
      <p className="profile-status">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="profile-page"><Navbar />
      <p className="profile-status profile-error">{error}</p>
    </div>
  );

  const initials = profile.name
    ? profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="profile-page">
      <Navbar />
      <main className="profile-main">

        {/* ── Hero Card ── */}
        <div className="profile-hero-card">

          {/* Banner / cover photo */}
          <div
            className="profile-banner"
            style={profile.coverPhotoUrl ? {
              backgroundImage: `url(${profile.coverPhotoUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}}
          >
            <button
              className="btn-upload-cover"
              onClick={() => coverInputRef.current.click()}
              disabled={uploadingCover}
            >
              {uploadingCover ? "Uploading..." : "✎ Edit Cover"}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleCoverUpload}
            />
          </div>

          <div className="profile-hero-body">
            {/* Avatar with upload overlay */}
            <div className="profile-avatar-wrap" onClick={() => picInputRef.current.click()}>
              {profile.profilePictureUrl ? (
                <img src={profile.profilePictureUrl} alt="Profile" className="profile-avatar-image" />
              ) : (
                <div className="profile-avatar">{initials}</div>
              )}
              <div className="profile-avatar-overlay">
                {uploadingPic ? "..." : "✎"}
              </div>
              <input
                ref={picInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePicUpload}
              />
            </div>

            <div className="profile-hero-info">
              {editingBasic ? (
                /* ── Basic Info Edit Form ── */
                <div className="basic-edit-form">
                  <div className="basic-edit-row">
                    <div className="basic-edit-field">
                      <label>Name</label>
                      <input name="name" value={basicForm.name} onChange={handleBasicChange} placeholder="Your full name" />
                    </div>
                    <div className="basic-edit-field">
                      <label>Job Title</label>
                      <input name="jobTitle" value={basicForm.jobTitle} onChange={handleBasicChange} placeholder="e.g. Software Engineer" />
                    </div>
                  </div>
                  <div className="basic-edit-row">
                    <div className="basic-edit-field">
                      <label>Company</label>
                      <input name="company" value={basicForm.company} onChange={handleBasicChange} placeholder="Current company" />
                    </div>
                    <div className="basic-edit-field">
                      <label>Location</label>
                      <input name="location" value={basicForm.location} onChange={handleBasicChange} placeholder="City, Country" />
                    </div>
                  </div>
                  <div className="basic-edit-field">
                    <label>About</label>
                    <textarea name="about" value={basicForm.about} onChange={handleBasicChange} placeholder="Write a short bio..." rows={3} />
                  </div>
                  {basicError && <p className="form-error">{basicError}</p>}
                  <div className="edit-actions">
                    <button className="btn-cancel-edit" onClick={() => setEditingBasic(false)}>Cancel</button>
                    <button className="btn-save-edit" onClick={saveBasicInfo} disabled={basicSaving}>
                      {basicSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Basic Info Display ── */
                <>
                  <h1 className="profile-hero-name">{profile.name || "No name set"}</h1>
                  {profile.jobTitle && <p className="profile-hero-headline">{profile.jobTitle}</p>}
                  <p className="profile-hero-meta">
                    {[profile.company, profile.location].filter(Boolean).join(" · ")}
                  </p>
                  <button className="btn-edit-section" onClick={openBasicEdit}>✎ Edit</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── About (shown only when not editing basic — about is edited inline above) ── */}
        {!editingBasic && profile.about && (
          <section className="profile-card">
            <h2 className="profile-card-title">About</h2>
            <p className="profile-about-text">{profile.about}</p>
          </section>
        )}

        {/* ── Skills ── */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">Skills</h2>
            {!editingSkills && (
              <button className="btn-edit-section" onClick={openSkillsEdit}>✎ Edit</button>
            )}
          </div>

          {editingSkills ? (
            <div className="skills-edit">
              <div className="skill-input-row">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Type a skill and press Enter or Add"
                />
                <button className="btn-add-skill" onClick={addSkill}>Add</button>
              </div>
              <div className="profile-tags" style={{ marginTop: "12px" }}>
                {skillsList.map((skill, i) => (
                  <span key={i} className="profile-tag profile-tag-removable">
                    {skill}
                    <button className="btn-remove-skill" onClick={() => removeSkill(skill)}>×</button>
                  </span>
                ))}
              </div>
              <div className="edit-actions" style={{ marginTop: "16px" }}>
                <button className="btn-cancel-edit" onClick={() => setEditingSkills(false)}>Cancel</button>
                <button className="btn-save-edit" onClick={saveSkills} disabled={skillsSaving}>
                  {skillsSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            profile.skills?.length > 0 ? (
              <div className="profile-tags">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="profile-tag">{skill}</span>
                ))}
              </div>
            ) : (
              <p className="profile-empty">No skills added yet.</p>
            )
          )}
        </section>

        {/* ── Two-column grid ── */}
        <div className="profile-two-col">

          {/* ── Experience ── */}
          <section className="profile-card">
            <div className="profile-card-header">
              <h2 className="profile-card-title">Experience &amp; Internships</h2>
              <button className="btn-add-section" onClick={openAddExp}>+ Add</button>
            </div>
            {profile.experience?.length > 0 ? (
              <div className="profile-entry-list">
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="profile-entry">
                    <div className="entry-header">
                      <p className="profile-entry-title">{exp.title}</p>
                      <div className="entry-actions">
                        <button className="btn-entry-action" onClick={() => openEditExp(exp)}>✎</button>
                        <button className="btn-entry-action btn-entry-delete" onClick={() => deleteExp(exp.id)}>✕</button>
                      </div>
                    </div>
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

          {/* ── Right column ── */}
          <div className="profile-right-col">

            {/* ── Certifications ── */}
            <section className="profile-card">
              <div className="profile-card-header">
                <h2 className="profile-card-title">Certifications</h2>
                <button className="btn-add-section" onClick={openAddCert}>+ Add</button>
              </div>
              {profile.certifications?.length > 0 ? (
                <div className="profile-entry-list">
                  {profile.certifications.map((cert) => (
                    <div key={cert.id} className="profile-entry">
                      <div className="entry-header">
                        <p className="profile-entry-title">{cert.name}</p>
                        <div className="entry-actions">
                          <button className="btn-entry-action" onClick={() => openEditCert(cert)}>✎</button>
                          <button className="btn-entry-action btn-entry-delete" onClick={() => deleteCert(cert.id)}>✕</button>
                        </div>
                      </div>
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

            {/* ── Resume ── */}
            <section className="profile-card profile-resume-card">
              <h2 className="profile-card-title">Resume</h2>
              {profile.resumeUrl ? (
                <div className="resume-exists-row">
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-resume"
                  >
                    View Resume ↗
                  </a>
                  <button
                    className="btn-resume-reupload"
                    onClick={() => resumeInputRef.current.click()}
                    disabled={uploadingResume}
                  >
                    {uploadingResume ? "Uploading..." : "Replace"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="resume-placeholder-row">
                    <div className="resume-pdf-icon">PDF</div>
                    <p className="resume-placeholder-text">No resume uploaded yet.</p>
                  </div>
                  <button
                    className="btn-resume"
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
                accept=".pdf"
                style={{ display: "none" }}
                onChange={handleResumeUpload}
              />
            </section>

          </div>
        </div>

      </main>

      {/* ── Experience Modal ── */}
      {expModalOpen && (
        <div className="modal-overlay" onClick={() => setExpModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{expEditTarget ? "Edit Experience" : "Add Experience"}</h2>

            <label>Job Title</label>
            <input name="title" value={expForm.title} onChange={handleExpChange} placeholder="e.g. Software Engineer Intern" />

            <label>Company</label>
            <input name="company" value={expForm.company} onChange={handleExpChange} placeholder="Company name" />

            <label>Location</label>
            <input name="location" value={expForm.location} onChange={handleExpChange} placeholder="City, Country" />

            <label>Start Date</label>
            <input name="startDate" type="date" value={expForm.startDate} onChange={handleExpChange} />

            <div className="checkbox-row">
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

            {expError && <p className="form-error">{expError}</p>}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setExpModalOpen(false)}>Cancel</button>
              <button className="btn-apply" onClick={saveExp} disabled={expSaving}>
                {expSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Certification Modal ── */}
      {certModalOpen && (
        <div className="modal-overlay" onClick={() => setCertModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{certEditTarget ? "Edit Certification" : "Add Certification"}</h2>

            <label>Certificate Name</label>
            <input name="name" value={certForm.name} onChange={handleCertChange} placeholder="e.g. AWS Cloud Practitioner" />

            <label>Issuing Organisation</label>
            <input name="issuer" value={certForm.issuer} onChange={handleCertChange} placeholder="e.g. Amazon Web Services" />

            <label>Issue Date</label>
            <input name="issueDate" type="date" value={certForm.issueDate} onChange={handleCertChange} />

            <label>Certificate ID</label>
            <input name="certificateId" value={certForm.certificateId} onChange={handleCertChange} placeholder="Optional credential ID" />

            {certError && <p className="form-error">{certError}</p>}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setCertModalOpen(false)}>Cancel</button>
              <button className="btn-apply" onClick={saveCert} disabled={certSaving}>
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
