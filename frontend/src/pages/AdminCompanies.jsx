// AdminCompanies.jsx
// Route: /admin/companies
// This is the destination for both Dashboard stat cards that link here
// ("Pending Company Approvals" and "Total Companies") — one page serving
// two purposes: an actionable approvals queue (Section 1) and a full
// company directory/management view (Section 2).
//
// Shared-state design: both sections read from a single `companies`
// array fetched once from GET /admin/companies (full-dump, no status
// filter). Section 1 (Pending Approvals) is simply
// companies.filter(status === "PENDING") over that same array, rather
// than an independent fetch — this makes "acting on a company in one
// section updates the other" automatic instead of something that has to
// be manually kept in sync across two copies of the data. Because of
// that, loading/error state is a single pair for the page rather than
// two truly independent ones (an independent per-section fetch would
// mean duplicate network calls for identical data). Each section still
// renders its own skeleton/empty/error UI from that shared pair, per
// the established per-section convention.
//
// humanizeAction / formatRelativeTime and the targetType-capitalization
// pattern are NOT used on this page — this page has no audit-log-style
// entries to render, so there's nothing to copy those helpers for.

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar.jsx";
import "./AdminDashboard.css";
import "./AdminAnalytics.css";
import "./AdminCompanies.css";
import BASE_URL from "../api";

const STATUS_FILTERS = [
  { value: null, label: "All" },
  { value: "INCOMPLETE", label: "Incomplete" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "SUSPENDED", label: "Suspended" },
];

// Badge color convention: green=Approved, amber=Pending,
// gray=Incomplete, red=Suspended. No REJECTED entry — rejected
// companies are hard-deleted server-side (AdminServiceImpl.rejectCompany)
// and can never appear in a GET /admin/companies response, so there's
// nothing to badge.
const STATUS_BADGE_CLASS = {
  APPROVED: "ac-badge-approved",
  PENDING: "ac-badge-pending",
  INCOMPLETE: "ac-badge-incomplete",
  SUSPENDED: "ac-badge-suspended",
};

