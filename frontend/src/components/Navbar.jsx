// Navbar.jsx
// Reusable navbar shown on every dashboard page.
// Reads accountType from localStorage to show the right links.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {

  // Read accountType to decide which links to show
  const accountType = localStorage.getItem("accountType");

  // useNavigate lets us redirect after logout
  const navigate = useNavigate();

  // Controls whether the mobile menu is open or closed
  const [menuOpen, setMenuOpen] = useState(false);

  // Clears all auth data and sends user back to login
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("accountType");
    navigate("/login");
  }

  // Closes the mobile menu — called whenever a link is clicked
  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">

      {/* Logo — kanji + wordmark, same as landing/login/signup */}
      <div className="navbar-logo">
        <span className="navbar-logo-kanji">浪</span>
        <span className="navbar-logo-text">RōninHire</span>
      </div>

      {/* Hamburger button — only visible on small screens via CSS */}
      <button
        className={`navbar-hamburger ${menuOpen ? "navbar-hamburger-open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Nav links — different per role */}
      <div className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}>

        {accountType === "APPLICANT" && (
          <>
            <Link to="/student-dashboard" onClick={closeMenu}>Home</Link>
            <Link to="/browse-jobs" onClick={closeMenu}>Browse Jobs</Link>
            <Link to="/my-applications" onClick={closeMenu}>My Applications</Link>
            <Link to="/chats" onClick={closeMenu}>Messages</Link>
            <Link to="/my-profile" onClick={closeMenu}>My Profile</Link>
            <Link to="/notifications" onClick={closeMenu}>Notifications</Link>
          </>
        )}

        {accountType === "EMPLOYER" && (
          <>
            {/* Recruiter links go here when we build that branch */}
            <Link to="/recruiter-dashboard" onClick={closeMenu}>Home</Link>
            <Link to="/browse-jobs" onClick={closeMenu}>Browse Jobs</Link>
            <Link to="/my-jobs" onClick={closeMenu}>My Jobs</Link>
            <Link to="/chats" onClick={closeMenu}>Messages</Link>
            <Link to="/my-profile" onClick={closeMenu}>My Profile</Link>
            <Link to="/notifications" onClick={closeMenu}>Notifications</Link>
          </>
        )}

        <button onClick={handleLogout} className="navbar-logout-btn">Logout</button>

      </div>
    </nav>
  );
}
