// StatusBadge.jsx
// Reusable badge component for application status.
// Pass large={true} on the detail page for the bigger version.

const STATUS_CONFIG = {
  APPLIED:      { label: "Applied",      bg: "#f3efff", color: "#7c3aed", dot: "#8b5cf6" },
  INTERVIEWING: { label: "Interviewing", bg: "#fef9c3", color: "#92400e", dot: "#f59e0b" },
  OFFERED:      { label: "Offered",      bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  REJECTED:     { label: "Rejected",     bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
};

export default function StatusBadge({ status, large = false }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: "#f3f4f6",
    color: "#374151",
    dot: "#9ca3af",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: large ? "8px" : "5px",
        backgroundColor: config.bg,
        color: config.color,
        padding: large ? "10px 20px" : "3px 10px",
        borderRadius: "999px",
        fontSize: large ? "16px" : "12px",
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          width: large ? "10px" : "7px",
          height: large ? "10px" : "7px",
          borderRadius: "50%",
          backgroundColor: config.dot,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}
