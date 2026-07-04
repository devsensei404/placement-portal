import { useState, useEffect } from "react";
import BASE_URL from "../api";
import Navbar from "../components/Navbar";
import "./ResumeBuilder.css";

const emptyEducation = () => ({ degree: "", institution: "", year: "", grade: "" });
const emptyExperience = () => ({ title: "", company: "", duration: "", location: "", points: [""] });
const emptyProject = () => ({ name: "", tech: "", points: [""] });
const emptyCertification = () => ({ name: "", issuer: "", date: "", credentialId: "", credentialUrl: "" });

function formatDuration(exp) {
  const fmt = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { month: "short", year: "numeric" });
  };
  const end = exp.working ? "Present" : fmt(exp.endDate);
  return `${fmt(exp.startDate)} – ${end}`;
}

export default function ResumeBuilder() {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    resumeImageUrl: "",
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    education: [emptyEducation()],
    skills: [],
    experience: [emptyExperience()],
    projects: [emptyProject()],
    certifications: [emptyCertification()],
    achievements: [""],
  });

  const [skillInput, setSkillInput] = useState("");
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    setPrefilling(true);
    fetch(`${BASE_URL}/profiles/get/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((profile) => {
        setForm((prev) => ({
          ...prev,
          name: profile.name || "",
          email: profile.email || "",
          resumeImageUrl: profile.resumeUrl || "",
          skills: Array.isArray(profile.skills) ? [...profile.skills] : [],
          experience: Array.isArray(profile.experience) && profile.experience.length > 0
            ? profile.experience.map((e) => ({
                title: e.title || "",
                company: e.company || "",
                duration: formatDuration(e),
                location: "",
                points: [""],
              }))
            : [emptyExperience()],
        }));
      })
      .catch(() => {})
      .finally(() => setPrefilling(false));
  }, [userId]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Education
  const updateEdu = (i, key, val) =>
    setField("education", form.education.map((e, idx) => idx === i ? { ...e, [key]: val } : e));
  const addEdu = () => setField("education", [...form.education, emptyEducation()]);
  const removeEdu = (i) => setField("education", form.education.filter((_, idx) => idx !== i));

  // Skills
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setField("skills", [...form.skills, s]);
    setSkillInput("");
  };
  const removeSkill = (s) => setField("skills", form.skills.filter((x) => x !== s));

  // Experience
  const updateExp = (i, key, val) =>
    setField("experience", form.experience.map((e, idx) => idx === i ? { ...e, [key]: val } : e));
  const addExpPoint = (i) =>
    setField("experience", form.experience.map((e, idx) => idx === i ? { ...e, points: [...e.points, ""] } : e));
  const updateExpPoint = (i, pi, val) =>
    setField("experience", form.experience.map((e, idx) => idx === i
      ? { ...e, points: e.points.map((p, pidx) => pidx === pi ? val : p) } : e));
  const removeExpPoint = (i, pi) =>
    setField("experience", form.experience.map((e, idx) => idx === i
      ? { ...e, points: e.points.filter((_, pidx) => pidx !== pi) } : e));
  const addExp = () => setField("experience", [...form.experience, emptyExperience()]);
  const removeExp = (i) => setField("experience", form.experience.filter((_, idx) => idx !== i));

  // Projects
  const updateProj = (i, key, val) =>
    setField("projects", form.projects.map((p, idx) => idx === i ? { ...p, [key]: val } : p));
  const addProjPoint = (i) =>
    setField("projects", form.projects.map((p, idx) => idx === i ? { ...p, points: [...p.points, ""] } : p));
  const updateProjPoint = (i, pi, val) =>
    setField("projects", form.projects.map((p, idx) => idx === i
      ? { ...p, points: p.points.map((pt, pidx) => pidx === pi ? val : pt) } : p));
  const removeProjPoint = (i, pi) =>
    setField("projects", form.projects.map((p, idx) => idx === i
      ? { ...p, points: p.points.filter((_, pidx) => pidx !== pi) } : p));
  const addProj = () => setField("projects", [...form.projects, emptyProject()]);
  const removeProj = (i) => setField("projects", form.projects.filter((_, idx) => idx !== i));

  // Certifications
  const updateCert = (i, key, val) =>
    setField("certifications", form.certifications.map((c, idx) => idx === i ? { ...c, [key]: val } : c));
  const addCert = () => setField("certifications", [...form.certifications, emptyCertification()]);
  const removeCert = (i) => setField("certifications", form.certifications.filter((_, idx) => idx !== i));

  // Achievements
  const updateAch = (i, val) =>
    setField("achievements", form.achievements.map((a, idx) => idx === i ? val : a));
  const addAch = () => setField("achievements", [...form.achievements, ""]);
  const removeAch = (i) => setField("achievements", form.achievements.filter((_, idx) => idx !== i));

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/resume/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeImageUrl: form.resumeImageUrl,
          name: form.name,
          email: form.email,
          phone: form.phone,
          location: form.location,
          linkedin: form.linkedin,
          github: form.github,
          portfolio: form.portfolio,
          education: form.education,
          skills: form.skills,
          experience: form.experience,
          projects: form.projects,
          certifications: form.certifications.filter(
            (c) => c.name.trim() || c.issuer.trim() || c.date.trim()
          ),
          achievements: form.achievements.filter((a) => a.trim()),
        }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setResumeData(data.resume);
    } catch (e) {
      setError(e.message || "Failed to generate resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!window.html2pdf) return alert("PDF library not loaded.");
    window.html2pdf()
      .set({
        margin: 10,
        filename: "resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(document.getElementById("resume-preview"))
      .save();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
     <Navbar />
    <div className="rb-root">
      {prefilling && <p className="rb-prefill-note">Pre-filling from your profile…</p>}

      <div className="rb-columns">
        {/* ── LEFT: Form ── */}
        <div className="rb-form-col">

          {/* Personal Info */}
          <section className="rb-section">
            <h3 className="rb-section-title">Personal Info</h3>
            {[
              ["name", "Full Name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["location", "Location (City, State/Country)"],
              ["linkedin", "LinkedIn URL"],
              ["github", "GitHub URL"],
              ["portfolio", "Portfolio / Website"],
              ["resumeImageUrl", "Profile Image URL"],
            ].map(([key, label]) => (
              <div className="rb-field" key={key}>
                <label className="rb-label">{label}</label>
                <input
                  className="rb-input"
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder={label}
                />
              </div>
            ))}
          </section>

          {/* Education */}
          <section className="rb-section">
            <h3 className="rb-section-title">Education</h3>
            {form.education.map((edu, i) => (
              <div className="rb-card" key={i}>
                <div className="rb-card-header">
                  <span className="rb-card-label">Entry {i + 1}</span>
                  {form.education.length > 1 && (
                    <button className="rb-remove-btn" onClick={() => removeEdu(i)}>Remove</button>
                  )}
                </div>
                {[["degree","Degree"],["institution","Institution"],["year","Year"],["grade","Grade / GPA"]].map(([k,l]) => (
                  <div className="rb-field" key={k}>
                    <label className="rb-label">{l}</label>
                    <input className="rb-input" value={edu[k]} placeholder={l}
                      onChange={(e) => updateEdu(i, k, e.target.value)} />
                  </div>
                ))}
              </div>
            ))}
            <button className="rb-add-btn" onClick={addEdu}>+ Add Education</button>
          </section>

          {/* Skills */}
          <section className="rb-section">
            <h3 className="rb-section-title">Skills</h3>
            <div className="rb-skill-chips">
              {form.skills.map((s) => (
                <span className="rb-chip" key={s}>
                  {s}
                  <button className="rb-chip-remove" onClick={() => removeSkill(s)}>×</button>
                </span>
              ))}
            </div>
            <div className="rb-skill-input-row">
              <input
                className="rb-input"
                value={skillInput}
                placeholder="Add a skill"
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
              />
              <button className="rb-add-btn rb-add-btn--inline" onClick={addSkill}>Add</button>
            </div>
          </section>

          {/* Experience */}
          <section className="rb-section">
            <h3 className="rb-section-title">Experience</h3>
            {form.experience.map((exp, i) => (
              <div className="rb-card" key={i}>
                <div className="rb-card-header">
                  <span className="rb-card-label">Role {i + 1}</span>
                  {form.experience.length > 1 && (
                    <button className="rb-remove-btn" onClick={() => removeExp(i)}>Remove</button>
                  )}
                </div>
                {[["title","Job Title"],["company","Company"],["duration","Duration (e.g. Jan 2022 – Present)"],["location","Location (optional)"]].map(([k,l]) => (
                  <div className="rb-field" key={k}>
                    <label className="rb-label">{l}</label>
                    <input className="rb-input" value={exp[k]} placeholder={l}
                      onChange={(e) => updateExp(i, k, e.target.value)} />
                  </div>
                ))}
                <label className="rb-label">Bullet Points</label>
                {exp.points.map((pt, pi) => (
                  <div className="rb-bullet-row" key={pi}>
                    <input className="rb-input" value={pt} placeholder="Describe what you did…"
                      onChange={(e) => updateExpPoint(i, pi, e.target.value)} />
                    {exp.points.length > 1 && (
                      <button className="rb-remove-btn rb-remove-btn--small" onClick={() => removeExpPoint(i, pi)}>×</button>
                    )}
                  </div>
                ))}
                <button className="rb-add-btn rb-add-btn--small" onClick={() => addExpPoint(i)}>+ Point</button>
              </div>
            ))}
            <button className="rb-add-btn" onClick={addExp}>+ Add Experience</button>
          </section>

          {/* Projects */}
          <section className="rb-section">
            <h3 className="rb-section-title">Projects</h3>
            {form.projects.map((proj, i) => (
              <div className="rb-card" key={i}>
                <div className="rb-card-header">
                  <span className="rb-card-label">Project {i + 1}</span>
                  {form.projects.length > 1 && (
                    <button className="rb-remove-btn" onClick={() => removeProj(i)}>Remove</button>
                  )}
                </div>
                {[["name","Project Name"],["tech","Tech Stack"]].map(([k,l]) => (
                  <div className="rb-field" key={k}>
                    <label className="rb-label">{l}</label>
                    <input className="rb-input" value={proj[k]} placeholder={l}
                      onChange={(e) => updateProj(i, k, e.target.value)} />
                  </div>
                ))}
                <label className="rb-label">Bullet Points</label>
                {proj.points.map((pt, pi) => (
                  <div className="rb-bullet-row" key={pi}>
                    <input className="rb-input" value={pt} placeholder="Describe what you built…"
                      onChange={(e) => updateProjPoint(i, pi, e.target.value)} />
                    {proj.points.length > 1 && (
                      <button className="rb-remove-btn rb-remove-btn--small" onClick={() => removeProjPoint(i, pi)}>×</button>
                    )}
                  </div>
                ))}
                <button className="rb-add-btn rb-add-btn--small" onClick={() => addProjPoint(i)}>+ Point</button>
              </div>
            ))}
            <button className="rb-add-btn" onClick={addProj}>+ Add Project</button>
          </section>

          {/* Certifications */}
          <section className="rb-section">
            <h3 className="rb-section-title">Certifications</h3>
            {form.certifications.map((cert, i) => (
              <div className="rb-card" key={i}>
                <div className="rb-card-header">
                  <span className="rb-card-label">Certification {i + 1}</span>
                  {form.certifications.length > 1 && (
                    <button className="rb-remove-btn" onClick={() => removeCert(i)}>Remove</button>
                  )}
                </div>
                {[
                  ["name", "Certificate Name"],
                  ["issuer", "Issuing Organization"],
                  ["date", "Date"],
                  ["credentialId", "Credential ID (optional)"],
                  ["credentialUrl", "Credential URL (optional)"],
                ].map(([k, l]) => (
                  <div className="rb-field" key={k}>
                    <label className="rb-label">{l}</label>
                    <input className="rb-input" value={cert[k]} placeholder={l}
                      onChange={(e) => updateCert(i, k, e.target.value)} />
                  </div>
                ))}
              </div>
            ))}
            <button className="rb-add-btn" onClick={addCert}>+ Add Certification</button>
          </section>

          {/* Achievements */}
          <section className="rb-section">
            <h3 className="rb-section-title">Achievements</h3>
            {form.achievements.map((a, i) => (
              <div className="rb-bullet-row" key={i}>
                <input className="rb-input" value={a} placeholder="e.g. Won Hackathon 2024"
                  onChange={(e) => updateAch(i, e.target.value)} />
                {form.achievements.length > 1 && (
                  <button className="rb-remove-btn rb-remove-btn--small" onClick={() => removeAch(i)}>×</button>
                )}
              </div>
            ))}
            <button className="rb-add-btn rb-add-btn--small" onClick={addAch}>+ Add Achievement</button>
          </section>

          {error && <p className="rb-error">{error}</p>}

          <button className="rb-generate-btn" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating…" : "Generate Resume"}
          </button>
        </div>

        {/* ── RIGHT: Preview ── */}
        <div className="rb-preview-col">
          {resumeData && (
            <button className="rb-download-btn" onClick={handleDownload}>
              ⬇ Download PDF
            </button>
          )}

          {!resumeData ? (
            <div className="rb-preview-placeholder">
              <svg
                className="rb-placeholder-icon"
                viewBox="0 0 24 24"
                width="44"
                height="44"
                fill="none"
                stroke="#111111"
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
              <p>Your AI-generated resume will appear here.</p>
              <p className="rb-placeholder-sub">Fill in the form and click <strong>Generate Resume</strong>.</p>
            </div>
          ) : (
            <div id="resume-preview" className="rb-resume-preview">
              {/* Header */}
              <div className="rv-header">
                <h1 className="rv-name">{resumeData.name}</h1>
                <div className="rv-contact">
                  {[resumeData.email, resumeData.phone, resumeData.location]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {(resumeData.linkedin || resumeData.github || resumeData.portfolio) && (
                  <div className="rv-contact rv-links">
                    {[resumeData.linkedin, resumeData.github, resumeData.portfolio]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div className="rv-section">
                  <h2 className="rv-section-title">Summary</h2>
                  <p className="rv-text">{resumeData.summary}</p>
                </div>
              )}

              {/* Education */}
              {resumeData.education?.length > 0 && (
                <div className="rv-section">
                  <h2 className="rv-section-title">Education</h2>
                  {resumeData.education.map((e, i) => (
                    <div className="rv-entry" key={i}>
                      <div className="rv-entry-top">
                        <span className="rv-entry-title">{e.degree}</span>
                        <span className="rv-entry-right">{e.year}</span>
                      </div>
                      <div className="rv-entry-sub">{e.institution}{e.grade ? ` · ${e.grade}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {resumeData.skills?.length > 0 && (
                <div className="rv-section">
                  <h2 className="rv-section-title">Skills</h2>
                  <p className="rv-text">{resumeData.skills.join(" · ")}</p>
                </div>
              )}

              {/* Experience */}
              {resumeData.experience?.length > 0 && (
                <div className="rv-section">
                  <h2 className="rv-section-title">Experience</h2>
                  {resumeData.experience.map((e, i) => (
                    <div className="rv-entry" key={i}>
                      <div className="rv-entry-top">
                        <span className="rv-entry-title">{e.title}</span>
                        <span className="rv-entry-right">{e.duration}</span>
                      </div>
                      <div className="rv-entry-sub">
                        {e.company}{e.location ? ` · ${e.location}` : ""}
                      </div>
                      {e.points?.length > 0 && (
                        <ul className="rv-bullets">
                          {e.points.filter(Boolean).map((pt, pi) => <li key={pi}>{pt}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {resumeData.projects?.length > 0 && (
                <div className="rv-section">
                  <h2 className="rv-section-title">Projects</h2>
                  {resumeData.projects.map((p, i) => (
                    <div className="rv-entry" key={i}>
                      <div className="rv-entry-top">
                        <span className="rv-entry-title">{p.name}</span>
                        <span className="rv-entry-right rv-tech">{p.tech}</span>
                      </div>
                      {p.points?.length > 0 && (
                        <ul className="rv-bullets">
                          {p.points.filter(Boolean).map((pt, pi) => <li key={pi}>{pt}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {resumeData.certifications?.length > 0 && (
                <div className="rv-section">
                  <h2 className="rv-section-title">Certifications</h2>
                  {resumeData.certifications.map((c, i) => (
                    <div className="rv-entry" key={i}>
                      <div className="rv-entry-top">
                        <span className="rv-entry-title">{c.name}</span>
                        <span className="rv-entry-right">{c.date}</span>
                      </div>
                      <div className="rv-entry-sub">
                        {c.issuer}
                        {c.credentialId ? ` · ID: ${c.credentialId}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Achievements */}
              {resumeData.achievements?.length > 0 && (
                <div className="rv-section">
                  <h2 className="rv-section-title">Achievements</h2>
                  <ul className="rv-bullets">
                    {resumeData.achievements.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
