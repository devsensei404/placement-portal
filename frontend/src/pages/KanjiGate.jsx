// KanjiGate.jsx
// Route: /signup
//
// A closed two-panel black gate. Left panel (wider) covers the three
// non-admin roles — Applicant / Recruiter / Company. Right panel (narrower)
// is Admin only. Dragging, swiping, or clicking a panel parts the gate and
// reveals that side's form stage.
//
// Once the left side is open, a 3-way toggle (Applicant / Recruiter /
// Company) switches between those forms using a lighter 3D flip instead of
// re-running the full gate animation. Applicant is the default tab when the
// left side opens. The right side has no toggle — it's just Admin.
//
// "Back" from any form re-closes the gate with the same slide-together
// motion used to open it.
//
// States: "closed" -> "left" | "right"
// Sub-state while the left side is open: which of the three left-side forms
// is currently showing (leftRole), so switching between them only flips,
// it never re-triggers the gate slide.

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminSignupForm from "../components/AdminSignupForm";
import CompanySignupForm from "../components/CompanySignupForm";
import ApplicantSignupForm from "../components/ApplicantSignupForm";
import RecruiterSignupForm from "../components/RecruiterSignupForm";
import "./KanjiGate.css";

const DRAG_THRESHOLD = 80; // px of horizontal drag before it counts as a committed swipe
const REDIRECT_DELAY = 4000; // ms before auto-redirect to /login after success

const LEFT_ROLES = ["applicant", "recruiter", "company"];
const LEFT_ROLE_LABELS = { applicant: "Applicant", recruiter: "Recruiter", company: "Company" };

