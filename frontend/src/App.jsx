import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Login from "./pages/Login.jsx"
import Signup from "./pages/Signup.jsx"
import StudentDashboard from "./pages/StudentDashboard.jsx"
import BrowseJobs from './pages/BrowseJobs.jsx';
import JobDetails from "./pages/JobDetails";
import MyApplications from "./pages/MyApplications.jsx";
import ApplicationDetail from "./pages/ApplicationDetail.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Notifications from "./pages/Notifications.jsx";
import MyProfile from "./pages/MyProfile.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/student-dashboard", element: <ProtectedRoute><StudentDashboard /></ProtectedRoute> },
  { path: "/browse-jobs", element: <ProtectedRoute><BrowseJobs /></ProtectedRoute> },
  { path: "/job-details", element: <ProtectedRoute><JobDetails /></ProtectedRoute> },
  { path: "/my-applications", element: <ProtectedRoute><MyApplications /></ProtectedRoute> },
  { path: "/application-detail", element: <ProtectedRoute><ApplicationDetail /></ProtectedRoute> },
  { path: "/notifications", element: <ProtectedRoute><Notifications /></ProtectedRoute> },
  { path: "/my-profile", element: <ProtectedRoute><MyProfile /></ProtectedRoute> },
  { path: "/recruiter-dashboard", element: <ProtectedRoute><div style={{color:"red", padding:"40px"}}>Recruiter Dashboard — coming soon</div></ProtectedRoute> },
])

export default function App() {
  return <RouterProvider router={router} />
}
