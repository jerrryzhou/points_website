import { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Remember to add documentation
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({email, password}),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", data.user);
        console.log("logged in");
        console.log(data.user)
      } else {
        if (data.error === "User does not exist") {
          toast.error("User does not exist");
        }
        else if (data.error === "Wrong password") {
          toast.error("Wrong password");
        }
        else if (data.error === "Account not yet approved") {
          toast.error("Account not yet approved");
        }
        else {
          toast.error("Something went wrong");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-800 via-emerald-900 to-gray-400">
      {/* Background overlay */}
      <div className="absolute top-6 left-8 flex flex-col">
        <h1 className="text-5xl font-bold text-white tracking-wide">ΔΣΦ</h1>
        <h2 className="text-lg text-emerald-100 mt-1">ΔΔ</h2>
      </div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10" />

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Delta Sigma Phi
          </h1>
          <p className="text-gray-300 text-sm">
            Log in to access your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-yellow-50 hover:bg-yellow-100 text-gray-900 font-semibold rounded-xl transition duration-200"
          >
            Sign In
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Register a New Account{" "}
            <a href="#" className="text-yellow-50 hover:text-yellow-100">
              here
            </a>
          </p>
        </div>
      </div>

      <p className="mt-8 text-gray-400 text-xs">
        © {new Date().getFullYear()} Delta Sigma Phi. All rights reserved.
      </p>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}