export default function KanjiGate() {
  const navigate = useNavigate();

  // "closed" | "left" | "right" — which side of the gate is currently active/target.
  const [gateState, setGateState] = useState("closed");

  // Which form is showing on the left side (only meaningful once gateState === "left").
  // Defaults to "applicant" every time the left side is freshly opened.
  const [leftRole, setLeftRole] = useState("applicant");

  const [flipKey, setFlipKey] = useState(0); // bump to replay the flip animation every switch
  const [successRole, setSuccessRole] = useState(null); // "ADMIN" | "COMPANY" | "APPLICANT" | "EMPLOYER" | null

  // Drag tracking
  const [dragX, setDragX] = useState(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Redirect to /login after a successful registration
  useEffect(() => {
    if (!successRole) return;
    const t = setTimeout(() => navigate("/login"), REDIRECT_DELAY);
    return () => clearTimeout(t);
  }, [successRole, navigate]);

  const openGate = useCallback((side) => {
    if (side === "left") setLeftRole("applicant"); // always land on Applicant first
    setGateState(side);
    setDragX(0);
    setFlipKey(0);
  }, []);

  const closeGate = useCallback(() => {
    setGateState("closed");
    setDragX(0);
    setSuccessRole(null);
    setFlipKey(0); // so the next open starts on kg-flip-initial again, not a stale flip
  }, []);

  // Switching role within the already-open left side — flip instead of re-sliding the gate.
  function switchLeftRole(role) {
  if (role === leftRole) return;
  setLeftRole(role);
  setFlipKey((k) => k + 1);
}

  // ── Drag / swipe handling (closed-gate state only) ──────────────────────

  function handlePointerDown(e) {
    if (gateState !== "closed") return;
    draggingRef.current = true;
    startXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  }

  function handlePointerMove(e) {
    if (!draggingRef.current) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    setDragX(x - startXRef.current);
  }

  function handlePointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (dragX > DRAG_THRESHOLD) {
      openGate("right"); // dragged right -> reveal Admin
    } else if (dragX < -DRAG_THRESHOLD) {
      openGate("left"); // dragged left -> reveal Applicant/Recruiter/Company
    } else {
      setDragX(0); // snap back, didn't clear threshold
    }
  }

  const isOpen = gateState !== "closed";
  const dragProgress = Math.max(-1, Math.min(1, dragX / 220)); // -1..1 for live panel feedback

  function renderLeftForm() {
    const commonProps = {
      onBack: closeGate,
      onSuccess: () => setSuccessRole(leftRole === "applicant" ? "APPLICANT" : leftRole === "recruiter" ? "EMPLOYER" : "COMPANY"),
    };
    if (leftRole === "applicant") return <ApplicantSignupForm {...commonProps} />;
    if (leftRole === "recruiter") return <RecruiterSignupForm {...commonProps} />;
    return <CompanySignupForm {...commonProps} />;
  }

  return (
    <div className="kg-page">
      <div
        className={`kg-gate ${isOpen ? "kg-gate-open" : ""} ${isOpen ? `kg-gate-open-${gateState}` : ""}`}
      >
        {/* Left panel — Applicant / Recruiter / Company (wider) */}
        <button
          type="button"
          className="kg-panel kg-panel-left"
          style={
            !isOpen
              ? { transform: `translateX(${Math.min(dragProgress, 0) * 40}px)` }
              : undefined
          }
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          aria-label="Register a student, recruiter, or company account"
          disabled={isOpen}
        >
          <span className="kg-panel-label">Student · Recruiter · Company</span>
          <span className="kg-panel-kanji" aria-hidden="true">生</span>
        </button>

        {/* Right panel — Admin (narrower) */}
        <button
          type="button"
          className="kg-panel kg-panel-right"
          style={
            !isOpen
              ? { transform: `translateX(${Math.max(dragProgress, 0) * 40}px)` }
              : undefined
          }
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          aria-label="Register an admin account"
          disabled={isOpen}
        >
          <span className="kg-panel-label">Admin</span>
          <span className="kg-panel-kanji" aria-hidden="true">主</span>
        </button>

        {/* Center brand mark, visible only while closed */}
        {!isOpen && (
          <div className="kg-center-mark">
            <span className="kg-center-kanji">浪</span>
            <p className="kg-center-hint">Drag or swipe a side</p>
          </div>
        )}
      </div>

      {/* Form stage — mounted once the gate has opened at least once */}
      {isOpen && (
        <div className="kg-stage">
          {/* Only the left side gets a role toggle — right side is Admin-only */}
          {gateState === "left" && !successRole && (
            <div className="kg-role-toggle kg-role-toggle-3">
              {LEFT_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`kg-role-btn ${leftRole === role ? "kg-role-active" : ""}`}
                  onClick={() => switchLeftRole(role)}
                >
                  {LEFT_ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          )}

          {successRole ? (
            <SuccessState role={successRole} onLoginNow={() => navigate("/login")} />
          ) : gateState === "left" ? (
            <div className={`kg-flip-card ${flipKey === 0 ? "kg-flip-initial" : ""}`} key={`left-${flipKey}`}>
              <div className="kg-flip-face">{renderLeftForm()}</div>
            </div>
          ) : (
            <div className={`kg-flip-card ${flipKey === 0 ? "kg-flip-initial" : ""}`} key="right">
              <div className="kg-flip-face">
                <AdminSignupForm onBack={closeGate} onSuccess={() => setSuccessRole("ADMIN")} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuccessState({ role, onLoginNow }) {
  const label =
    role === "ADMIN" ? "admin" :
    role === "COMPANY" ? "company" :
    role === "EMPLOYER" ? "recruiter" :
    "student";

  return (
    <div className="kg-success kg-fade">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18.5" stroke="#111111" strokeWidth="1.6" />
        <path d="M12 20.5L17 25.5L28 14" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2 className="kg-heading">Registration successful</h2>
      <p className="kg-subtext">
        Your {label} account has been created. Redirecting you to sign in…
      </p>
      <button type="button" className="kg-btn kg-btn-outline" onClick={onLoginNow}>
        Go to sign in now
      </button>
    </div>
  );
}
