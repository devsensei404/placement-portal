import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "./Notifications.css";
import BASE_URL from "../api";

function timeAgo(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

function BellIcon() {
  return (
    <svg className="notif-status-icon" viewBox="0 0 48 48" fill="none">
      <path
        className="draw"
        d="M24 8a10 10 0 0 0-10 10v6l-4 8h28l-4-8v-6A10 10 0 0 0 24 8z"
        stroke="#111111"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path className="draw" d="M20 36a4 4 0 0 0 8 0" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    setLoading(true);

    fetch(
      `${BASE_URL}/notification/get/${userId}?page=${page}&size=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications);
        setHasNext(data.hasNext);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [page]);

  function handleDismiss(e, id) {
    e.stopPropagation();

    fetch(`${BASE_URL}/notification/read/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });
  }

  return (
    <div className="notif-root">
      <Navbar />

      <div className="notif-page">
        <div className="notif-header">
          <h2>Notifications</h2>
          {!loading && notifications.length > 0 && (
            <span className="notif-count">
              {notifications.length} unread
            </span>
          )}
        </div>

        {loading && <p className="notif-status">Loading...</p>}

        {!loading && notifications.length === 0 && (
          <div className="notif-status">
            <BellIcon />
            No new notifications.
          </div>
        )}

        {!loading &&
          notifications.map((notif, idx) => (
            <div
              key={notif.id}
              className="notif-card"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <span className="notif-dot" />
              <div className="notif-body">
                <span className="notif-message">{notif.message}</span>
                <span className="notif-time">{timeAgo(notif.createdAt)}</span>
              </div>
              <button
                className="notif-dismiss"
                onClick={(e) => handleDismiss(e, notif.id)}
                aria-label="Dismiss notification"
              >
                <CloseIcon />
              </button>
            </div>
          ))}

        {!loading && notifications.length > 0 && (
          <div className="pagination">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </button>

            <span>Page {page + 1}</span>

            <button disabled={!hasNext} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
