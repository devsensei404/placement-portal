import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import "./AdminDashboard.css";
import "./AdminAnalytics.css";
import "./AdminCompanies.css";
import "./AdminAuditLog.css";
import "./AdminReports.css";
import BASE_URL from "../api";

function humanizeAction(action) {
  if (!action || typeof action !== "string") return "Unknown";
  const words = action.split("_").filter(Boolean).map((w) => w.toLowerCase());
  if (words.length === 0) return action;
  const sentence = words.join(" ");
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

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: null, label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "DISMISSED", label: "Dismissed" },
];

const TARGET_TYPE_FILTERS = [
  { value: null, label: "All" },
  { value: "JOB", label: "Job" },
  { value: "PROFILE", label: "Profile" },
  { value: "INTERVIEW_EXP", label: "Interview Exp" },
  { value: "CHAT_MESSAGE", label: "Chat Message" },
];

const STATUS_BADGE_CLASS = {
  OPEN: "ac-badge-pending",
  RESOLVED: "ac-badge-approved",
  DISMISSED: "ac-badge-incomplete",
};

function StatusBadge({ status }) {
  const cls = STATUS_BADGE_CLASS[status] || "ac-badge-incomplete";
  const label = status ? status.charAt(0) + status.slice(1).toLowerCase() : "Unknown";
  return <span className={`ac-badge ${cls}`}>{label}</span>;
}

function targetLabel(targetType, targetId) {
  if (!targetType) return null;
  const cap = targetType.charAt(0) + targetType.slice(1).toLowerCase();
  return targetId != null ? `${cap} #${targetId}` : cap;
}

/* ═══════════════════════ Summary stat row ═══════════════════════ */

function SummaryRow({ summary, loading, error }) {
  if (loading) {
    return (
      <div className="ar-summary-row">
        <span className="ar-summary-skeleton" />
        <span className="ar-summary-skeleton" />
        <span className="ar-summary-skeleton" />
      </div>
    );
  }
  if (error) {
    return <p className="ac-error">Couldn't load report summary.</p>;
  }
  return (
    <div className="ar-summary-row">
      <span className="ar-summary-stat">
        <span className="ar-summary-value ad-stat-amber">{summary?.openCount ?? 0}</span>
        <span className="ar-summary-label">Open</span>
      </span>
      <span className="ar-summary-stat">
        <span className="ar-summary-value">{summary?.resolvedCount ?? 0}</span>
        <span className="ar-summary-label">Resolved</span>
      </span>
      <span className="ar-summary-stat">
        <span className="ar-summary-value">{summary?.dismissedCount ?? 0}</span>
        <span className="ar-summary-label">Dismissed</span>
      </span>
    </div>
  );
}

/* ═══════════════════════════ Filter row ═══════════════════════════ */

