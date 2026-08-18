// EyeIcon.jsx — matches the stroke-line icon style used in Login.jsx/Signup.jsx

export default function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M1.5 9C1.5 9 4.5 3.5 9 3.5C13.5 3.5 16.5 9 16.5 9C16.5 9 13.5 14.5 9 14.5C4.5 14.5 1.5 9 1.5 9Z"
          stroke="#555555"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="2.25" stroke="#555555" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M1.5 9C1.5 9 4.5 3.5 9 3.5C13.5 3.5 16.5 9 16.5 9C16.5 9 13.5 14.5 9 14.5C4.5 14.5 1.5 9 1.5 9Z"
        stroke="#999999"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2.5 2.5L15.5 15.5" stroke="#999999" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
