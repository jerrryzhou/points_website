import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Link } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Your backend should always respond 200 with a generic message
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSent(true);
        toast.success(data.message || "If an account exists, a reset link has been sent.");
      } else {
        toast.error(data.error || "Unable to send reset email");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-800 via-emerald-900 to-gray-400 p-6">
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Reset your password</h1>
        <p className="text-gray-300 text-sm text-center mb-6">
          Enter your email and we’ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="you@example.com"
              required
              disabled={sent}
            />
          </div>

          <button
            type="submit"
            disabled={sent}
            className="w-full py-3 mt-2 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-60 text-gray-900 font-semibold rounded-xl transition duration-200"
          >
            {sent ? "Email sent" : "Send reset link"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-yellow-50 hover:text-yellow-100 text-sm">
            Back to login
          </Link>
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}