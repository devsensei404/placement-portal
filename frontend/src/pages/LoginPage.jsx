// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { loginUser } from "../api/auth";

// export default function LoginPage() {
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   function handleChange(e) {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       const data = await loginUser(formData);
//       localStorage.setItem("token", data.jwt);
//       navigate("/dashboard");
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
//       <div className="w-full max-w-md">

//         <div className="mb-10">
//           <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">
//             GLUG · NIT Durgapur
//           </p>
//           <h1 className="text-3xl font-bold text-white">Welcome back</h1>
//           <p className="text-zinc-400 mt-1 text-sm">Sign in to your account</p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-5">

//           <div>
//             <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
//               Email
//             </label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               placeholder="you@nitdgp.ac.in"
//               className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
//               Password
//             </label>
//             <input
//               type="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               required
//               placeholder="••••••••"
//               className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
//             />
//           </div>

//           {error && (
//             <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3">
//               {error}
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition text-sm"
//           >
//             {loading ? "Signing in..." : "Sign In"}
//           </button>

//         </form>

//         <p className="text-zinc-500 text-sm text-center mt-6">
//           Don't have an account?{" "}
//           <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition">
//             Register
//           </Link>
//         </p>

//       </div>
//     </div>
//   );
// }