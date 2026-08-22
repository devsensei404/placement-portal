import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import "./AdminDashboard.css";
import "./AdminAnalytics.css";
import "./AdminAuditLog.css";
import BASE_URL from "../api";

function humanizeAction(action) {
  if (!action || typeof action !== "string") return "Unknown action";
  const words = action.split("_").filter(Boolean).map((w) => w.toLowerCase());
  if (words.length === 0) return action;
  const [verb, ...rest] = words;
  const pastTense = verb.endsWith("e") ? `${verb}d` : `${verb}ed`;
  const sentence = [pastTense, ...rest].join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
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

const POSITIVE_VERBS = new Set(["APPROVE", "UNBAN", "UNSUSPEND", "RELIST"]);
const NEGATIVE_VERBS = new Set(["REJECT", "BAN", "SUSPEND", "DELETE", "UNLIST"]);

function categorizeAction(action) {
  if (!action || typeof action !== "string") return "neutral";
  const verb = action.split("_")[0]?.toUpperCase();
  if (POSITIVE_VERBS.has(verb)) return "positive";
  if (NEGATIVE_VERBS.has(verb)) return "negative";
  return "neutral";
}

const TARGET_TYPE_PRESETS = ["COMPANY", "USER", "JOB", "INTERVIEW_EXP", "RECRUITER"];
const PAGE_SIZE = 20;

function FilterRow({ targetType, onTargetTypeChange, adminId, onAdminIdChange }) {
  return (
    <div className="aal-filter-row">
      <div className="aa-chart-type-switcher">
        <button
          type="button"
          className={targetType === null ? "aa-chip aa-chip-selected" : "aa-chip"}
          onClick={() => onTargetTypeChange(null)}
        >
          All
        </button>
        {TARGET_TYPE_PRESETS.map((t) => (
          <button
            key={t}
            type="button"
            className={targetType === t ? "aa-chip aa-chip-selected" : "aa-chip"}
            onClick={() => onTargetTypeChange(t)}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="aal-admin-filter">
        <label htmlFor="aal-admin-id" className="aal-admin-filter-label">
          Filter by admin ID
        </label>
        <input
          id="aal-admin-id"
          type="number"
          min="1"
          className="aal-admin-filter-input"
          placeholder="e.g. 4"
          value={adminId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onAdminIdChange(v === "" ? null : Number(v));
          }}
        />
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="aal-timeline">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="aal-entry aal-entry-skeleton" style={{ animationDelay: `${i * 80}ms` }}>
          <span className="aal-dot aal-dot-neutral aal-dot-skeleton" />
          <div className="aal-entry-body">
            <div className="aal-skeleton-line aal-skeleton-line-wide" />
            <div className="aal-skeleton-line aal-skeleton-line-narrow" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineEntry({ entry, index }) {
  const category = categorizeAction(entry.action);
  const targetLabel = entry.targetType
    ? entry.targetType.charAt(0) + entry.targetType.slice(1).toLowerCase()
    : null;

  return (
    <div className="aal-entry" style={{ animationDelay: `${index * 40}ms` }}>
      <span className={`aal-dot aal-dot-${category}`} />
      <div className="aal-entry-body">
        <div className="aal-entry-main">
          <p className="aal-entry-action">{humanizeAction(entry.action)}</p>
          {targetLabel && (
            <p className="aal-entry-target">
              {targetLabel}
              {entry.targetId != null ? ` #${entry.targetId}` : ""}
            </p>
          )}
          <p className="aal-entry-admin">Admin #{entry.adminId}</p>
        </div>
        <span className="aal-entry-time">{formatRelativeTime(entry.timestamp)}</span>
      </div>
    </div>
  );
}

function Pagination({ pageData, onPrev, onNext }) {
  if (!pageData) return null;
  const { number, totalElements, first, last, size } = pageData;
  const rangeStart = totalElements === 0 ? 0 : number * size + 1;
  const rangeEnd = Math.min((number + 1) * size, totalElements);

  return (
    <div className="aal-pagination">
      <span className="aal-pagination-info">
        Showing {rangeStart}–{rangeEnd} of {totalElements}
      </span>
      <div className="aal-pagination-controls">
        <button type="button" className="aal-pagination-btn" onClick={onPrev} disabled={first}>
          Prev
        </button>
        <button type="button" className="aal-pagination-btn" onClick={onNext} disabled={last}>
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminAuditLog() {
  const token = localStorage.getItem("token");

  const [targetType, setTargetType] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [page, setPage] = useState(0);

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleTargetTypeChange = (t) => {
    setTargetType(t);
    setPage(0);
  };
  const handleAdminIdChange = (id) => {
    setAdminId(id);
    setPage(0);
  };

  useEffect(() => {
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
    if (targetType) params.set("targetType", targetType);
    if (adminId != null && !Number.isNaN(adminId)) params.set("adminId", String(adminId));

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${BASE_URL}/admin/audit-logs?${params.toString()}`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setPageData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page, targetType, adminId]);

  const isFiltered = targetType !== null || adminId != null;
  const entries = pageData?.content || [];

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-main">
        <div className="ad-header ad-fade-in">
          <div>
            <h1 className="dash-title">Audit Log</h1>
            <p className="welcome">Full history of admin actions across the platform</p>
          </div>
        </div>

        <FilterRow
          targetType={targetType}
          onTargetTypeChange={handleTargetTypeChange}
          adminId={adminId}
          onAdminIdChange={handleAdminIdChange}
        />

        {loading && <TimelineSkeleton />}

        {!loading && error && (
          <p className="aal-error">Couldn't load the audit log. Please try again.</p>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className="aal-empty">
            {isFiltered ? "No activity found for this filter." : "No activity found."}
          </p>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <div className="aal-timeline">
              {entries.map((entry, i) => (
                <TimelineEntry key={entry.id} entry={entry} index={i} />
              ))}
            </div>
            <Pagination
              pageData={pageData}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </main>
    </div>
  );
}
