// Login.jsx
// This is the login page. It has two inputs, one button, and an error message.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {

  // formData holds what the user types in the email and password fields
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // error holds the error message string. Empty string means no error.
  const [error, setError] = useState("");

  // navigate() lets us redirect the user to a different page
  const navigate = useNavigate();

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
      const response = await fetch("http://localhost:8080/auth/login", {
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

      localStorage.setItem("userId", payload.id)
      localStorage.setItem("accountType", payload.accountType)

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

        <div className="card-header">
          <p className="subtitle">MeowJOB · IIT Durgapur</p>
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
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
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
