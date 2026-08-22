// AdminAnalytics.jsx
// Route: /admin/analytics
// Detail page linked from AdminDashboard's Signups/Applications
// TrendWidgets. Sidebar nav + content panel; tab switching is component
// state (activeMetric), not nested routes — none of the other admin
// pages use route params for internal view state, and deep-linking to a
// specific metric wasn't called out as a requirement, so keeping this
// consistent and simple.

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import "./AdminDashboard.css";
import "./AdminAnalytics.css";
import BASE_URL from "../api";
import TrendChart, { TREND_COLORS } from "../components/TrendChart.jsx";

const METRICS = [
  { key: "signups", label: "Signups" },
  { key: "jobs", label: "Jobs" },
  { key: "applications", label: "Applications" },
  { key: "companyApprovals", label: "Company Approvals" },
];

// ── Time-range state shape: { mode: "granularity"|"trend", value }.
//    One state object, not two independent toggles, so "send both
//    params" is structurally impossible rather than something call
//    sites have to remember to prevent. ──
const DEFAULT_TIME_RANGE = { mode: "granularity", value: "WEEK" };

function timeRangeToQuery(timeRange) {
  const param = timeRange.mode === "granularity" ? "granularity" : "trend";
  return `${param}=${timeRange.value}`;
}

// Cache key per tab — just the value, since mode is implied by value
// (WEEK/MONTH vs WEEKLY/MONTHLY don't collide).
function cacheKeyFor(timeRange) {
  return timeRange.value;
}

function TimeRangeControl({ timeRange, onChange }) {
  const isGranularity = timeRange.mode === "granularity";
  const isTrend = timeRange.mode === "trend";

  return (
    <div className="aa-timerange-row">
      <div className={`aa-toggle-group ${isGranularity ? "aa-toggle-group-active" : "aa-toggle-group-inactive"}`}>
        <button
          type="button"
          className={isGranularity && timeRange.value === "WEEK" ? "aa-toggle-btn aa-toggle-btn-selected" : "aa-toggle-btn"}
          onClick={() => onChange({ mode: "granularity", value: "WEEK" })}
        >
          Week
        </button>
        <button
          type="button"
          className={isGranularity && timeRange.value === "MONTH" ? "aa-toggle-btn aa-toggle-btn-selected" : "aa-toggle-btn"}
          onClick={() => onChange({ mode: "granularity", value: "MONTH" })}
        >
          Month
        </button>
      </div>

      <div className={`aa-toggle-group ${isTrend ? "aa-toggle-group-active" : "aa-toggle-group-inactive"}`}>
        <button
          type="button"
          className={isTrend && timeRange.value === "WEEKLY" ? "aa-toggle-btn aa-toggle-btn-selected" : "aa-toggle-btn"}
          onClick={() => onChange({ mode: "trend", value: "WEEKLY" })}
        >
          Weekly trend (12wk)
        </button>
        <button
          type="button"
          className={isTrend && timeRange.value === "MONTHLY" ? "aa-toggle-btn aa-toggle-btn-selected" : "aa-toggle-btn"}
          onClick={() => onChange({ mode: "trend", value: "MONTHLY" })}
        >
          Monthly trend (12mo)
        </button>
      </div>
    </div>
  );
}

