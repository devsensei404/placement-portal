// NotFound.jsx
// Used both as a catch-all route (404) and as the router's errorElement
// (unexpected errors during route render/loading), so it reads whatever
// error info react-router gives it via useRouteError.

import { useNavigate, useRouteError, isRouteErrorResponse } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();
  const error = useRouteError();

  let heading = "Page not found";
  let message = "The page you're looking for doesn't exist or may have been moved.";

  if (error) {
    if (isRouteErrorResponse(error) && error.status === 404) {
      heading = "Page not found";
      message = "The page you're looking for doesn't exist or may have been moved.";
    } else {
      heading = "Something went wrong";
      message = "An unexpected error occurred. Please try again.";
    }
  }

  return (
    <div className="nf-wrap">
      <div className="nf-card">
        <span className="nf-code">{isRouteErrorResponse(error) ? error.status : "404"}</span>
        <h1 className="nf-heading">{heading}</h1>
        <p className="nf-message">{message}</p>
        <div className="nf-actions">
          <button className="nf-btn nf-btn-primary" onClick={() => navigate("/")}>
            Go home
          </button>
          <button className="nf-btn" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
