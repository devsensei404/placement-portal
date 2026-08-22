// ChatWindow.jsx
// Route: /chats/:otherUserId
// Full-page DM conversation view.
// Polls GET /chat/{otherUserId} every 3 seconds.
// Marks messages as read on open via PUT /chat/read/{otherUserId}.
// Sends new message via POST /chat/send.

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import ReportButton from "../components/ReportButton.jsx";
import BASE_URL from "../api.js";
import "./ChatWindow.css";

export default function ChatWindow() {
  const { otherUserId } = useParams();
  const token           = localStorage.getItem("token");
  const myId            = Number(localStorage.getItem("userId"));
  const accountType     = localStorage.getItem("accountType");
  const navigate        = useNavigate();
  const location        = useLocation();

  // Name is passed via navigation state from the Chats list.
  // Falls back to a generic label if this page is opened directly
  // (e.g. refresh or a bookmarked/shared link), since we have no
  // endpoint yet to look up a user's name by id from here.
  const otherUserName = location.state?.name || "Conversation";

  const [messages, setMessages] = useState([]);
  const [content, setContent]   = useState("");
  const [error, setError]       = useState("");
  const [sending, setSending]   = useState(false);

  const bottomRef  = useRef(null);   // scroll anchor
  const intervalRef = useRef(null);  // polling interval handle

  const canReport = accountType === "APPLICANT" || accountType === "EMPLOYER";

  // Fetch conversation and scroll to bottom
  function fetchMessages() {
    fetch(`${BASE_URL}/chat/${otherUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load messages.");
        return res.json();
      })
      .then((data) => {
        setMessages(data);
      })
      .catch((err) => setError(err.message));
  }

  // Mark all messages from otherUserId as read
  function markAsRead() {
    fetch(`${BASE_URL}/chat/read/${otherUserId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  useEffect(() => {
    // Initial load + mark read
    fetchMessages();
    markAsRead();

    // Start polling every 3 seconds
    intervalRef.current = setInterval(fetchMessages, 3000);

    // Cleanup on unmount or when otherUserId changes
    return () => clearInterval(intervalRef.current);
  }, [otherUserId]);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSending(true);
    fetch(`${BASE_URL}/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        receiverId: Number(otherUserId),
        content: trimmed,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to send message.");
        return res.json();
      })
      .then(() => {
        setContent("");
        fetchMessages(); // immediate refetch after send
      })
      .catch((err) => setError(err.message))
      .finally(() => setSending(false));
  }

  function handleKeyDown(e) {
    // Send on Enter, allow Shift+Enter for newlines
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(isoString) {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="cw2-page">
      <Navbar />

      <div className="cw2-container">

        {/* Header */}
        <div className="cw2-header">
          <button
            className="cw2-back"
            onClick={() => navigate("/chats")}
          >
            <svg className="cw2-back-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#111111"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
          <div className="cw2-header-avatar">
            {/* We only have userId here, no name — show generic label */}
          </div>
          <span className="cw2-header-title">{otherUserName}</span>
        </div>

        {/* Error */}
        {error && <p className="cw2-error">{error}</p>}

        {/* Messages */}
        <div className="cw2-messages">
          {messages.length === 0 && !error && (
            <p className="cw2-empty">
              No messages yet. Say hello!
            </p>
          )}

          {messages.map((msg, index) => {
            const isOwn = Number(msg.senderId) === myId;
            return (
              <div
                key={msg.id}
                className={`cw2-bubble-row ${isOwn ? "cw2-bubble-row--own" : "cw2-bubble-row--other"}`}
                style={{ animationDelay: `${Math.min(index, 10) * 0.03}s` }}
              >
                {!isOwn && canReport && (
                  <ReportButton targetType="CHAT_MESSAGE" targetId={msg.id} />
                )}
                <div className={`cw2-bubble ${isOwn ? "cw2-bubble--own" : "cw2-bubble--other"}`}>
                  <p className="cw2-bubble-text">{msg.content}</p>
                  <span className="cw2-bubble-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })}

          {/* Invisible anchor to scroll to */}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="cw2-input-area">
          <textarea
            className="cw2-input"
            placeholder="Type a message… (Enter to send)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="cw2-send"
            onClick={handleSend}
            disabled={sending || !content.trim()}
          >
            {sending ? "…" : "Send"}
          </button>
        </div>

      </div>
    </div>
  );
}
