// OtpStep.jsx
// Shared OTP request/verify UI used by both AdminSignupForm and CompanySignupForm.
// Fully controlled from the parent — parent owns `verified` state and the email value.

import { useState, useEffect, useRef } from "react";
import BASE_URL from "../api";

const RESEND_COOLDOWN = 60; // seconds — matches backend's 60s resend cooldown

export default function OtpStep({ email, verified, onVerified }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function requestOtp() {
    if (!email || cooldown > 0) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(mapError(body.errorMessage) || "Could not send code. Try again.");
      }
      setSent(true);
      startCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  // No longer a <form> submit handler — called directly from the Verify
  // button's onClick and from the Enter-key handler on the code input.
  // `e` is now optional since it may be invoked without an event.
  async function verifyOtp(e) {
    e?.preventDefault?.();
    if (!code) return;
    setError("");
    setVerifying(true);
    try {
      const res = await fetch(`${BASE_URL}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode: code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(mapError(body.errorMessage) || "Invalid or expired code, please try again.");
      }
      onVerified();
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  }

  function mapError(code) {
    const map = {
      USER_FOUND: "This email is already registered.",
      OTP_RESEND_TOO_SOON: "Please wait a minute before requesting another code.",
      OTP_NOT_FOUND: "No code found for this email. Send a new one.",
      OTP_LOCKED: "Too many incorrect attempts. Request a new code.",
      OTP_EXPIRED: "This code has expired. Request a new one.",
      OTP_INCORRECT: "Invalid or expired code, please try again.",
    };
    return map[code];
  }

  if (verified) {
    return (
      <div className="kg-otp-verified">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8.5L6.5 12L13 4" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Email verified</span>
      </div>
    );
  }

  return (
    <div className="kg-otp-block">
      {!sent ? (
        <button
          type="button"
          className="kg-btn kg-btn-outline"
          disabled={!email || sending}
          onClick={requestOtp}
        >
          {sending ? "Sending…" : "Send verification code"}
        </button>
      ) : (
        // Plain <div> instead of <form> — this whole component is nested
        // inside the outer registration <form> (in ApplicantSignupForm /
        // AdminSignupForm / etc.), and HTML doesn't allow a <form> inside
        // a <form>. Submission is handled via the button's onClick plus
        // an Enter-key handler on the input below.
        <div className="kg-otp-form">
          <label htmlFor="kg-otp-code">Verification code</label>
          <div className="kg-otp-row">
            <input
              id="kg-otp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  verifyOtp();
                }
              }}
            />
            <button
              type="button"
              className="kg-btn kg-btn-primary kg-btn-compact"
              disabled={verifying || code.length < 6}
              onClick={verifyOtp}
            >
              {verifying ? "Checking…" : "Verify"}
            </button>
          </div>
          <button
            type="button"
            className="kg-resend"
            disabled={cooldown > 0 || sending}
            onClick={requestOtp}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      )}
      {error && <p className="kg-error">{error}</p>}
    </div>
  );
}
