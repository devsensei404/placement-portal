// AdminRoute.jsx
// Wraps any route that requires the user to be logged in AND be an admin.
// If no token is found, or the token exists but the account isn't ADMIN,
// redirects to /login (kept simple/safe for v1 — no separate "not
// authorized" page yet).
// Usage in App.jsx: { element: <AdminRoute><YourPage /></AdminRoute> }

import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const accountType = localStorage.getItem("accountType");

  if (!token || accountType !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
