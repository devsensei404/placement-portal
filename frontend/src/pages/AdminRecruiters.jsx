import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar.jsx";
import "./AdminDashboard.css";
import "./AdminAnalytics.css";
import "./AdminCompanies.css";
import "./AdminUsers.css";
import "./AdminRecruiters.css";
import BASE_URL from "../api";

const LISTING_STATUS_FILTERS = [
  { value: null, label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "UNLISTED", label: "Unlisted" },
  { value: "UNASSOCIATED", label: "Unassociated" },
];

const LISTING_STATUS_BADGE_CLASS = {
  ACTIVE: "ac-badge-approved",
  UNLISTED: "ac-badge-suspended",
  UNASSOCIATED: "ac-badge-incomplete",
};

const LISTING_STATUS_LABELS = {
  ACTIVE: "Active",
  UNLISTED: "Unlisted",
  UNASSOCIATED: "Unassociated",
};

function ListingStatusBadge({ status }) {
  const cls = LISTING_STATUS_BADGE_CLASS[status] || "ac-badge-incomplete";
  const label = LISTING_STATUS_LABELS[status] || status || "Unknown";
  return <span className={`ac-badge ${cls}`}>{label}</span>;
}

function RecruiterRow({ recruiter, onUnlist, onRelist, actionBusy }) {
  const isBusy = actionBusy === recruiter.profileId;

  return (
    <tr className="ac-row">
      <td className="ac-td-name" data-label="Name">{recruiter.name}</td>
      <td className="ac-td-email" data-label="Email">{recruiter.email}</td>
      <td data-label="Company">{recruiter.companyId != null ? `Company #${recruiter.companyId}` : "—"}</td>
      <td data-label="Listing Status">
        <div className="ar-recruiter-status-cell">
          <ListingStatusBadge status={recruiter.listingStatus} />
          {!recruiter.enabled && <span className="ar-account-banned-tag">Account banned</span>}
        </div>
      </td>
      <td className="ac-td-actions" data-label="Actions">
        {recruiter.listingStatus === "ACTIVE" && (
          <button
            type="button"
            className="ac-btn ac-btn-warn ac-btn-sm"
            onClick={() => onUnlist(recruiter)}
            disabled={isBusy}
          >
            {isBusy ? "…" : "Unlist"}
          </button>
        )}
        {recruiter.listingStatus === "UNLISTED" && (
          <button
            type="button"
            className="ac-btn ac-btn-approve ac-btn-sm"
            onClick={() => onRelist(recruiter)}
            disabled={isBusy}
          >
            {isBusy ? "…" : "Relist"}
          </button>
        )}
        {recruiter.listingStatus === "UNASSOCIATED" && (
          <span className="ac-no-action">—</span>
        )}
      </td>
    </tr>
  );
}

export default function AdminRecruiters() {
  const token = localStorage.getItem("token");

  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [listingStatusFilter, setListingStatusFilter] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [search, setSearch] = useState("");

  const [actionBusy, setActionBusy] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (listingStatusFilter) params.set("listingStatus", listingStatusFilter);
    if (companyId != null && !Number.isNaN(companyId)) params.set("companyId", String(companyId));
    const qs = params.toString();
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${BASE_URL}/admin/recruiters${qs ? `?${qs}` : ""}`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setRecruiters)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [listingStatusFilter, companyId]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const filtered = useMemo(() => {
    let list = recruiters;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [recruiters, search]);

  const isFiltered = listingStatusFilter !== null || companyId != null || search.trim() !== "";

  function replaceRecruiter(profileId, newStatus) {
    setRecruiters((prev) =>
      prev.map((r) => (r.profileId === profileId ? { ...r, listingStatus: newStatus } : r))
    );
  }

  async function handleUnlist(recruiter) {
    setActionBusy(recruiter.profileId);
    try {
      const res = await fetch(`${BASE_URL}/admin/recruiters/unlist/${recruiter.profileId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      replaceRecruiter(recruiter.profileId, "UNLISTED");
      setSuccessMsg(`${recruiter.name} unlisted.`);
    } catch {
      alert("Couldn't unlist this recruiter. Please try again.");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRelist(recruiter) {
    setActionBusy(recruiter.profileId);
    try {
      const res = await fetch(`${BASE_URL}/admin/recruiters/relist/${recruiter.profileId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      replaceRecruiter(recruiter.profileId, "ACTIVE");
      setSuccessMsg(`${recruiter.name} relisted.`);
    } catch {
      alert("Couldn't relist this recruiter. Please try again.");
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
            <h1 className="dash-title">Recruiters</h1>
            <p className="welcome">Manage recruiter listing status across the platform</p>
          </div>
        </div>

        {successMsg && <div className="ac-success-banner">{successMsg}</div>}

        <section className="ad-section">
          <div className="ad-section-header">
            <h2 className="section-heading">All Recruiters</h2>
          </div>

          <div className="ac-directory-controls">
            <div className="au-filter-chips">
              <div className="aa-chart-type-switcher">
                {LISTING_STATUS_FILTERS.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    className={listingStatusFilter === f.value ? "aa-chip aa-chip-selected" : "aa-chip"}
                    onClick={() => setListingStatusFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="aal-admin-filter">
                <label htmlFor="ar-company-id" className="aal-admin-filter-label">
                  Filter by Company ID
                </label>
                <input
                  id="ar-company-id"
                  type="number"
                  min="1"
                  className="aal-admin-filter-input"
                  placeholder="e.g. 3"
                  value={companyId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCompanyId(v === "" ? null : Number(v));
                  }}
                />
              </div>
            </div>

            <input
              type="text"
              className="ac-search-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading && <div className="trend-skeleton" />}

          {!loading && error && (
            <p className="ac-error">Couldn't load recruiters. Please try again.</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="ac-empty">
              {isFiltered ? "No recruiters match this filter." : "No recruiters found."}
            </p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="ac-table-wrap">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Listing Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <RecruiterRow
                      key={r.profileId}
                      recruiter={r}
                      onUnlist={handleUnlist}
                      onRelist={handleRelist}
                      actionBusy={actionBusy}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
