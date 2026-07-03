// TermsAndPrivacy.jsx
// Route: /terms-and-privacy
// Single page covering both Terms & Conditions and Privacy Policy.
// Footer links point here with #terms or #privacy to jump to the right section.

import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./TermsAndPrivacy.css";

const terms = [
  {
    title: "1. Purpose",
    body: "RōninHire is a recruitment platform built for NIT Durgapur, connecting students with recruiters through intelligent hiring tools including assessments, AI-powered resume generation, and direct messaging.",
  },
  {
    title: "2. User Accounts",
    body: "Users must register with accurate, current information and are solely responsible for maintaining the confidentiality of their login credentials. RōninHire is not liable for losses resulting from unauthorized account access due to user negligence.",
  },
  {
    title: "3. Eligibility",
    body: "By registering, you confirm that you are at least 18 years of age and legally permitted to enter into this agreement.",
  },
  {
    title: "4. Acceptable Use",
    body: "Users must not attempt unauthorized access, upload malicious or harmful content, impersonate others, or misuse any platform feature including messaging, assessments, or job applications. Violations may result in immediate account termination.",
  },
  {
    title: "5. Recruiter Responsibilities",
    body: "Recruiters must post genuine job opportunities, evaluate candidates fairly and without discrimination, and not collect applicant data for purposes outside this platform.",
  },
  {
    title: "6. Applicant Responsibilities",
    body: 'Applicants must provide truthful profile, resume, and application information. Misrepresentation may result in disqualification and account suspension.',
  },
  {
    title: "7. Intellectual Property",
    body: "All platform content, design, source code, and documentation are the intellectual property of RōninHire. Unauthorized reproduction or distribution is prohibited.",
  },
  {
    title: "8. Limitation of Liability",
    body: 'RōninHire is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, or consequential damages arising from use or inability to use the platform.',
  },
  {
    title: "9. Modifications",
    body: "RōninHire reserves the right to modify these terms at any time. Continued use of the platform following changes constitutes acceptance of the revised terms.",
  },
  {
    title: "10. Governing Law",
    body: "These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in West Bengal.",
  },
];

const privacy = [
  {
    title: "1. Information Collected",
    body: "We collect account information, profile details, resumes, certifications, work experience, chat messages, job applications, assessment results, and interview experiences submitted by users.",
  },
  {
    title: "2. Purpose of Collection",
    body: "Data is collected solely to provide recruitment, profile management, communication, assessment, and AI resume generation services within the platform.",
  },
  {
    title: "3. Authentication & Security",
    body: "All protected endpoints are secured via JWT-based authentication. Passwords are stored in encrypted form using BCrypt hashing. We implement industry-standard security practices to protect user data.",
  },
  {
    title: "4. Data Sharing",
    body: "Applicant information is shared only with recruiters authorized through the platform. We do not sell, trade, or disclose user data to unrelated third parties except where required by applicable law.",
  },
  {
    title: "5. Third-Party Services",
    body: "RōninHire integrates Cloudinary for media storage and Google Gemini API for AI-powered features. These services operate under their own privacy policies and we recommend reviewing them.",
  },
  {
    title: "6. Cookies & Local Storage",
    body: "The platform may use browser local storage for session management and user preferences. No third-party tracking cookies are used.",
  },
  {
    title: "7. Data Retention",
    body: "User data is retained for as long as an account remains active. Upon account deletion, personal data is removed within 30 days except where retention is required by law.",
  },
  {
    title: "8. User Rights",
    body: "Users may request access to, correction of, or deletion of their personal data by contacting us directly. We will respond within 7 business days.",
  },
];

export default function TermsAndPrivacy() {
  const location = useLocation();

  // React Router doesn't auto-scroll to hash fragments on navigation —
  // this handles it manually whenever the URL's hash changes.
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location]);

  return (
    <div className="legal-page">
      {/* Simple top bar — not the full app Navbar, since this page is reachable when logged out */}
      <div className="legal-topbar">
        <Link to="/" className="legal-logo">
          <span className="legal-logo-kanji">浪</span>
          <span className="legal-logo-text">RōninHire</span>
        </Link>
        <Link to="/" className="legal-back-link">Back to Home</Link>
      </div>

      <main className="legal-main">
        <div className="legal-header">
          <p className="legal-eyebrow">RŌNINHIRE</p>
          <h1 className="legal-title">Terms &amp; Conditions and Privacy Policy</h1>
          <p className="legal-updated">Please read both sections carefully before using the platform.</p>
        </div>

        {/* Jump nav between the two sections */}
        <nav className="legal-jumpnav">
          <a href="#terms" className="legal-jumpnav-link">Terms &amp; Conditions</a>
          <a href="#privacy" className="legal-jumpnav-link">Privacy Policy</a>
        </nav>

        {/* ══ TERMS & CONDITIONS ══ */}
        <section id="terms" className="legal-section">
          <h2 className="legal-section-title">Terms &amp; Conditions</h2>
          <div className="legal-clauses">
            {terms.map((clause) => (
              <div className="legal-clause" key={clause.title}>
                <h3>{clause.title}</h3>
                <p>{clause.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ PRIVACY POLICY ══ */}
        <section id="privacy" className="legal-section">
          <h2 className="legal-section-title">Privacy Policy</h2>
          <div className="legal-clauses">
            {privacy.map((clause) => (
              <div className="legal-clause" key={clause.title}>
                <h3>{clause.title}</h3>
                <p>{clause.body}</p>
              </div>
            ))}

            <div className="legal-clause">
              <h3>9. Contact</h3>
              <p>
                If you have any inquiries, feedback, or privacy-related concerns, reach out to us
                through either of the channels below and we'll get back to you as soon as possible.
              </p>
              <div className="legal-contact-block">
                <a
                  href="https://forms.gle/LS32ZvEyxMu3vaRx7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="legal-contact-item"
                >
                  Feedback form
                </a>
                <a href="mailto:support.roninhire@gmail.com" className="legal-contact-item">
                  support.roninhire@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="legal-footer-note">
          <p>Developed by DEVSENSEI404 · NIT Durgapur, 2nd Year Mechanical Engineering</p>
        </div>
      </main>
    </div>
  );
}
