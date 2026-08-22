// AdminUsers.jsx — Route: /admin/users
// Ban status is UserDTO.enabled (false = banned). Backend already blocks
// banning/unbanning/deleting ADMIN accounts, so no frontend guard is added.

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar.jsx";
import "./AdminDashboard.css";
import "./AdminAnalytics.css";
import "./AdminCompanies.css";
import "./AdminUsers.css";
import BASE_URL from "../api";

const ACCOUNT_TYPE_FILTERS = [
  { value: null, label: "All" },
  { value: "APPLICANT", label: "Applicant" },
  { value: "EMPLOYER", label: "Recruiter" },
  { value: "COMPANY", label: "Company" },
  { value: "ADMIN", label: "Admin" },
];

const STATUS_FILTERS = [
  { value: null, label: "All" },
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
];

function StatusBadge({ enabled }) {
  const cls = enabled ? "ac-badge-approved" : "ac-badge-suspended";
  const label = enabled ? "Active" : "Banned";
  return <span className={`ac-badge ${cls}`}>{label}</span>;
}

const ACCOUNT_TYPE_BADGE_CLASS = {
  APPLICANT: "ac-badge-incomplete",
  EMPLOYER: "ac-badge-pending",
  COMPANY: "ac-badge-approved",
  ADMIN: "ac-badge-suspended",
};

const ACCOUNT_TYPE_LABELS = {
  APPLICANT: "Applicant",
  EMPLOYER: "Recruiter",
  COMPANY: "Company",
  ADMIN: "Admin",
};

function AccountTypeBadge({ accountType }) {
  const cls = ACCOUNT_TYPE_BADGE_CLASS[accountType] || "ac-badge-incomplete";
  const label = ACCOUNT_TYPE_LABELS[accountType] || accountType || "Unknown";
  return <span className={`ac-badge ${cls}`}>{label}</span>;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function DeleteConfirmDialog({ user, onConfirm, onCancel, busy }) {
  if (!user) return null;
  return (
    <div className="ac-modal-backdrop" onClick={onCancel}>
      <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="ac-modal-title">Delete "{user.name}"?</h3>
        <p className="ac-modal-body">
          This will permanently delete this user account and cannot be undone.
        </p>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="ac-btn ac-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, onBan, onUnban, onRequestDelete, actionBusy }) {
  const isBusy = actionBusy === user.id;

  return (
    <tr className="ac-row">
      <td className="ac-td-name" data-label="Name">{user.name}</td>
      <td className="ac-td-email" data-label="Email">{user.email}</td>
      <td data-label="Type"><AccountTypeBadge accountType={user.accountType} /></td>
      <td data-label="Status"><StatusBadge enabled={user.enabled} /></td>
      <td data-label="Joined">{formatDate(user.createdAt)}</td>
      <td className="ac-td-actions" data-label="Actions">
        {user.enabled ? (
          <button type="button" className="ac-btn ac-btn-warn ac-btn-sm" onClick={() => onBan(user)} disabled={isBusy}>
            {isBusy ? "…" : "Ban"}
          </button>
        ) : (
          <button type="button" className="ac-btn ac-btn-approve ac-btn-sm" onClick={() => onUnban(user)} disabled={isBusy}>
            {isBusy ? "…" : "Unban"}
          </button>
        )}
        <button type="button" className="ac-btn ac-btn-danger ac-btn-sm" onClick={() => onRequestDelete(user)} disabled={isBusy}>
          Delete
        </button>
      </td>
    </tr>
  );
}

function AllUsersSection({
  users,
  loading,
  error,
  accountTypeFilter,
  onAccountTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onBan,
  onUnban,
  onRequestDelete,
  actionBusy,
}) {
  const filtered = useMemo(() => {
    let list = users;
    if (accountTypeFilter) list = list.filter((u) => u.accountType === accountTypeFilter);
    if (statusFilter === "active") list = list.filter((u) => u.enabled);
    if (statusFilter === "banned") list = list.filter((u) => !u.enabled);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, accountTypeFilter, statusFilter, search]);

  const isFiltered = accountTypeFilter !== null || statusFilter !== null || search.trim() !== "";

  return (
    <section className="ad-section">
      <div className="ad-section-header">
        <h2 className="section-heading">All Users</h2>
      </div>

      <div className="ac-directory-controls">
        <div className="au-filter-chips">
          <div className="aa-chart-type-switcher">
            {ACCOUNT_TYPE_FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                className={accountTypeFilter === f.value ? "aa-chip aa-chip-selected" : "aa-chip"}
                onClick={() => onAccountTypeFilterChange(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

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
        </div>

        <input
          type="text"
          className="ac-search-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {loading && <div className="trend-skeleton" />}

      {!loading && error && (
        <p className="ac-error">Couldn't load the user directory. Please try again.</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="ac-empty">
          {isFiltered ? "No users match this filter/search." : "No users found."}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  onBan={onBan}
                  onUnban={onUnban}
                  onRequestDelete={onRequestDelete}
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

export default function AdminUsers() {
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [accountTypeFilter, setAccountTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [search, setSearch] = useState("");

  const [actionBusy, setActionBusy] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${BASE_URL}/admin/users`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setUsers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  function replaceUser(id, updated) {
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  }

  function removeUser(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleBan(user) {
    setActionBusy(user.id);
    try {
      const res = await fetch(`${BASE_URL}/admin/users/ban/${user.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      replaceUser(user.id, updated);
      setSuccessMsg(`${user.name} banned.`);
    } catch {
      alert("Couldn't ban this user. Please try again.");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleUnban(user) {
    setActionBusy(user.id);
    try {
      const res = await fetch(`${BASE_URL}/admin/users/unban/${user.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      replaceUser(user.id, updated);
      setSuccessMsg(`${user.name} unbanned.`);
    } catch {
      alert("Couldn't unban this user. Please try again.");
    } finally {
      setActionBusy(null);
    }
  }

  function handleRequestDelete(user) {
    setDeleteTarget(user);
  }

  async function handleConfirmDelete() {
    const user = deleteTarget;
    if (!user) return;
    setActionBusy(user.id);
    try {
      const res = await fetch(`${BASE_URL}/admin/users/delete/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      removeUser(user.id);
      setSuccessMsg(`${user.name} deleted.`);
      setDeleteTarget(null);
    } catch {
      alert("Couldn't delete this user. Please try again.");
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
            <h1 className="dash-title">Users</h1>
            <p className="welcome">Manage all platform accounts</p>
          </div>
        </div>

        {successMsg && <div className="ac-success-banner">{successMsg}</div>}

        <AllUsersSection
          users={users}
          loading={loading}
          error={error}
          accountTypeFilter={accountTypeFilter}
          onAccountTypeFilterChange={setAccountTypeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          search={search}
          onSearchChange={setSearch}
          onBan={handleBan}
          onUnban={handleUnban}
          onRequestDelete={handleRequestDelete}
          actionBusy={actionBusy}
        />

        <DeleteConfirmDialog
          user={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          busy={actionBusy === deleteTarget?.id}
        />
      </main>
    </div>
  );
}
