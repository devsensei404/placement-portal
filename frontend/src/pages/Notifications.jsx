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

  if (loading) return <p className="notif-status">Loading...</p>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0ff" }}>
      <Navbar />

      <div className="notif-page">
        <h2>Notifications</h2>

        {notifications.length === 0 && (
          <p className="notif-status">No new notifications.</p>
        )}

        {notifications.map((notif) => (
          <div key={notif.id} className="notif-card">
            <span className="notif-message">{notif.message}</span>
            <span className="notif-time">{timeAgo(notif.createdAt)}</span>
            <button
              className="notif-dismiss"
              onClick={(e) => handleDismiss(e, notif.id)}
            >
              &#x2715;
            </button>
          </div>
        ))}

        <div className="pagination">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span>Page {page + 1}</span>

          <button
            disabled={!hasNext}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}