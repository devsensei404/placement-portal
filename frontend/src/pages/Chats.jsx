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
    <div className="cht-page">
      <Navbar />
      <main className="cht-main">
        <h1 className="cht-title">Messages</h1>

        {loading && <p className="cht-status">Loading…</p>}
        {error   && <p className="cht-status cht-error">{error}</p>}

        {!loading && !error && partners.length === 0 && (
          <div className="cht-empty">
            <svg className="cht-empty-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-4 3.5V17H6a2 2 0 0 1-2-2V6z"
                stroke="#111111"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="cht-empty-title">No conversations yet</p>
            <p className="cht-empty-sub">
              Start a conversation from a job listing or an applicant card.
            </p>
          </div>
        )}

        {!loading && !error && partners.length > 0 && (
          <ul className="cht-partners-list">
            {partners.map((partner) => (
              <li
                key={partner.userId}
                className="cht-partner-row"
                onClick={() => navigate(`/chats/${partner.userId}`, { state: { name: partner.name } })}
              >
                <div className="cht-partner-avatar">
                  {getInitial(partner.name)}
                </div>
                <div className="cht-partner-info">
                  <span className="cht-partner-name">{partner.name}</span>
                </div>
                <span className="cht-partner-chevron">›</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
