// AdminSignupForm.jsx
import { useState } from "react";
import BASE_URL from "../api";
import OtpStep from "./OtpStep";
import EyeIcon from "./EyeIcon";

const PASSWORD_HINT = "8–15 chars · uppercase · lowercase · number · special (@#$%^&+=!)";

export default function AdminSignupForm({ onBack, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminKey: "",
    accountType: "ADMIN",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function mapError(code) {
    const map = {
      USER_FOUND: "This email is already registered.",
      INVALID_ADMIN_KEY: "Incorrect admin key.",
      EMAIL_NOT_VERIFIED: "Please verify your email before continuing.",
      EMAIL_VERIFICATION_EXPIRED: "Your verification expired. Please verify your email again.",
    };
    return map[code];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!otpVerified) {
      setError("Please verify your email first.");
      return;
    }
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(mapError(body.errorMessage) || body.errorMessage || "Registration failed.");
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const detailsUnlocked = otpVerified;

  return (
    <div className="kg-form-panel">
      <button type="button" className="kg-back" onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M8.5 2.5L3.5 7L8.5 11.5" stroke="#111111" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>

      <div className="kg-form-header">
        <p className="kg-eyebrow">Register</p>
        <h1 className="kg-heading">Admin account</h1>
        <p className="kg-subtext">Requires a valid admin key from your team.</p>
      </div>

      <form onSubmit={handleSubmit} className="kg-form">
        <div className="kg-field kg-fade" style={{ animationDelay: "0.02s" }}>
          <label htmlFor="admin-name">Full name</label>
          <input
            id="admin-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="kg-field kg-fade" style={{ animationDelay: "0.07s" }}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@organization.com"
            disabled={otpVerified}
            required
          />
        </div>

        <div className="kg-fade" style={{ animationDelay: "0.12s" }}>
          <OtpStep email={formData.email} verified={otpVerified} onVerified={() => setOtpVerified(true)} />
        </div>

        {detailsUnlocked && (
          <>
            <div className="kg-field kg-fade" style={{ animationDelay: "0.02s" }}>
              <label htmlFor="admin-key">Admin key</label>
              <input
                id="admin-key"
                type="text"
                name="adminKey"
                value={formData.adminKey}
                onChange={handleChange}
                placeholder="Provided by your organization"
                required
              />
            </div>

            <div className="kg-field kg-fade" style={{ animationDelay: "0.07s" }}>
              <label htmlFor="admin-password">Password</label>
              <div className="kg-input-icon-wrap">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="kg-icon-btn" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <p className="kg-hint">{PASSWORD_HINT}</p>
            </div>

            <div className="kg-field kg-fade" style={{ animationDelay: "0.12s" }}>
              <label htmlFor="admin-confirm">Confirm password</label>
              <div className="kg-input-icon-wrap">
                <input
                  id="admin-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="kg-icon-btn" onClick={() => setShowConfirm((s) => !s)} aria-label="Toggle password visibility">
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>
          </>
        )}

        {error && <p className="kg-error">{error}</p>}

        {detailsUnlocked && (
          <button type="submit" className="kg-btn kg-btn-primary kg-btn-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create admin account"}
          </button>
        )}
      </form>
    </div>
  );
}