function ChartTypeSwitcher({ options, value, onChange }) {
  return (
    <div className="aa-chart-type-switcher">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? "aa-chip aa-chip-selected" : "aa-chip"}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Generic per-tab fetch hook: fetches on mount and whenever the
//    time-range cache key changes; caches results per cache key so
//    flipping tabs back and forth doesn't refetch. Mirrors the
//    AdminDashboard pattern of independent loading/error state per
//    section, applied per-tab instead of per-widget. ──
function useAnalyticsTab(endpoint, timeRange) {
  const token = localStorage.getItem("token");
  const [cache, setCache] = useState({}); // { [cacheKey]: data }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const key = cacheKeyFor(timeRange);

  useEffect(() => {
    if (cache[key] !== undefined) {
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${BASE_URL}${endpoint}?${timeRangeToQuery(timeRange)}`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setCache((prev) => ({ ...prev, [key]: data })))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [key]);

  return { data: cache[key], loading, error };
}

/* ══════════════════════ Signups tab (Task 3) ══════════════════════ */

const ACCOUNT_TYPE_LABELS = {
  APPLICANT: "students",
  EMPLOYER: "recruiters",
  COMPANY: "companies",
  ADMIN: "admins",
};

const SIGNUPS_PRIMARY_OPTIONS = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "area", label: "Area" },
];
const SIGNUPS_BREAKDOWN_OPTIONS = [...SIGNUPS_PRIMARY_OPTIONS, { value: "pie", label: "Pie" }];

function buildSignupsBreakdownSeries(byAccountType) {
  if (!byAccountType) return [];
  return Object.entries(byAccountType).map(([key, points], i) => ({
    key,
    label: ACCOUNT_TYPE_LABELS[key] || key.toLowerCase(),
    color: TREND_COLORS[i % TREND_COLORS.length],
    points,
  }));
}

function buildSignupsLatestSlices(byAccountType) {
  if (!byAccountType) return [];
  return Object.entries(byAccountType).map(([key, points], i) => {
    const latest = points && points.length > 0 ? points[points.length - 1] : null;
    return {
      key,
      label: ACCOUNT_TYPE_LABELS[key] || key.toLowerCase(),
      color: TREND_COLORS[i % TREND_COLORS.length],
      value: latest ? latest.count : 0,
    };
  });
}

function SignupsTab({ timeRange }) {
  const { data, loading, error } = useAnalyticsTab("/admin/analytics/signups", timeRange);
  const [primaryType, setPrimaryType] = useState("line");
  const [breakdownType, setBreakdownType] = useState("bar");

  if (loading) {
    return (
      <>
        <div className="aa-chart-card"><div className="trend-skeleton" /></div>
        <div className="aa-chart-card"><div className="trend-skeleton" /></div>
      </>
    );
  }
  if (error) {
    return <div className="aa-chart-card"><p className="trend-empty">Couldn't load signups data.</p></div>;
  }

  const totalSeries = [{ key: "total", label: "Signups", color: TREND_COLORS[0], points: data?.total || [] }];
  const isPie = breakdownType === "pie";
  const breakdownData = isPie
    ? buildSignupsLatestSlices(data?.byAccountType)
    : buildSignupsBreakdownSeries(data?.byAccountType);

  return (
    <>
      <div className="aa-chart-card">
        <h3 className="aa-chart-card-title">Total Signups</h3>
        <ChartTypeSwitcher options={SIGNUPS_PRIMARY_OPTIONS} value={primaryType} onChange={setPrimaryType} />
        <TrendChart type={primaryType} series={totalSeries} />
      </div>
      <div className="aa-chart-card">
        <h3 className="aa-chart-card-title">Signups by Account Type</h3>
        <ChartTypeSwitcher options={SIGNUPS_BREAKDOWN_OPTIONS} value={breakdownType} onChange={setBreakdownType} />
        <TrendChart type={isPie ? "pie" : breakdownType} series={breakdownData} />
      </div>
    </>
  );
}

/* ═══════════════════════ Jobs tab (Task 4) ═══════════════════════ */

// No JOB_STATUS_LABELS map existed anywhere in the project — added
// here following the same lowercase-plural convention as
// ACCOUNT_TYPE_LABELS / COMPANY_STATUS_LABELS.
const JOB_STATUS_LABELS = {
  OPEN: "open",
  CLOSED: "closed",
  DRAFT: "drafts",
};

const JOBS_PRIMARY_OPTIONS = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "area", label: "Area" },
];
const JOBS_BREAKDOWN_OPTIONS = [...JOBS_PRIMARY_OPTIONS, { value: "pie", label: "Pie" }];

function buildJobsBreakdownSeries(byStatus) {
  if (!byStatus) return [];
  return Object.entries(byStatus).map(([key, points], i) => ({
    key,
    label: JOB_STATUS_LABELS[key] || key.toLowerCase(),
    color: TREND_COLORS[i % TREND_COLORS.length],
    points,
  }));
}

function buildJobsLatestSlices(byStatus) {
  if (!byStatus) return [];
  return Object.entries(byStatus).map(([key, points], i) => {
    const latest = points && points.length > 0 ? points[points.length - 1] : null;
    return {
      key,
      label: JOB_STATUS_LABELS[key] || key.toLowerCase(),
      color: TREND_COLORS[i % TREND_COLORS.length],
      value: latest ? latest.count : 0,
    };
  });
}

function JobsTab({ timeRange }) {
  const { data, loading, error } = useAnalyticsTab("/admin/analytics/jobs", timeRange);
  const [primaryType, setPrimaryType] = useState("line");
  const [breakdownType, setBreakdownType] = useState("bar");

  if (loading) {
    return (
      <>
        <div className="aa-chart-card"><div className="trend-skeleton" /></div>
        <div className="aa-chart-card"><div className="trend-skeleton" /></div>
      </>
    );
  }
  if (error) {
    return <div className="aa-chart-card"><p className="trend-empty">Couldn't load jobs data.</p></div>;
  }

  const totalSeries = [{ key: "total", label: "Jobs", color: TREND_COLORS[0], points: data?.total || [] }];
  const isPie = breakdownType === "pie";
  const breakdownData = isPie
    ? buildJobsLatestSlices(data?.byStatus)
    : buildJobsBreakdownSeries(data?.byStatus);

  return (
    <>
      <div className="aa-chart-card">
        <h3 className="aa-chart-card-title">Total Jobs Posted</h3>
        <ChartTypeSwitcher options={JOBS_PRIMARY_OPTIONS} value={primaryType} onChange={setPrimaryType} />
        <TrendChart type={primaryType} series={totalSeries} />
      </div>
      <div className="aa-chart-card">
        <h3 className="aa-chart-card-title">Jobs by Status</h3>
        <ChartTypeSwitcher options={JOBS_BREAKDOWN_OPTIONS} value={breakdownType} onChange={setBreakdownType} />
        <TrendChart type={isPie ? "pie" : breakdownType} series={breakdownData} />
      </div>
    </>
  );
}

/* ═══════════════════ Applications tab (Task 5) ═══════════════════ */

const APPLICATIONS_OPTIONS = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "area", label: "Area" },
];

function ApplicationsTab({ timeRange }) {
  const { data, loading, error } = useAnalyticsTab("/admin/analytics/applications", timeRange);
  const [chartType, setChartType] = useState("line");

  if (loading) {
    return <div className="aa-chart-card"><div className="trend-skeleton" /></div>;
  }
  if (error) {
    return <div className="aa-chart-card"><p className="trend-empty">Couldn't load applications data.</p></div>;
  }

  // Bare array response — no wrapper key to unwrap, unlike signups/jobs.
  const series = [
    { key: "total", label: "Applications", color: TREND_COLORS[0], points: Array.isArray(data) ? data : [] },
  ];

  return (
    <div className="aa-chart-card">
      <h3 className="aa-chart-card-title">Applications Submitted</h3>
      <ChartTypeSwitcher options={APPLICATIONS_OPTIONS} value={chartType} onChange={setChartType} />
      <TrendChart type={chartType} series={series} />
    </div>
  );
}

/* ═══════════════════ Company Approvals tab (Task 6) ═══════════════════ */

const APPROVALS_SERIES_CONFIG = [
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
  { key: "unsuspended", label: "Unsuspended" },
];

const APPROVALS_OPTIONS = [
  { value: "stackedBar", label: "Stacked Bar" },
  { value: "line", label: "Multi-Line" },
];

function buildApprovalsSeries(data) {
  if (!data) return [];
  return APPROVALS_SERIES_CONFIG.map((cfg, i) => ({
    key: cfg.key,
    label: cfg.label,
    color: TREND_COLORS[i % TREND_COLORS.length],
    points: data[cfg.key] || [],
  }));
}

function CompanyApprovalsTab({ timeRange }) {
  const { data, loading, error } = useAnalyticsTab("/admin/analytics/company-approvals", timeRange);
  const [chartType, setChartType] = useState("stackedBar");

  if (loading) {
    return <div className="aa-chart-card"><div className="trend-skeleton" /></div>;
  }
  if (error) {
    return <div className="aa-chart-card"><p className="trend-empty">Couldn't load company approvals data.</p></div>;
  }

  const series = buildApprovalsSeries(data);

  return (
    <div className="aa-chart-card">
      <h3 className="aa-chart-card-title">Company Approval Activity</h3>
      <ChartTypeSwitcher options={APPROVALS_OPTIONS} value={chartType} onChange={setChartType} />
      <TrendChart type={chartType} series={series} />
    </div>
  );
}

/* ═══════════════════════════ Page shell ═══════════════════════════ */

export default function AdminAnalytics() {
  const [activeMetric, setActiveMetric] = useState("signups");
  const [timeRange, setTimeRange] = useState(DEFAULT_TIME_RANGE);

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-main">
        <div className="ad-header ad-fade-in">
          <div>
            <h1 className="dash-title">Analytics</h1>
            <p className="welcome">Platform trends across signups, jobs, applications & company approvals</p>
          </div>
        </div>

        <div className="aa-layout">
          <nav className="aa-sidebar">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                className={activeMetric === m.key ? "aa-sidebar-item aa-sidebar-item-active" : "aa-sidebar-item"}
                onClick={() => setActiveMetric(m.key)}
              >
                {m.label}
              </button>
            ))}
          </nav>

          <div className="aa-content">
            <TimeRangeControl timeRange={timeRange} onChange={setTimeRange} />

            {activeMetric === "signups" && <SignupsTab timeRange={timeRange} />}
            {activeMetric === "jobs" && <JobsTab timeRange={timeRange} />}
            {activeMetric === "applications" && <ApplicationsTab timeRange={timeRange} />}
            {activeMetric === "companyApprovals" && <CompanyApprovalsTab timeRange={timeRange} />}
          </div>
        </div>
      </main>
    </div>
  );
}
