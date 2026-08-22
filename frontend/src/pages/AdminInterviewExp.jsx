import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import "./AdminDashboard.css";
import "./AdminAnalytics.css";
import "./AdminCompanies.css";
import "./AdminAuditLog.css";
import "./AdminInterviewExp.css";
import BASE_URL from "../api";

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

function FilterRow({ jobId, onJobIdChange }) {
  return (
    <div className="aie-filter-row">
      <div className="aal-admin-filter">
        <label htmlFor="aie-job-id" className="aal-admin-filter-label">
          Filter by Job ID
        </label>
        <input
          id="aie-job-id"
          type="number"
          min="1"
          className="aal-admin-filter-input"
          placeholder="e.g. 17"
          value={jobId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onJobIdChange(v === "" ? null : Number(v));
          }}
        />
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ post, onConfirm, onCancel, busy, errorMsg }) {
  if (!post) return null;
  return (
    <div className="ac-modal-backdrop" onClick={onCancel}>
      <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="ac-modal-title">Delete this post?</h3>
        <p className="ac-modal-body">
          This will permanently delete this interview experience post and cannot be undone.
        </p>
        {errorMsg && (
          <p className="ac-modal-body" style={{ color: "#b91c1c", marginTop: "-14px" }}>
            {errorMsg}
          </p>
        )}
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="ac-btn ac-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

const CLAMP_THRESHOLD_CHARS = 280;

function PostCard({ post, index, onRequestDelete, actionBusy }) {
  const [expanded, setExpanded] = useState(false);
  const isBusy = actionBusy === post.id;
  const canClamp = (post.msg || "").length > CLAMP_THRESHOLD_CHARS;

  return (
    <div className="aie-card" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="aie-card-top">
        <span className="aie-card-job">Job #{post.jobId}</span>
        <span className="aie-card-time">{formatRelativeTime(post.createdAt)}</span>
      </div>

      <p className={`aie-card-msg ${!expanded && canClamp ? "aie-card-msg-clamped" : ""}`}>
        {post.msg}
      </p>

      {canClamp && (
        <button type="button" className="aie-read-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "− Read less" : "+ Read more"}
        </button>
      )}

      <div className="aie-card-actions">
        <button
          type="button"
          className="ac-btn ac-btn-danger ac-btn-sm"
          onClick={() => onRequestDelete(post)}
          disabled={isBusy}
        >
          {isBusy ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <div className="aie-card aie-card-skeleton">
      <div className="ac-skeleton-line ac-skeleton-line-narrow" />
      <div className="ac-skeleton-line ac-skeleton-line-wide" />
      <div className="ac-skeleton-line ac-skeleton-line-wide" />
      <div className="ac-skeleton-line ac-skeleton-line-narrow" />
    </div>
  );
}

export default function AdminInterviewExp() {
  const token = localStorage.getItem("token");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [jobId, setJobId] = useState(null);

  const [actionBusy, setActionBusy] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (jobId != null && !Number.isNaN(jobId)) params.set("jobId", String(jobId));
    const qs = params.toString();
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${BASE_URL}/admin/interview-exp${qs ? `?${qs}` : ""}`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setPosts)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const isFiltered = jobId != null;

  function removePost(id) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleRequestDelete(post) {
    setDeleteError(null);
    setDeleteTarget(post);
  }

  async function handleConfirmDelete() {
    const post = deleteTarget;
    if (!post) return;
    setActionBusy(post.id);
    setDeleteError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/interview-exp/delete/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setDeleteError("Couldn't delete this post. Please try again.");
        return;
      }
      removePost(post.id);
      setSuccessMsg("Post deleted.");
      setDeleteTarget(null);
    } catch {
      setDeleteError("Couldn't delete this post. Please try again.");
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
            <h1 className="dash-title">Interview Experiences</h1>
            <p className="welcome">Moderate anonymous interview experience posts</p>
          </div>
        </div>

        {successMsg && <div className="ac-success-banner">{successMsg}</div>}

        <section className="ad-section">
          <div className="ad-section-header">
            <h2 className="section-heading">All Posts</h2>
          </div>

          <FilterRow jobId={jobId} onJobIdChange={setJobId} />

          {loading && (
            <div className="aie-grid">
              {[0, 1, 2, 3].map((i) => <PostCardSkeleton key={i} />)}
            </div>
          )}

          {!loading && error && (
            <p className="ac-error">Couldn't load interview experience posts. Please try again.</p>
          )}

          {!loading && !error && posts.length === 0 && (
            <p className="ac-empty">
              {isFiltered ? "No posts for this job." : "No interview experience posts found."}
            </p>
          )}

          {!loading && !error && posts.length > 0 && (
            <div className="aie-grid">
              {posts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={i}
                  onRequestDelete={handleRequestDelete}
                  actionBusy={actionBusy}
                />
              ))}
            </div>
          )}
        </section>

        <DeleteConfirmDialog
          post={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
          busy={actionBusy === deleteTarget?.id}
          errorMsg={deleteError}
        />
      </main>
    </div>
  );
}
