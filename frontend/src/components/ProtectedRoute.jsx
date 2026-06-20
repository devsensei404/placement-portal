// ProtectedRoute.jsx
// Wraps any route that requires the user to be logged in.
// If no token is found in localStorage, redirects to /login.
// Usage in App.jsx: { element: <ProtectedRoute><YourPage /></ProtectedRoute> }

import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}