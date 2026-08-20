import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Login from "./pages/Login.jsx"
import KanjiGate from "./pages/KanjiGate.jsx"
import StudentDashboard from "./pages/StudentDashboard.jsx"
import BrowseJobs from './pages/BrowseJobs.jsx';
import JobDetails from "./pages/JobDetails";
import MyApplications from "./pages/MyApplications.jsx";
import ApplicationDetail from "./pages/ApplicationDetail.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import Notifications from "./pages/Notifications.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import RecruiterDashboard from "./pages/RecruiterDashboard.jsx";
import MyJobs from "./pages/MyJobs.jsx";
import Candidates from "./pages/Candidates";
import CandidateProfile from "./pages/CandidateProfile";
import Chats from "./pages/Chats.jsx";
import ChatWindow from "./pages/ChatWindow.jsx";
import ResumeBuilder from "./pages/ResumeBuilder.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import TermsAndPrivacy from "./pages/TermsAndPrivacy.jsx";
import ManageAssessments from "./pages/ManageAssessments.jsx";
import ManageQuestions from "./pages/ManageQuestions.jsx";
import AssessmentResults from "./pages/AssessmentResults.jsx";
import TakeAssessment from "./pages/TakeAssessment.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

const router = createBrowserRouter([
  { path:"/", element: <LandingPage /> },
  { path: "/terms-and-privacy", element: <TermsAndPrivacy /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <KanjiGate /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/student-dashboard", element: <ProtectedRoute><StudentDashboard /></ProtectedRoute> },
  { path: "/browse-jobs", element: <ProtectedRoute><BrowseJobs /></ProtectedRoute> },
  { path: "/job-details", element: <ProtectedRoute><JobDetails /></ProtectedRoute> },
  { path: "/my-applications", element: <ProtectedRoute><MyApplications /></ProtectedRoute> },
  { path: "/application-detail", element: <ProtectedRoute><ApplicationDetail /></ProtectedRoute> },
  { path: "/notifications", element: <ProtectedRoute><Notifications /></ProtectedRoute> },
  { path: "/my-profile", element: <ProtectedRoute><MyProfile /></ProtectedRoute> },
  { path: "/recruiter-dashboard", element: <ProtectedRoute><RecruiterDashboard /></ProtectedRoute> },
  { path: "/my-jobs", element: <ProtectedRoute><MyJobs /></ProtectedRoute> },
  { path: "/candidates", element: <ProtectedRoute><Candidates /></ProtectedRoute> },
  { path: "/candidate/:id", element: <ProtectedRoute><CandidateProfile /></ProtectedRoute> },
  { path: "/chats", element: <ProtectedRoute><Chats /></ProtectedRoute> },
  { path: "/chats/:otherUserId", element: <ProtectedRoute><ChatWindow /></ProtectedRoute> },
  { path: "/resume-builder", element: <ProtectedRoute><ResumeBuilder /></ProtectedRoute> },
  { path: "/assessments/manage/:jobId", element: <ProtectedRoute><ManageAssessments /></ProtectedRoute> },
  { path: "/assessments/:assessmentId/questions", element: <ProtectedRoute><ManageQuestions /></ProtectedRoute> },
  { path: "/assessments/:assessmentId/results", element: <ProtectedRoute><AssessmentResults /></ProtectedRoute> },
  { path: "/assessments/:assessmentId/take", element: <ProtectedRoute><TakeAssessment /></ProtectedRoute> },
  { path: "/admin-dashboard", element: <AdminRoute><AdminDashboard /></AdminRoute> },

])

export default function App() {
  return <RouterProvider router={router} />
}
