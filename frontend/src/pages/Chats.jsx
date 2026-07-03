// Chats.jsx
// Route: /chats
// Inbox — lists all users the logged-in user has chatted with.
// Clicking a partner navigates to /chats/:otherUserId for the full DM view.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import BASE_URL from "../api.js";
import "./Chats.css";

export default function Chats() {
  const token    = localStorage.getItem("token");
  const navigate = useNavigate();

  const [partners, setPartners] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetch(`${BASE_URL}/chat/partners`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load conversations.");
        return res.json();
      })
      .then((data) => setPartners(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function getInitial(name) {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  }

  return (
    <div className="chats-page">
      <Navbar />
      <main className="chats-main">
        <h1 className="chats-title">Messages</h1>

        {loading && <p className="chats-status">Loading…</p>}
        {error   && <p className="chats-status chats-error">{error}</p>}

        {!loading && !error && partners.length === 0 && (
          <div className="chats-empty">
            <svg className="chats-empty-icon" viewBox="0 0 48 48" fill="none">
              <path
                d="M8 12a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H20l-8 7v-7h-1a3 3 0 0 1-3-3V12z"
                stroke="#111111"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <p className="chats-empty-title">No conversations yet</p>
            <p className="chats-empty-sub">
              Start a conversation from a job listing or an applicant card.
            </p>
          </div>
        )}

        {!loading && !error && partners.length > 0 && (
          <ul className="partners-list">
            {partners.map((partner) => (
              <li
                key={partner.userId}
                className="partner-row"
                onClick={() => navigate(`/chats/${partner.userId}`)}
              >
                <div className="partner-avatar">
                  {getInitial(partner.name)}
                </div>
                <div className="partner-info">
                  <span className="partner-name">{partner.name}</span>
                </div>
                <span className="partner-chevron">›</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
