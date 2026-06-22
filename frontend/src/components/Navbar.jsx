// Navbar.jsx
// Reusable navbar shown on every dashboard page.
// Reads accountType from localStorage to show the right links.

import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {

  // Read accountType to decide which links to show
  const accountType = localStorage.getItem("accountType");

  // useNavigate lets us redirect after logout
  const navigate = useNavigate();

  // Clears all auth data and sends user back to login
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("accountType");
    navigate("/login");
  }

  return (
    <nav className="navbar">

      {/* Logo — clicking takes you to the right dashboard */}
      <span className="navbar-logo">MeowJOB🐱</span>

      {/* Nav links — different per role */}
      <div className="navbar-links">

        {accountType === "APPLICANT" && (
          <>
            <Link to="/student-dashboard">Home</Link>
            <Link to="/browse-jobs">Browse Jobs</Link>
            <Link to="/my-applications">My Applications</Link>
            <Link to="/my-profile">My Profile</Link>
            <Link to="/notifications">Notifications</Link>
          </>
        )}

        {accountType === "EMPLOYER" && (
          <>
            {/* Recruiter links go here when we build that branch */}
            <Link to="/recruiter-dashboard">Home</Link>
          </>
        )}

        <button onClick={handleLogout}>Logout</button>

      </div>
    </nav>
  );
}