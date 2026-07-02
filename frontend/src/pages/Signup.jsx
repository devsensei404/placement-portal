// This is the signup page. Four inputs, one button, error message.
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import { useState, useEffect } from "react";
import BASE_URL from "../api";

export default function Signup() {

  const navigate = useNavigate();

  useEffect(() => {
      const token = localStorage.getItem("token");
      const accountType = localStorage.getItem("accountType");

      if (token) {
        if (accountType === "EMPLOYER") {
          navigate("/recruiter-dashboard");
        } else {
          navigate("/student-dashboard");
        }
      }
    }, [navigate]);

  // formData holds all four fields the user fills in
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    accountType: "APPLICANT", // default role is APPLICANT
  });

  // confirmPassword is kept separate — it's never sent to the backend,
  // it only exists to check against formData.password before submitting
  const [confirmPassword, setConfirmPassword] = useState("");

  // error holds the error message. Empty string = no error.
  const [error, setError] = useState("");

  // toggles whether the password field shows plain text or dots
  const [showPassword, setShowPassword] = useState(false);

  // toggles whether the confirm password field shows plain text or dots
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Runs on every keystroke — updates whichever field changed
  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleConfirmChange(e) {
    setConfirmPassword(e.target.value);
  }

  // Runs when the user clicks "Register"
  async function handleSubmit(e) {
    e.preventDefault(); // stop page reload

    setError(""); // clear old error

    // Client-side only check — confirmPassword never touches the backend
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Call the backend register endpoint
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), // sends name, email, password, accountType
      });

      // If server returned an error, read the message and throw
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.errorMessage || "Registration failed");
      }

      const data = await response.json();
      const token = data.jwt;

      localStorage.setItem("token", token);

      const payload = JSON.parse(atob(token.split(".")[1]));
      localStorage.setItem("userId", payload.id);
      localStorage.setItem("accountType", payload.accountType);

      if (payload.accountType === "EMPLOYER") {
        navigate("/recruiter-dashboard");
      } else {
        navigate("/student-dashboard");
      };

    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="card">

        <div className="card-logo">
          <span className="card-logo-kanji">浪</span>
          <span className="card-logo-text">RōninHire</span>
        </div>

        <div className="card-header">
          <p className="subtitle">RŌNINHIRE · IIT Durgapur</p>
          <h1>Create Account</h1>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Taiyo Asano"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="taiyo@yozakura.spy"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4 10 7-.42 1.27-1.2 2.6-2.27 3.77M6.6 6.6C4.3 8.06 2.7 10.06 2 12c1 3 5 7 10 7 1.35 0 2.63-.27 3.8-.75" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="#111111" strokeWidth="1.6" />
                  </svg>
                )}
              </button>
            </div>
            <p className="hint">8–15 chars · uppercase · lowercase · number · special (@#$%^&+=!)</p>
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmChange}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4 10 7-.42 1.27-1.2 2.6-2.27 3.77M6.6 6.6C4.3 8.06 2.7 10.06 2 12c1 3 5 7 10 7 1.35 0 2.63-.27 3.8-.75" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="#111111" strokeWidth="1.6" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && formData.password !== confirmPassword && (
              <p className="hint hint-error">Passwords don't match yet</p>
            )}
          </div>

          {/* Role selector — two radio buttons, plain HTML */}
          <div className="field">
            <label>I am a...</label>
            <div className="radio-group">

              <label className="radio-option">
                <input
                  type="radio"
                  name="accountType"
                  value="APPLICANT"
                  checked={formData.accountType === "APPLICANT"}
                  onChange={handleChange}
                />
                Student / Applicant
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="accountType"
                  value="EMPLOYER"
                  checked={formData.accountType === "EMPLOYER"}
                  onChange={handleChange}
                />
                Employer / Recruiter
              </label>

            </div>
          </div>

          {/* Only shows if error is not empty */}
          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary">
            Register
          </button>

        </form>

        <p className="footer-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

      </div>
    </div>
  );
}
