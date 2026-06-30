// ChatWindow.jsx
// Route: /chats/:otherUserId
// Full-page DM conversation view.
// Polls GET /chat/{otherUserId} every 3 seconds.
// Marks messages as read on open via PUT /chat/read/{otherUserId}.
// Sends new message via POST /chat/send.

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import BASE_URL from "../api.js";
import "./ChatWindow.css";

export default function ChatWindow() {
  const { otherUserId } = useParams();
  const token           = localStorage.getItem("token");
  const myId            = Number(localStorage.getItem("userId"));
  const navigate        = useNavigate();

  const [messages, setMessages] = useState([]);
  const [content, setContent]   = useState("");
  const [error, setError]       = useState("");
  const [sending, setSending]   = useState(false);

  const bottomRef  = useRef(null);   // scroll anchor
  const intervalRef = useRef(null);  // polling interval handle

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
    <div className="chatwindow-page">
      <Navbar />

      <div className="chatwindow-container">

        {/* Header */}
        <div className="chatwindow-header">
          <button
            className="chatwindow-back"
            onClick={() => navigate("/chats")}
          >
            ← Back
          </button>
          <div className="chatwindow-header-avatar">
            {/* We only have userId here, no name — show generic label */}
          </div>
          <span className="chatwindow-header-title">Conversation</span>
        </div>

        {/* Error */}
        {error && <p className="chatwindow-error">{error}</p>}

        {/* Messages */}
        <div className="chatwindow-messages">
          {messages.length === 0 && !error && (
            <p className="chatwindow-empty">
              No messages yet. Say hello!
            </p>
          )}

          {messages.map((msg) => {
            const isOwn = Number(msg.senderId) === myId;
            return (
              <div
                key={msg.id}
                className={`bubble-row ${isOwn ? "bubble-row--own" : "bubble-row--other"}`}
              >
                <div className={`bubble ${isOwn ? "bubble--own" : "bubble--other"}`}>
                  <p className="bubble-text">{msg.content}</p>
                  <span className="bubble-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })}

          {/* Invisible anchor to scroll to */}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="chatwindow-input-area">
          <textarea
            className="chatwindow-input"
            placeholder="Type a message… (Enter to send)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="chatwindow-send"
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
