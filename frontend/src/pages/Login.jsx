// Login.jsx
// This is the login page. It has two inputs, one button, and an error message.
// If the user is already logged in (token exists in localStorage),
// they get redirected straight to their dashboard without seeing this form.

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import BASE_URL from "../api";

export default function Login() {

  // formData holds what the user types in the email and password fields
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // error holds the error message string. Empty string means no error.
  const [error, setError] = useState("");

  // toggles whether the password field shows plain text or dots
  const [showPassword, setShowPassword] = useState(false);

  // navigate() lets us redirect the user to a different page
  const navigate = useNavigate();

  // If a token already exists, the user is already logged in.
  // Redirect them to their dashboard immediately — no need to log in again.
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

  // This runs on every keystroke in any input field
  // e.target.name is the input's name attribute ("email" or "password")
  // e.target.value is what the user just typed
  // We copy the old formData with ...formData and update just the one field that changed
  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // This runs when the user clicks "Sign In"
  async function handleSubmit(e) {
    e.preventDefault(); // stops the browser from reloading the page

    setError(""); // clear any old error before trying again

    try {
      // Call the backend login endpoint
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), // send email and password as JSON
      });

      // If the server returned an error (4xx or 5xx), read the message and throw
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.errorMessage || "Login failed");
      }

      // Server returned 200 — get the JWT from the response
      const data = await response.json();
      const token = data.jwt;

      // Save the token in localStorage so other pages can use it
      localStorage.setItem("token", token);

      // Decode the JWT to get the user's role
      // A JWT has 3 parts separated by dots: header.payload.signature
      // We only need the middle part (payload), which is Base64 encoded
      const payload = JSON.parse(atob(token.split(".")[1]));

      localStorage.setItem("userId", payload.id);
      localStorage.setItem("accountType", payload.accountType);

      // payload.accountType will be "APPLICANT" or "EMPLOYER"
      // Redirect to the right dashboard based on role
      if (payload.accountType === "EMPLOYER") {
        navigate("/recruiter-dashboard");
      } else {
        navigate("/student-dashboard");
      }

    } catch (err) {
      // Something went wrong — show the error message below the button
      setError(err.message);
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
          <h1>Sign In</h1>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="willserfort@wistoria.magic"
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
          </div>

          {/* Only renders if error is not an empty string */}
          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary">
            Sign In
          </button>

        </form>

        <p className="footer-text">
          Don't have an account? <Link to="/signup">Register</Link>
        </p>

      </div>
    </div>
  );
}
