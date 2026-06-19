import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Login from "./pages/Login.jsx"
import Signup from "./pages/Signup.jsx"

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/student-dashboard", element: <div style={{color:"white", padding:"40px"}}>Student Dashboard — coming soon</div> },
  { path: "/recruiter-dashboard", element: <div style={{color:"white", padding:"40px"}}>Recruiter Dashboard — coming soon</div> },
])

export default function App() {
  return <RouterProvider router={router} />
}