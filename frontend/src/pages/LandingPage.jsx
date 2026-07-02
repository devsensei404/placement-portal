import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const faqData = [
  {
    q: "Who can use RōninHire?",
    a: "RōninHire is built for NIT Durgapur. Students register with a valid @nitdgp.ac.in email address. Recruiters can register with any valid email.",
  },
  {
    q: "Is RōninHire free to use?",
    a: "Yes, completely free for both students and recruiters.",
  },
  {
    q: "What can students do on RōninHire?",
    a: "Students can build detailed profiles, browse and apply for jobs, track application status, schedule interviews, chat with recruiters, share interview experiences, and generate AI-powered resumes.",
  },
  {
    q: "What can recruiters do?",
    a: "Recruiters can post and manage job listings, review applicants, schedule interviews, change application statuses, browse candidate profiles, and communicate directly with students.",
  },
  {
    q: "What features are coming soon?",
    a: "Upcoming features include Google OAuth login, email OTP verification, WebSocket-based real-time chat, company profiles with verification, job ratings, and a mobile-responsive design.",
  },
  {
    q: "Is my data safe?",
    a: "All passwords are encrypted. JWT-based authentication secures every request. File uploads are handled via Cloudinary.",
  },
];

function BriefcaseIcon() {
  return (
    <svg className="feature-icon" viewBox="0 0 48 48" fill="none">
      <rect className="draw" x="8" y="16" width="32" height="22" rx="3" stroke="#111111" strokeWidth="2" />
      <path className="draw" d="M17 16V12a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" stroke="#111111" strokeWidth="2" />
      <line className="draw" x1="8" y1="26" x2="40" y2="26" stroke="#111111" strokeWidth="2" />
      <rect className="draw" x="21" y="23" width="6" height="6" rx="1" stroke="#111111" strokeWidth="2" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="feature-icon" viewBox="0 0 48 48" fill="none">
      <circle className="draw" cx="24" cy="17" r="8" stroke="#111111" strokeWidth="2" />
      <path className="draw" d="M9 40c0-8.284 6.716-14 15-14s15 5.716 15 14" stroke="#111111" strokeWidth="2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="feature-icon" viewBox="0 0 48 48" fill="none">
      <path
        className="draw"
        d="M8 12a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H20l-8 7v-7h-1a3 3 0 0 1-3-3V12z"
        stroke="#111111"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line className="draw pulse-dot" x1="15" y1="20" x2="15" y2="20.01" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
      <line className="draw pulse-dot delay-1" x1="24" y1="20" x2="24" y2="20.01" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
      <line className="draw pulse-dot delay-2" x1="33" y1="20" x2="33" y2="20.01" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg className="step-icon" viewBox="0 0 48 48" fill="none">
      <circle className="draw" cx="24" cy="24" r="16" stroke="#111111" strokeWidth="2" />
      <path className="draw" d="M24 17v14M17 24h14" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BuildIcon() {
  return (
    <svg className="step-icon" viewBox="0 0 48 48" fill="none">
      <rect className="draw" x="10" y="8" width="28" height="32" rx="2" stroke="#111111" strokeWidth="2" />
      <line className="draw" x1="16" y1="17" x2="32" y2="17" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
      <line className="draw" x1="16" y1="24" x2="32" y2="24" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
      <line className="draw" x1="16" y1="31" x2="26" y2="31" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrackIcon() {
  return (
    <svg className="step-icon" viewBox="0 0 48 48" fill="none">
      <path className="draw" d="M10 34l8-10 7 6 13-16" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path className="draw" d="M30 14h8v8" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeroGraphic() {
  return (
    <div className="hero-logo-graphic">
      <span className="hero-logo-kanji">浪</span>
      <span className="hero-logo-text">RōninHire</span>
    </div>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg className={`chevron ${open ? "chevron-open" : ""}`} viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="landing-root">
      <nav className="landing-navbar">
        <div className="landing-navbar-inner">
          <div className="landing-wordmark">
            <span className="kanji">浪</span>
            <span>RōninHire</span>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
            <Link to="/signup" className="btn btn-filled">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <h1 className="hero-heading">The Placement Portal Built for NIT Durgapur</h1>
        <p className="hero-subheading">
          Connect students with recruiters. Apply to jobs, schedule interviews, and track your career — all in one place.
        </p>
        <div className="hero-cta-group">
          <Link to="/signup" className="btn btn-filled btn-large">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-outline btn-large">
            Sign In
          </Link>
        </div>
        <HeroGraphic />
      </section>

      <section className="features-section">
        <h2 className="section-heading">Everything you need</h2>
        <div className="features-grid">
          <div className="feature-card">
            <BriefcaseIcon />
            <h3>Job Postings</h3>
            <p>Recruiters post full-time, part-time, and internship roles with detailed JDs and skill requirements</p>
          </div>
          <div className="feature-card">
            <ProfileIcon />
            <h3>Smart Profiles</h3>
            <p>Students build complete profiles with skills, experience, certifications, and AI-generated resumes</p>
          </div>
          <div className="feature-card">
            <ChatIcon />
            <h3>Direct Messaging</h3>
            <p>Students and recruiters communicate directly via built-in chat — no email chains</p>
          </div>
        </div>
      </section>

      <section className="steps-section">
        <h2 className="section-heading">How it works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-number">01</span>
            <AccountIcon />
            <h3>Create your account</h3>
            <p>Register as a student with your @nitdgp.ac.in email or as a recruiter</p>
          </div>
          <div className="step-card">
            <span className="step-number">02</span>
            <BuildIcon />
            <h3>Build your profile</h3>
            <p>Add your skills, experience, certifications and upload your resume</p>
          </div>
          <div className="step-card">
            <span className="step-number">03</span>
            <TrackIcon />
            <h3>Apply and track</h3>
            <p>Browse open roles, apply in one click, and track every application status in real time</p>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <h2 className="section-heading">Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqData.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div className={`faq-item ${isOpen ? "faq-item-open" : ""}`} key={idx}>
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronIcon open={isOpen} />
                </button>
                <div className="faq-answer-wrapper" style={{ maxHeight: isOpen ? "300px" : "0px" }}>
                  <p className="faq-answer">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-col">
            <div className="footer-wordmark">
              <span className="kanji">浪</span>
              <span>RōninHire</span>
            </div>
            <p>The placement portal for NIT Durgapur</p>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <a href="#">Browse Jobs</a>
            <a href="#">Post a Job</a>
            <a href="#">My Profile</a>
            <a href="#">Resume Builder</a>
            <a href="#">Notifications</a>
          </div>
          <div className="footer-col">
            <h4>Contact Us</h4>
            <a href="mailto:support.roninhire@gmail.com">support.roninhire@gmail.com</a>
            <p>For technical issues or queries, reach out via email</p>
          </div>
          <div className="footer-col">
            <h4>Feedback</h4>
            <p>Help us improve RōninHire</p>
            <a
              href="https://forms.gle/LS32ZvEyxMu3vaRx7"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-feedback-btn"
            >
              Share Feedback
            </a>
          </div>
        </div>

        <div className="footer-legal">
          <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>
          <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          <a href="#">Cookie Policy</a>
        </div>

        <div className="footer-bottom">
          <span>© 2026 RōninHire. All rights reserved.</span>
          <span>Developed by DEVSENSEI404</span>
        </div>
      </footer>
    </div>
  );
}
