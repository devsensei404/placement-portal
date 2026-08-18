// ForgotPassword.jsx
// Three-step password reset flow:
//   1. Enter email -> request OTP
//   2. Enter 6-digit code -> verify OTP
//   3. Enter new password -> reset password
// On success, shows a confirmation message and redirects to /login after 2s.

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import BASE_URL from "../api";
import EyeIcon from "../components/EyeIcon";

// Maps backend JobPortalException codes to human-readable messages
const ERROR_MESSAGES = {
  USER_NOT_FOUND: "No account found with that email.",
  OTP_RESEND_TOO_SOON: "Please wait a bit before requesting another code.",
  OTP_NOT_FOUND: "No reset code found. Please request a new one.",
  OTP_LOCKED: "Too many incorrect attempts. Please request a new code.",
  OTP_EXPIRED: "This code has expired. Please request a new one.",
  OTP_INCORRECT: "Incorrect code. Please try again.",
  PASSWORD_RESET_NOT_VERIFIED: "Please verify your code before resetting your password.",
  PASSWORD_RESET_EXPIRED: "Your verification has expired. Please start over.",
};

function resolveErrorMessage(err) {
  return ERROR_MESSAGES[err] || err || "Something went wrong. Please try again.";
}

export default function ForgotPassword() {
  // step: "email" -> "otp" -> "password" -> "success"
  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.errorMessage || "OTP_NOT_FOUND");
      }

      setStep("otp");
    } catch (err) {
      setError(resolveErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/password-reset/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.errorMessage || "OTP_INCORRECT");
      }

      setStep("password");
    } catch (err) {
      setError(resolveErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/password-reset/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.errorMessage || "PASSWORD_RESET_NOT_VERIFIED");
      }

      setStep("success");
    } catch (err) {
      setError(resolveErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="card">

        <div className="brand-mark">
          <span className="kanji">浪</span>
          <span className="wordmark">RōninHire</span>
        </div>

        <div className="card-header">
          <p className="subtitle">RŌNINHIRE · IIT Durgapur</p>
          <h1>
            {step === "email" && "Reset Password"}
            {step === "otp" && "Enter Code"}
            {step === "password" && "New Password"}
            {step === "success" && "Success"}
          </h1>
        </div>

        {step === "email" && (
          <form onSubmit={handleRequestOtp}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="willserfort@wistoria.magic"
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <p className="footer-text" style={{ marginTop: 0, marginBottom: 20 }}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>

            <div className="field">
              <label htmlFor="otpCode">Code</label>
              <input
                id="otpCode"
                type="text"
                name="otpCode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword}>
            <div className="field">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-wrapper">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showNewPassword} />
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {step === "success" && (
          <p className="footer-text" style={{ marginTop: 0 }}>
            Your password has been reset. Redirecting to Sign In...
          </p>
        )}

        <p className="footer-text">
          <Link to="/login">Back to Sign In</Link>
        </p>

      </div>
    </div>
  );
}
