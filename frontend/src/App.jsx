import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Login from "./pages/Login.jsx"
import Signup from "./pages/Signup.jsx"
import StudentDashboard from "./pages/StudentDashboard.jsx"
import BrowseJobs from './pages/BrowseJobs.jsx';

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/student-dashboard", element: <StudentDashboard /> },
  { path: "/recruiter-dashboard", element: <div style={{color:"red", padding:"40px"}}>Recruiter Dashboard — coming soon</div> },
  { path: '/browse-jobs', element: <BrowseJobs />}
])

export default function App() {
  return <RouterProvider router={router} />
}