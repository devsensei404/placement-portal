// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { registerUser } from "../api/auth";

// export default function SignupPage() {
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     accountType: "APPLICANT",
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
//       await registerUser(formData);
//       navigate("/login");
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
//           <h1 className="text-3xl font-bold text-white">Create account</h1>
//           <p className="text-zinc-400 mt-1 text-sm">Join the placement portal</p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-5">

//           <div>
//             <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
//               Full Name
//             </label>
//             <input
//               type="text"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               required
//               placeholder="Arjun Sharma"
//               className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
//             />
//           </div>

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
//             <p className="text-zinc-600 text-xs mt-2">
//               8–15 chars · uppercase · lowercase · number · special (@#$%^&+=!)
//             </p>
//           </div>

//           <div>
//             <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
//               I am a...
//             </label>
//             <div className="grid grid-cols-2 gap-3">
//               {["APPLICANT", "EMPLOYER"].map((role) => (
//                 <button
//                   key={role}
//                   type="button"
//                   onClick={() => setFormData({ ...formData, accountType: role })}
//                   className={`py-3 rounded-lg text-sm font-medium border transition cursor-pointer ${
//                     formData.accountType === role
//                       ? "bg-indigo-600 border-indigo-600 text-white"
//                       : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
//                   }`}
//                 >
//                   {role === "APPLICANT" ? "Student / Applicant" : "Employer / Recruiter"}
//                 </button>
//               ))}
//             </div>
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
//             {loading ? "Creating account..." : "Create Account"}
//           </button>

//         </form>

//         <p className="text-zinc-500 text-sm text-center mt-6">
//           Already have an account?{" "}
//           <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition">
//             Sign in
//           </Link>
//         </p>

//       </div>
//     </div>
//   );
// }