function FilterRow({ status, onStatusChange, targetType, onTargetTypeChange }) {
  return (
    <div className="ar-filter-row">
      <div className="aa-chart-type-switcher">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className={status === f.value ? "aa-chip aa-chip-selected" : "aa-chip"}
            onClick={() => onStatusChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="aa-chart-type-switcher">
        {TARGET_TYPE_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className={targetType === f.value ? "aa-chip aa-chip-selected" : "aa-chip"}
            onClick={() => onTargetTypeChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════ Report card ═══════════════════════════ */

function ReportCard({ report, index, onResolve, onDismiss, actionBusy, actionError }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const isBusy = actionBusy === report.id;
  const isOpen = report.status === "OPEN";

  function submit(action) {
    const trimmed = note.trim();
    action(report, trimmed || null);
  }

  return (
    <div className="ar-card" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="ar-card-top">
        <StatusBadge status={report.status} />
        <span className="ar-card-time">{formatRelativeTime(report.createdAt)}</span>
      </div>

      <p className="ar-card-reason">{humanizeAction(report.reason)}</p>

      {targetLabel(report.targetType, report.targetId) && (
        <p className="ar-card-target">{targetLabel(report.targetType, report.targetId)}</p>
      )}

      {report.details && <p className="ar-card-details">{report.details}</p>}

      <p className="ar-card-reporter">Reported by User #{report.reporterId}</p>

      {!isOpen && (
        <div className="ar-card-resolution">
          {report.resolutionNote && (
            <p className="ar-card-resolution-note">"{report.resolutionNote}"</p>
          )}
          <p className="ar-card-resolution-meta">
            {report.status === "RESOLVED" ? "Resolved" : "Dismissed"} {formatRelativeTime(report.resolvedAt)}
            {report.resolvedBy != null ? ` by Admin #${report.resolvedBy}` : ""}
          </p>
        </div>
      )}

      {actionError && <p className="ar-card-error">{actionError}</p>}

      {isOpen && (
        <div className="ar-card-actions-wrap">
          <button
            type="button"
            className="ar-note-toggle"
            onClick={() => setNoteOpen((v) => !v)}
          >
            {noteOpen ? "− Hide note" : "+ Add a note (optional)"}
          </button>

          {noteOpen && (
            <textarea
              className="ar-note-input"
              placeholder="Optional note about this resolution…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          )}

          <div className="ar-card-actions">
            <button
              type="button"
              className="ac-btn ac-btn-approve"
              onClick={() => submit(onResolve)}
              disabled={isBusy}
            >
              {isBusy ? "…" : "Resolve"}
            </button>
            <button
              type="button"
              className="ac-btn ac-btn-ghost"
              onClick={() => submit(onDismiss)}
              disabled={isBusy}
            >
              {isBusy ? "…" : "Dismiss"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCardSkeleton() {
  return (
    <div className="ar-card ar-card-skeleton">
      <div className="ac-skeleton-line ac-skeleton-line-narrow" />
      <div className="ac-skeleton-line ac-skeleton-line-wide" />
      <div className="ac-skeleton-line ac-skeleton-line-wide" />
    </div>
  );
}

/* ═══════════════════════════ Pagination ═══════════════════════════ */

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

/* ═══════════════════════════ Page shell ═══════════════════════════ */

export default function AdminReports() {
  const token = localStorage.getItem("token");

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  const [status, setStatus] = useState("OPEN");
  const [targetType, setTargetType] = useState(null);
  const [page, setPage] = useState(0);

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [actionBusy, setActionBusy] = useState(null);
  const [actionErrors, setActionErrors] = useState({});

  const handleStatusChange = (s) => {
    setStatus(s);
    setPage(0);
  };
  const handleTargetTypeChange = (t) => {
    setTargetType(t);
    setPage(0);
  };

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${BASE_URL}/admin/reports/summary`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setSummary)
      .catch(() => setSummaryError(true))
      .finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
    if (status) params.set("status", status);
    if (targetType) params.set("targetType", targetType);

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${BASE_URL}/admin/reports?${params.toString()}`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setPageData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page, status, targetType]);

  function replaceReport(id, updated) {
    setPageData((prev) =>
      prev ? { ...prev, content: prev.content.map((r) => (r.id === id ? updated : r)) } : prev
    );
  }

  function setActionError(id, message) {
    setActionErrors((prev) => ({ ...prev, [id]: message }));
  }

  async function callAction(report, endpoint, note, successLabel) {
    setActionBusy(report.id);
    setActionError(report.id, null);
    try {
      const res = await fetch(`${BASE_URL}/admin/reports/${report.id}/${endpoint}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: note ? JSON.stringify({ resolutionNote: note }) : null,
      });
      if (!res.ok) {
        if (res.status === 409 || res.status === 400) {
          setActionError(report.id, "This report was already resolved or dismissed.");
        } else {
          setActionError(report.id, `Couldn't ${successLabel.toLowerCase()} this report. Please try again.`);
        }
        return;
      }
      const updated = await res.json();
      replaceReport(report.id, updated);
    } catch {
      setActionError(report.id, `Couldn't ${successLabel.toLowerCase()} this report. Please try again.`);
    } finally {
      setActionBusy(null);
    }
  }

  const handleResolve = (report, note) => callAction(report, "resolve", note, "Resolve");
  const handleDismiss = (report, note) => callAction(report, "dismiss", note, "Dismiss");

  const entries = pageData?.content || [];

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-main">
        <div className="ad-header ad-fade-in">
          <div>
            <h1 className="dash-title">Reports</h1>
            <p className="welcome">Review and act on user-filed reports</p>
          </div>
        </div>

        <SummaryRow summary={summary} loading={summaryLoading} error={summaryError} />

        <FilterRow
          status={status}
          onStatusChange={handleStatusChange}
          targetType={targetType}
          onTargetTypeChange={handleTargetTypeChange}
        />

        {loading && (
          <div className="ar-list">
            {[0, 1, 2].map((i) => <ReportCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && error && (
          <p className="ac-error">Couldn't load reports. Please try again.</p>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className={status === "OPEN" && !targetType ? "ac-empty-good" : "ac-empty"}>
            {status === "OPEN" && !targetType
              ? "No open reports — you're all caught up!"
              : "No reports match this filter."}
          </p>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <div className="ar-list">
              {entries.map((report, i) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  index={i}
                  onResolve={handleResolve}
                  onDismiss={handleDismiss}
                  actionBusy={actionBusy}
                  actionError={actionErrors[report.id]}
                />
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
