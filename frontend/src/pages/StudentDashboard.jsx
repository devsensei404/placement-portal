// StudentDashboard.jsx
// Route: /student-dashboard

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import JobCard from "../components/JobCard.jsx";
import "./StudentDashboard.css";
import BASE_URL from "../api";

// Animated count-up hook
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

function StatCard({ label, value, colorClass, loading, index }) {
  const animated = useCountUp(typeof value === "number" ? value : 0, 800, !loading);
  return (
    <div className="stat-card" style={{ animationDelay: `${index * 80}ms` }}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${colorClass || ""}`}>
        {loading ? <span className="stat-skeleton" /> : animated}
      </span>
    </div>
  );
}

export default function StudentDashboard() {
  const userId = localStorage.getItem("userId");
  const token  = localStorage.getItem("token");
  const navigate = useNavigate();

  const [jobs,        setJobs       ] = useState([]);
  const [profile,     setProfile    ] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading,     setLoading    ] = useState(true);
  const [progressActive, setProgressActive] = useState(false);

  // ── AI job recommendations ──
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState(false);

  // ── Pending assessments (jobs where this user is APPLIED/INTERVIEWING
  //    and an OPEN assessment exists) ──
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/jobs/getAll`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`${BASE_URL}/profiles/get/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`${BASE_URL}/notification/get/${userId}?page=0&size=10`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
    ])
      .then(([jobsData, profileData, notifData]) => {
        setJobs(jobsData);
        setProfile(profileData);
        setUnreadCount(Array.isArray(notifData) ? notifData.length : (notifData.totalUnread ?? 0));

        // Find jobs this user applied to with status APPLIED/INTERVIEWING,
        // then check each one for an OPEN assessment.
        const eligibleJobs = jobsData.filter((job) =>
          (job.applicants || []).some(
            (a) =>
              Number(a.applicantId) === Number(userId) &&
              (a.applicationStatus === "APPLIED" || a.applicationStatus === "INTERVIEWING")
          )
        );

        if (eligibleJobs.length === 0) {
          setAssessmentsLoading(false);
          return;
        }

        Promise.all(
          eligibleJobs.map((job) =>
            fetch(`${BASE_URL}/assessments/job/${job.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => (r.ok ? r.json() : []))
              .then((assessmentsForJob) => {
                const open = assessmentsForJob.find((a) => a.status === "OPEN");
                return open ? { job, assessment: open } : null;
              })
              .catch(() => null)
          )
        )
          .then((results) => setPendingAssessments(results.filter(Boolean)))
          .finally(() => setAssessmentsLoading(false));
      })
      .catch((err) => {
        console.error("Dashboard fetch failed:", err);
        setAssessmentsLoading(false);
      })
      .finally(() => {
        setLoading(false);
        // Trigger progress bar animation after cards appear
        setTimeout(() => setProgressActive(true), 400);
      });
  }, []);

  // AI job recommendations — fetched independently of the main dashboard
  // Promise.all above, since this call goes through Gemini and is slower;
  // the rest of the dashboard shouldn't wait on it.
  useEffect(() => {
    fetch(`${BASE_URL}/jobs/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setRecommendedJobs(data || []))
      .catch(() => setRecommendationsError(true))
      .finally(() => setRecommendationsLoading(false));
  }, []);

  // ── Derived stats ──
  const myApplications = jobs.flatMap((job) =>
    (job.applicants || [])
      .filter((a) => Number(a.applicantId) === Number(userId))
      .map((a) => ({ ...a, jobTitle: job.jobTitle, company: job.company }))
  );
  const jobsApplied = myApplications.length;
  const interviews  = myApplications.filter((a) => a.applicationStatus === "INTERVIEWING");
  const offers      = myApplications.filter((a) => a.applicationStatus === "OFFERED").length;
  const rejected    = myApplications.filter((a) => a.applicationStatus === "REJECTED").length;

  const now = new Date();
  const upcomingInterview = interviews
    .filter((a) => a.interviewTime && new Date(a.interviewTime) > now)
    .sort((a, b) => new Date(a.interviewTime) - new Date(b.interviewTime))[0] || null;

  // ── Profile completion ──
  function getCompletion(p) {
    if (!p) return 0;
    const fields = [p.name, p.jobTitle, p.company, p.location, p.about,
      p.skills?.length > 0, p.experience?.length > 0, p.certifications?.length > 0];
    return Math.round(fields.filter(Boolean).length / fields.length * 100);
  }
  const completionPct = getCompletion(profile);

  function completionColor(pct) {
    if (pct >= 75) return "#16a34a";
    if (pct >= 40) return "#d97706";
    return "#dc2626";
  }

  function formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  const recentJobs = jobs.slice(0, 3);

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-main">

        {/* ── Header ── */}
        <div className="sd-header sd-fade-in">
          <div>
            <h1 className="dash-title">Dashboard</h1>
            <p className="welcome">
              Welcome back,{" "}
              <span className="sd-name-highlight">
                {loading ? "…" : (profile?.name || `student #${userId}`)}
              </span>
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          <StatCard label="Jobs Applied"         value={jobsApplied}        loading={loading} index={0} />
          <StatCard label="Interviews Scheduled" value={interviews.length}  loading={loading} index={1} />
          <StatCard label="Offers Received"      value={offers}             loading={loading} index={2} colorClass="sd-stat-green" />
          <StatCard label="Rejected"             value={rejected}           loading={loading} index={3} colorClass="sd-stat-red" />

          {/* Profile completion card */}
          <div className="stat-card stat-card-completion" style={{ animationDelay: "320ms" }}>
            <span className="stat-label">Profile Complete</span>
            {loading ? (
              <span className="stat-skeleton" />
            ) : (
              <>
                <span className="stat-value" style={{ color: completionColor(completionPct), fontSize: "28px" }}>
                  {completionPct}%
                </span>
                <div className="sd-progress-track">
                  <div
                    className="sd-progress-fill"
                    style={{
                      width: progressActive ? `${completionPct}%` : "0%",
                      background: completionColor(completionPct),
                    }}
                  />
                </div>
                <p className="sd-completion-hint" onClick={() => navigate("/my-profile")}>
                  {completionPct < 100 ? "Complete your profile →" : "Profile complete ✓"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Upcoming Interview ── */}
        {!loading && upcomingInterview && (
          <div className="sd-interview-card sd-slide-up">
            <div className="sd-interview-accent" />
            <div className="sd-interview-body">
              <p className="sd-interview-eyebrow">📅 Upcoming Interview</p>
              <p className="sd-interview-job">{upcomingInterview.jobTitle}</p>
              <p className="sd-interview-company">{upcomingInterview.company}</p>
            </div>
            <div className="sd-interview-time">
              {formatDateTime(upcomingInterview.interviewTime)}
            </div>
          </div>
        )}

        {/* ── Pending Assessments ── */}
        {!assessmentsLoading && pendingAssessments.length > 0 && (
          <div className="sd-assessment-card sd-slide-up">
            <div className="sd-assessment-accent" />
            <div className="sd-assessment-body">
              <p className="sd-assessment-eyebrow">Assessment Pending</p>
              {pendingAssessments.map(({ job, assessment }) => (
                <div key={assessment.assessmentId} className="sd-assessment-row">
                  <div>
                    <p className="sd-assessment-title">{assessment.title}</p>
                    <p className="sd-assessment-company">{job.jobTitle} · {job.company}</p>
                  </div>
                  <button
                    className="sd-assessment-btn"
                    onClick={() => navigate(`/assessments/${assessment.assessmentId}/take`)}
                  >
                    Take Assessment
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recommended For You (AI) ── */}
        {!recommendationsLoading && !recommendationsError && recommendedJobs.length > 0 && (
          <section className="recent-jobs-section sd-recommended-section">
            <h2 className="section-heading">Recommended For You</h2>
            <p className="sd-recommended-sub">
              Matched to your resume and profile
            </p>
            <div className="jobs-grid">
              {recommendedJobs.slice(0, 6).map((job, i) => (
                <div key={job.id} className="sd-job-card-wrap" style={{ animationDelay: `${i * 100}ms` }}>
                  <JobCard job={job} matchScore={job.matchScore} matchReason={job.matchReason} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Latest Job Openings ── */}
        <section className="recent-jobs-section">
          <h2 className="section-heading">Latest Job Openings</h2>
          <div className="jobs-grid">
            {recentJobs.map((job, i) => (
              <div key={job.id} className="sd-job-card-wrap" style={{ animationDelay: `${i * 100}ms` }}>
                <JobCard job={job} />
              </div>
            ))}
          </div>
          <div className="view-more-wrapper">
            <button className="btn-view-more" onClick={() => navigate("/browse-jobs")}>
              View More Jobs
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
