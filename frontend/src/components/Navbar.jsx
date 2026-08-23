import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {

  const accountType = localStorage.getItem("accountType");

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("accountType");
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">

      <div className="navbar-logo">
        <span className="navbar-logo-kanji">浪</span>
        <span className="navbar-logo-text">RōninHire</span>
      </div>

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

      <div className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}>

        {accountType === "APPLICANT" && (
          <>
            <Link to="/student-dashboard" onClick={closeMenu}>Home</Link>
            <Link to="/browse-jobs" onClick={closeMenu}>Browse Jobs</Link>
            <Link to="/my-applications" onClick={closeMenu}>My Applications</Link>
            <Link to="/ats-checker" onClick={closeMenu}>ATS Checker</Link>
            <Link to="/chats" onClick={closeMenu}>Messages</Link>
            <Link to="/my-profile" onClick={closeMenu}>My Profile</Link>
            <Link to="/notifications" onClick={closeMenu}>Notifications</Link>
          </>
        )}

        {accountType === "EMPLOYER" && (
          <>
            <Link to="/recruiter-dashboard" onClick={closeMenu}>Home</Link>
            <Link to="/browse-jobs" onClick={closeMenu}>Browse Jobs</Link>
            <Link to="/my-jobs" onClick={closeMenu}>My Jobs</Link>
            <Link to="/chats" onClick={closeMenu}>Messages</Link>
            <Link to="/my-profile" onClick={closeMenu}>My Profile</Link>
            <Link to="/notifications" onClick={closeMenu}>Notifications</Link>
          </>
        )}

        {accountType === "ADMIN" && (
          <>
            <Link to="/admin-dashboard" onClick={closeMenu}>Dashboard</Link>
            <Link to="/admin/companies" onClick={closeMenu}>Companies</Link>
            <Link to="/admin/jobs" onClick={closeMenu}>Jobs</Link>
            <Link to="/admin/interview-exp" onClick={closeMenu}>Interview Experiences</Link>
            <Link to="/admin/recruiters" onClick={closeMenu}>Recruiters</Link>
            <Link to="/admin/reports" onClick={closeMenu}>Reports</Link>
            <Link to="/admin/audit-log" onClick={closeMenu}>Audit Log</Link>
          </>
        )}

        <button onClick={handleLogout} className="navbar-logout-btn">Logout</button>

      </div>
    </nav>
  );
}
