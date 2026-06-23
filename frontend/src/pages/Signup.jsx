// This is the signup page. Four inputs, one button, error message.
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import { useState, useEffect } from "react";

export default function Signup() {

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
    }, []);

  // formData holds all four fields the user fills in
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    accountType: "APPLICANT", // default role is APPLICANT
  });

  // error holds the error message. Empty string = no error.
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Runs on every keystroke — updates whichever field changed
  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // Runs when the user clicks "Register"
  async function handleSubmit(e) {
    e.preventDefault(); // stop page reload

    setError(""); // clear old error

    try {
      // Call the backend register endpoint
      const response = await fetch("http://localhost:8080/users/register", {
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

        <div className="card-header">
          <p className="subtitle">MeowJOB · IIT Durgapur</p>
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
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
            <p className="hint">8–15 chars · uppercase · lowercase · number · special (@#$%^&+=!)</p>
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
