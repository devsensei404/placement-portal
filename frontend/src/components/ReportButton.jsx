import { useState } from "react";
import BASE_URL from "../api";
import "./ReportButton.css";

const REASONS = ["SPAM", "INAPPROPRIATE_CONTENT", "MISLEADING", "HARASSMENT", "FRAUD", "OTHER"];

function humanizeReason(reason) {
  const words = reason.split("_").filter(Boolean).map((w) => w.toLowerCase());
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 14V2.5C3 2.22386 3.22386 2 3.5 2H11.5C11.9 2 12.1 2.45 11.85 2.76L9.8 5.3C9.65 5.48 9.65 5.72 9.8 5.9L11.85 8.44C12.1 8.75 11.9 9.2 11.5 9.2H4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ReportButton({ targetType, targetId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");

  function openModal(e) {
    e.stopPropagation();
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setReason("");
    setDetails("");
    setStatus(null);
    setErrorMsg("");
  }

  function handleSubmit() {
    if (!reason || submitting) return;
    setSubmitting(true);
    setStatus(null);
    setErrorMsg("");

    fetch(`${BASE_URL}/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        targetType,
        targetId,
        reason,
        details: details.trim() || "",
      }),
    })
      .then(async (res) => {
        if (res.status === 201) {
          setStatus("success");
          return;
        }
        const data = await res.json().catch(() => ({}));
        const code = data.errorMessage || data.message || "";
        if (code === "REPORT_ALREADY_FILED") {
          setStatus("already");
        } else {
          setStatus("error");
          setErrorMsg("Something went wrong. Please try again.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Network error. Please try again.");
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <>
      <button
        type="button"
        className="report-btn"
        onClick={openModal}
        aria-label="Report"
        title="Report"
      >
        <FlagIcon />
      </button>

      {open && (
        <div className="report-modal-overlay" onClick={closeModal}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>

            {status === "success" ? (
              <>
                <p className="report-success">Report submitted, thank you.</p>
                <div className="report-modal-actions">
                  <button type="button" className="report-btn-cancel" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="report-modal-title">Report this</h3>

                {status === "already" ? (
                  <>
                    <p className="report-already-msg">
                      You've already reported this — our team is reviewing it.
                    </p>
                    <div className="report-modal-actions">
                      <button type="button" className="report-btn-cancel" onClick={closeModal}>
                        Close
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="report-label" htmlFor="report-reason">Reason</label>
                    <select
                      id="report-reason"
                      className="report-select"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option value="">Select a reason…</option>
                      {REASONS.map((r) => (
                        <option key={r} value={r}>{humanizeReason(r)}</option>
                      ))}
                    </select>

                    <label className="report-label" htmlFor="report-details">Details (optional)</label>
                    <textarea
                      id="report-details"
                      className="report-textarea"
                      placeholder="Add any details that might help us review this (optional)"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={3}
                    />

                    {status === "error" && <p className="report-error">{errorMsg}</p>}

                    <div className="report-modal-actions">
                      <button type="button" className="report-btn-cancel" onClick={closeModal} disabled={submitting}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="report-btn-submit"
                        onClick={handleSubmit}
                        disabled={!reason || submitting}
                      >
                        {submitting ? "Submitting…" : "Submit"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
