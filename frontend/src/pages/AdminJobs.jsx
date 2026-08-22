import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar.jsx";
import "./AdminDashboard.css";
import "./AdminAnalytics.css";
import "./AdminCompanies.css";
import "./AdminUsers.css";
import BASE_URL from "../api";

const STATUS_FILTERS = [
  { value: null, label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "DRAFT", label: "Draft" },
];

const STATUS_BADGE_CLASS = {
  OPEN: "ac-badge-approved",
  CLOSED: "ac-badge-incomplete",
  DRAFT: "ac-badge-pending",
};

const JOB_TYPE_LABELS = {
  FULL_TIME: "Full-Time",
  PART_TIME: "Part-Time",
  INTERNSHIP: "Internship",
};

function StatusBadge({ status }) {
  const cls = STATUS_BADGE_CLASS[status] || "ac-badge-incomplete";
  const label = status ? status.charAt(0) + status.slice(1).toLowerCase() : "Unknown";
  return <span className={`ac-badge ${cls}`}>{label}</span>;
}

function TypeBadge({ jobType }) {
  const label = JOB_TYPE_LABELS[jobType] || jobType || "Unknown";
  return <span className="ac-badge ac-badge-incomplete">{label}</span>;
}

function formatRelativeTime(iso) {
  if (!iso) return "—";
  const then = new Date(iso);
  const diffMs = Date.now() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function DeleteConfirmDialog({ job, onConfirm, onCancel, busy, errorMsg }) {
  if (!job) return null;
  return (
    <div className="ac-modal-backdrop" onClick={onCancel}>
      <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="ac-modal-title">Delete "{job.jobTitle}"?</h3>
        <p className="ac-modal-body">
          This will permanently delete this job posting and cannot be undone.
          {job.applicants && job.applicants.length > 0
            ? " This job has existing applicants, so the deletion may be blocked by the server until those applications are handled."
            : ""}
        </p>
        {errorMsg && <p className="ac-modal-body" style={{ color: "#b91c1c", marginTop: "-14px" }}>{errorMsg}</p>}
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="ac-btn ac-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete Job Posting"}
          </button>
        </div>
      </div>
    </div>
  );
}

function JobRow({ job, onRequestDelete, actionBusy }) {
  const isBusy = actionBusy === job.id;

  return (
    <tr className="ac-row">
      <td className="ac-td-name" data-label="Job Title">{job.jobTitle}</td>
      <td data-label="Company">{job.companyName || "—"}</td>
      <td data-label="Type"><TypeBadge jobType={job.jobType} /></td>
      <td data-label="Status"><StatusBadge status={job.status} /></td>
      <td data-label="Posted">{formatRelativeTime(job.postTime)}</td>
      <td className="ac-td-actions" data-label="Actions">
        <button
          type="button"
          className="ac-btn ac-btn-danger ac-btn-sm"
          onClick={() => onRequestDelete(job)}
          disabled={isBusy}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default function AdminJobs() {
  const token = localStorage.getItem("token");

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [statusFilter, setStatusFilter] = useState(null);
  const [search, setSearch] = useState("");

  const [actionBusy, setActionBusy] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${BASE_URL}/admin/jobs`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setJobs)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const filtered = useMemo(() => {
    let list = jobs;
    if (statusFilter) list = list.filter((j) => j.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (j) => j.jobTitle?.toLowerCase().includes(q) || j.companyName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobs, statusFilter, search]);

  const isFiltered = statusFilter !== null || search.trim() !== "";

  function removeJob(id) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  function handleRequestDelete(job) {
    setDeleteError(null);
    setDeleteTarget(job);
  }

  async function handleConfirmDelete() {
    const job = deleteTarget;
    if (!job) return;
    setActionBusy(job.id);
    setDeleteError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/jobs/delete/${job.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let bodyText = "";
        try { bodyText = await res.text(); } catch { }
        if (bodyText.includes("JOB_HAS_APPLICANTS")) {
          setDeleteError("This job has existing applicants and can't be deleted until they're handled.");
        } else {
          setDeleteError("Couldn't delete this job posting. Please try again.");
        }
        return;
      }
      removeJob(job.id);
      setSuccessMsg(`"${job.jobTitle}" deleted.`);
      setDeleteTarget(null);
    } catch {
      setDeleteError("Couldn't delete this job posting. Please try again.");
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-main">
        <div className="ad-header ad-fade-in">
          <div>
            <h1 className="dash-title">Jobs</h1>
            <p className="welcome">Browse and moderate all job postings</p>
          </div>
        </div>

        {successMsg && <div className="ac-success-banner">{successMsg}</div>}

        <section className="ad-section">
          <div className="ad-section-header">
            <h2 className="section-heading">All Job Postings</h2>
          </div>

          <div className="ac-directory-controls">
            <div className="aa-chart-type-switcher">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  className={statusFilter === f.value ? "aa-chip aa-chip-selected" : "aa-chip"}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="ac-search-input"
              placeholder="Search by job title or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading && <div className="trend-skeleton" />}

          {!loading && error && (
            <p className="ac-error">Couldn't load job postings. Please try again.</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="ac-empty">
              {isFiltered ? "No jobs match this filter." : "No job postings found."}
            </p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="ac-table-wrap">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Posted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((j) => (
                    <JobRow
                      key={j.id}
                      job={j}
                      onRequestDelete={handleRequestDelete}
                      actionBusy={actionBusy}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <DeleteConfirmDialog
          job={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
          busy={actionBusy === deleteTarget?.id}
          errorMsg={deleteError}
        />
      </main>
    </div>
  );
}
