// AdminDashboard.jsx
// Route: /admin-dashboard
// Landing page an admin sees after logging in. Stats/analytics-first,
// with pending-approval-style action items front and center. This page
// only summarizes and links out — the dedicated list/detail pages it
// links to (Company Approvals, Reports Queue, Analytics detail, Audit
// Log, etc.) are separate tasks and may not exist yet.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import "./AdminDashboard.css";
import BASE_URL from "../api";

// ── Animated count-up hook (copied from StudentDashboard.jsx — not yet
//    extracted into a shared component) ──
function useCountUp(target, duration = 900, enabled = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) { setCount(target); return; }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, enabled]);
  return count;
}

function StatCard({ label, value, sub, colorClass, loading, error, index, onClick }) {
  const animated = useCountUp(typeof value === "number" ? value : 0, 800, !loading && !error);
  return (
    <div
      className={`stat-card ${onClick ? "stat-card-clickable" : ""}`}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${colorClass || ""}`}>
        {loading ? (
          <span className="stat-skeleton" />
        ) : error ? (
          <span className="stat-error-inline">—</span>
        ) : (
          animated
        )}
      </span>
      {!loading && !error && sub && <span className="stat-sub">{sub}</span>}
      {error && <span className="stat-sub stat-sub-error">Couldn't load</span>}
    </div>
  );
}

// ── Lightweight inline SVG bar chart. No charting library is a
//    dependency anywhere in this project yet, so this stays intentionally
//    simple (no axes/legends/tooltips beyond native <title> hover text).
//    Worth swapping for a real charting library once the full
//    /admin/analytics detail page gets built. ──
function MiniBarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const barGap = 100 / data.length;

  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="mini-chart-svg"
      role="img"
      aria-label="Trend chart"
    >
      {data.map((d, i) => {
        const h = d.count === 0 ? 0.6 : (d.count / max) * 34;
        const w = barGap * 0.6;
        const x = i * barGap + (barGap - w) / 2;
        return (
          <rect
            key={i}
            x={x}
            y={40 - h}
            width={w}
            height={h}
            rx="0.8"
            className="mini-chart-bar"
          >
            <title>{`${d.label}: ${d.count}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

function TrendWidget({ title, points, loading, error, total, onClick }) {
  const hasData = !loading && !error && points && points.length > 0;
  const firstLabel = hasData ? points[0].label : "";
  const lastLabel = hasData ? points[points.length - 1].label : "";

  return (
    <div className="trend-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="trend-card-header">
        <span className="trend-title">{title}</span>
        {hasData && <span className="trend-total">{total} this week</span>}
      </div>

      {loading && <div className="trend-skeleton" />}

      {!loading && error && (
        <p className="trend-empty">Couldn't load this widget.</p>
      )}

      {!loading && !error && (!points || points.every((p) => p.count === 0)) && (
        <p className="trend-empty">No activity in the last 7 days.</p>
      )}

      {!loading && !error && points && points.some((p) => p.count > 0) && (
        <>
          <MiniBarChart data={points} />
          <div className="trend-axis">
            <span>{firstLabel}</span>
            <span>{lastLabel}</span>
          </div>
        </>
      )}

      <span className="trend-link">View full analytics →</span>
    </div>
  );
}

// ── Turns "APPROVE_COMPANY" into "Approved company". Deliberately a
//    simple string transform rather than a lookup table, since new
//    action strings can be added on the backend without this page
//    needing an update. Past-tense inflection is a plain heuristic
//    (won't get every irregular verb right, e.g. double-consonant
//    verbs like "ban" → "baned" instead of "banned") but stays legible
//    for any action string thrown at it. ──
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

const ACCOUNT_TYPE_LABELS = {
  APPLICANT: "students",
  EMPLOYER: "recruiters",
  COMPANY: "companies",
  ADMIN: "admins",
};

const COMPANY_STATUS_LABELS = {
  APPROVED: "approved",
  PENDING: "pending",
  SUSPENDED: "suspended",
  INCOMPLETE: "incomplete",
};

function buildBreakdown(obj, labelMap) {
  if (!obj) return "";
  return Object.entries(obj)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count} ${labelMap[key] || key.toLowerCase()}`)
    .join(" · ");
}

export default function AdminDashboard() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // ── Summary stats ──
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  // ── Signups trend ──
  const [signups, setSignups] = useState(null);
  const [signupsLoading, setSignupsLoading] = useState(true);
  const [signupsError, setSignupsError] = useState(false);

  // ── Applications trend ──
  const [applications, setApplications] = useState(null);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState(false);

  // ── Reports summary ──
  const [reportSummary, setReportSummary] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(false);

  // ── Recent activity (audit log preview) ──
  const [auditEntries, setAuditEntries] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState(false);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    // Each section fetches and renders independently — one failing call
    // (e.g. the audit log) should never block or crash the rest of the
    // page.

    fetch(`${BASE_URL}/admin/analytics/summary`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setSummary)
      .catch(() => setSummaryError(true))
      .finally(() => setSummaryLoading(false));

    fetch(`${BASE_URL}/admin/analytics/signups`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setSignups(data.total || []))
      .catch(() => setSignupsError(true))
      .finally(() => setSignupsLoading(false));

    fetch(`${BASE_URL}/admin/analytics/applications`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setApplications(Array.isArray(data) ? data : []))
      .catch(() => setApplicationsError(true))
      .finally(() => setApplicationsLoading(false));

    fetch(`${BASE_URL}/admin/reports/summary`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setReportSummary)
      .catch(() => setReportsError(true))
      .finally(() => setReportsLoading(false));

    fetch(`${BASE_URL}/admin/audit-logs?page=0&size=5`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setAuditEntries(data.content || []))
      .catch(() => setAuditError(true))
      .finally(() => setAuditLoading(false));
  }, []);

  const signupsTotal = (signups || []).reduce((sum, p) => sum + p.count, 0);
  const applicationsTotal = (applications || []).reduce((sum, p) => sum + p.count, 0);

  const userBreakdown = summary ? buildBreakdown(summary.usersByAccountType, ACCOUNT_TYPE_LABELS) : "";
  const companyBreakdown = summary ? buildBreakdown(summary.companiesByStatus, COMPANY_STATUS_LABELS) : "";

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-main">

        {/* ── Header ── */}
        <div className="ad-header ad-fade-in">
          <div>
            <h1 className="dash-title">Admin Dashboard</h1>
            <p className="welcome">Platform overview & moderation queue</p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          <StatCard
            label="Total Users"
            value={summary?.totalUsers}
            sub={userBreakdown}
            loading={summaryLoading}
            error={summaryError}
            index={0}
          />
          <StatCard
            label="Active Jobs"
            value={summary?.activeJobs}
            loading={summaryLoading}
            error={summaryError}
            index={1}
          />
          <StatCard
            label="Pending Company Approvals"
            value={summary?.pendingCompanyApprovals}
            colorClass={summary?.pendingCompanyApprovals > 0 ? "ad-stat-amber" : ""}
            loading={summaryLoading}
            error={summaryError}
            index={2}
            onClick={() => navigate("/admin/companies")}
          />
          <StatCard
            label="Open Reports"
            value={reportSummary?.openCount}
            colorClass={reportSummary?.openCount > 0 ? "ad-stat-red" : ""}
            loading={reportsLoading}
            error={reportsError}
            index={3}
            onClick={() => navigate("/admin/reports")}
          />
          <StatCard
            label="Total Companies"
            value={summary?.totalCompanies}
            sub={companyBreakdown}
            loading={summaryLoading}
            error={summaryError}
            index={4}
            onClick={() => navigate("/admin/companies")}
          />
        </div>

        {/* ── Analytics preview ── */}
        <section className="ad-section">
          <h2 className="section-heading">Analytics</h2>
          <div className="trend-grid">
            <TrendWidget
              title="Signups"
              points={signups}
              total={signupsTotal}
              loading={signupsLoading}
              error={signupsError}
              onClick={() => navigate("/admin/analytics")}
            />
            <TrendWidget
              title="Applications"
              points={applications}
              total={applicationsTotal}
              loading={applicationsLoading}
              error={applicationsError}
              onClick={() => navigate("/admin/analytics")}
            />
          </div>
        </section>

        {/* ── Recent Activity ── */}
        <section className="ad-section">
          <div className="ad-section-header">
            <h2 className="section-heading">Recent Activity</h2>
            <span className="ad-view-all-link" onClick={() => navigate("/admin/audit-log")}>
              View all →
            </span>
          </div>

          <div className="activity-card">
            {auditLoading && (
              <div className="activity-skeleton-list">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="activity-skeleton-row" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
            )}

            {!auditLoading && auditError && (
              <p className="activity-empty">Couldn't load recent activity.</p>
            )}

            {!auditLoading && !auditError && auditEntries.length === 0 && (
              <p className="activity-empty">No activity yet.</p>
            )}

            {!auditLoading && !auditError && auditEntries.length > 0 && (
              <ul className="activity-list">
                {auditEntries.map((entry, i) => (
                  <li
                    key={entry.id}
                    className="activity-row"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div>
                      <p className="activity-action">{humanizeAction(entry.action)}</p>
                      {entry.targetType && (
                        <p className="activity-target">
                          {entry.targetType.charAt(0) + entry.targetType.slice(1).toLowerCase()}
                          {entry.targetId != null ? ` #${entry.targetId}` : ""}
                        </p>
                      )}
                    </div>
                    <span className="activity-time">{formatRelativeTime(entry.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