function StatusBadge({ status }) {
  const cls = STATUS_BADGE_CLASS[status] || "ac-badge-incomplete";
  const label = status ? status.charAt(0) + status.slice(1).toLowerCase() : "Unknown";
  return <span className={`ac-badge ${cls}`}>{label}</span>;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ═══════════════════ Reject confirmation dialog ═══════════════════ */

function RejectConfirmDialog({ company, onConfirm, onCancel, busy }) {
  if (!company) return null;
  return (
    <div className="ac-modal-backdrop" onClick={onCancel}>
      <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="ac-modal-title">Reject "{company.name}"?</h3>
        <p className="ac-modal-body">
          This will permanently delete this company record and cannot be undone.
        </p>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="ac-btn ac-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Rejecting…" : "Reject & Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ Section 1: Pending queue ═══════════════════════ */

function PendingCard({ company, onApprove, onRequestReject, actionBusy }) {
  const isBusy = actionBusy === company.id;
  return (
    <div className="ac-pending-card">
      <div className="ac-pending-card-main">
        <p className="ac-pending-card-name">{company.name}</p>
        <p className="ac-pending-card-email">{company.officialEmail}</p>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="ac-pending-card-website"
          >
            {company.website}
          </a>
        )}
        <p className="ac-pending-card-date">Applied {formatDate(company.createdAt)}</p>
      </div>
      <div className="ac-pending-card-actions">
        <button
          type="button"
          className="ac-btn ac-btn-approve"
          onClick={() => onApprove(company)}
          disabled={isBusy}
        >
          {isBusy ? "…" : "Approve"}
        </button>
        <button
          type="button"
          className="ac-btn ac-btn-danger"
          onClick={() => onRequestReject(company)}
          disabled={isBusy}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function PendingSkeleton() {
  return (
    <div className="ac-pending-card ac-pending-card-skeleton">
      <div className="ac-pending-card-main">
        <div className="ac-skeleton-line ac-skeleton-line-wide" />
        <div className="ac-skeleton-line ac-skeleton-line-narrow" />
      </div>
    </div>
  );
}

function PendingSection({ pending, loading, error, onApprove, onRequestReject, actionBusy, successMsg }) {
  return (
    <section className="ad-section">
      <div className="ad-section-header">
        <h2 className="section-heading">Pending Approvals</h2>
      </div>

      {successMsg && <div className="ac-success-banner">{successMsg}</div>}

      {loading && (
        <div className="ac-pending-list">
          {[0, 1, 2].map((i) => <PendingSkeleton key={i} />)}
        </div>
      )}

      {!loading && error && (
        <p className="ac-error">Couldn't load pending approvals. Please try again.</p>
      )}

      {!loading && !error && pending.length === 0 && (
        <p className="ac-empty-good">No companies awaiting approval — you're all caught up.</p>
      )}

      {!loading && !error && pending.length > 0 && (
        <div className="ac-pending-list">
          {pending.map((c) => (
            <PendingCard
              key={c.id}
              company={c}
              onApprove={onApprove}
              onRequestReject={onRequestReject}
              actionBusy={actionBusy}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════ Section 2: All Companies ═══════════════════════ */

function CompanyRow({ company, onApprove, onRequestReject, onSuspend, onUnsuspend, actionBusy }) {
  const isBusy = actionBusy === company.id;

  return (
    <tr className="ac-row">
      <td className="ac-td-name" data-label="Name">{company.name}</td>
      <td className="ac-td-email" data-label="Email">{company.officialEmail}</td>
      <td data-label="Status"><StatusBadge status={company.status} /></td>
      <td className="ac-td-actions" data-label="Actions">
        {company.status === "PENDING" && (
          <>
            <button type="button" className="ac-btn ac-btn-approve ac-btn-sm" onClick={() => onApprove(company)} disabled={isBusy}>
              {isBusy ? "…" : "Approve"}
            </button>
            <button type="button" className="ac-btn ac-btn-danger ac-btn-sm" onClick={() => onRequestReject(company)} disabled={isBusy}>
              Reject
            </button>
          </>
        )}
        {company.status === "APPROVED" && (
          <button type="button" className="ac-btn ac-btn-warn ac-btn-sm" onClick={() => onSuspend(company)} disabled={isBusy}>
            {isBusy ? "…" : "Suspend"}
          </button>
        )}
        {company.status === "SUSPENDED" && (
          <button type="button" className="ac-btn ac-btn-approve ac-btn-sm" onClick={() => onUnsuspend(company)} disabled={isBusy}>
            {isBusy ? "…" : "Unsuspend"}
          </button>
        )}
        {company.status === "INCOMPLETE" && (
          <span className="ac-no-action">—</span>
        )}
      </td>
    </tr>
  );
}

function AllCompaniesSection({
  companies,
  loading,
  error,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onApprove,
  onRequestReject,
  onSuspend,
  onUnsuspend,
  actionBusy,
}) {
  const filtered = useMemo(() => {
    let list = companies;
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.name?.toLowerCase().includes(q));
    }
    return list;
  }, [companies, statusFilter, search]);

  return (
    <section className="ad-section">
      <div className="ad-section-header">
        <h2 className="section-heading">All Companies</h2>
      </div>

      <div className="ac-directory-controls">
        <div className="aa-chart-type-switcher">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              className={statusFilter === f.value ? "aa-chip aa-chip-selected" : "aa-chip"}
              onClick={() => onStatusFilterChange(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="ac-search-input"
          placeholder="Search by company name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {loading && <div className="trend-skeleton" />}

      {!loading && error && (
        <p className="ac-error">Couldn't load the company directory. Please try again.</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="ac-empty">
          {companies.length === 0 ? "No companies found." : "No companies match this filter/search."}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <CompanyRow
                  key={c.id}
                  company={c}
                  onApprove={onApprove}
                  onRequestReject={onRequestReject}
                  onSuspend={onSuspend}
                  onUnsuspend={onUnsuspend}
                  actionBusy={actionBusy}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════ Page shell ═══════════════════════════ */

export default function AdminCompanies() {
  const token = localStorage.getItem("token");

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [statusFilter, setStatusFilter] = useState(null);
  const [search, setSearch] = useState("");

  const [actionBusy, setActionBusy] = useState(null); // company id currently mid-action
  const [rejectTarget, setRejectTarget] = useState(null); // company pending reject confirmation
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${BASE_URL}/admin/companies`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCompanies)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const pending = useMemo(() => companies.filter((c) => c.status === "PENDING"), [companies]);

  function replaceCompany(id, updated) {
    setCompanies((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  function removeCompany(id) {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleApprove(company) {
    setActionBusy(company.id);
    try {
      const res = await fetch(`${BASE_URL}/admin/companies/approve/${company.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      replaceCompany(company.id, updated);
      setSuccessMsg(`${company.name} approved.`);
    } catch {
      setSuccessMsg(null);
      alert("Couldn't approve this company. Please try again.");
    } finally {
      setActionBusy(null);
    }
  }

  function handleRequestReject(company) {
    setRejectTarget(company);
  }

  async function handleConfirmReject() {
    const company = rejectTarget;
    if (!company) return;
    setActionBusy(company.id);
    try {
      const res = await fetch(`${BASE_URL}/admin/companies/reject/${company.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      removeCompany(company.id);
      setSuccessMsg(`${company.name} rejected and deleted.`);
      setRejectTarget(null);
    } catch {
      alert("Couldn't reject this company. Please try again.");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleSuspend(company) {
    setActionBusy(company.id);
    try {
      const res = await fetch(`${BASE_URL}/admin/companies/suspend/${company.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      replaceCompany(company.id, updated);
      setSuccessMsg(`${company.name} suspended.`);
    } catch {
      alert("Couldn't suspend this company. Please try again.");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleUnsuspend(company) {
    setActionBusy(company.id);
    try {
      const res = await fetch(`${BASE_URL}/admin/companies/unsuspend/${company.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      replaceCompany(company.id, updated);
      setSuccessMsg(`${company.name} unsuspended.`);
    } catch {
      alert("Couldn't unsuspend this company. Please try again.");
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
            <h1 className="dash-title">Companies</h1>
            <p className="welcome">Review pending applications and manage the company directory</p>
          </div>
        </div>

        <PendingSection
          pending={pending}
          loading={loading}
          error={error}
          onApprove={handleApprove}
          onRequestReject={handleRequestReject}
          actionBusy={actionBusy}
          successMsg={successMsg}
        />

        <AllCompaniesSection
          companies={companies}
          loading={loading}
          error={error}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          search={search}
          onSearchChange={setSearch}
          onApprove={handleApprove}
          onRequestReject={handleRequestReject}
          onSuspend={handleSuspend}
          onUnsuspend={handleUnsuspend}
          actionBusy={actionBusy}
        />

        <RejectConfirmDialog
          company={rejectTarget}
          onConfirm={handleConfirmReject}
          onCancel={() => setRejectTarget(null)}
          busy={actionBusy === rejectTarget?.id}
        />
      </main>
    </div>
  );
}
