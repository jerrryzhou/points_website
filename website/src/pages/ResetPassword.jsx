import { useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const missingParams = useMemo(() => !email || !token, [email, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (missingParams) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }
    // if (newPassword.length < 8) {
    //   toast.error("Password must be at least 8 characters");
    //   return;
    // }
    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("Password updated! You can log in now.");
        setTimeout(() => navigate("/login"), 800);
      } else {
        toast.error(data.error || "Invalid or expired token");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-800 via-emerald-900 to-gray-400 p-6">
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Set a new password</h1>

        {missingParams ? (
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-6">
              This reset link is missing information. Please request a new reset email.
            </p>
            <Link to="/forgot-password" className="text-yellow-50 hover:text-yellow-100 text-sm">
              Request a new reset link
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-300 text-sm text-center mb-6">
              Resetting password for <span className="text-yellow-50">{email}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-60 text-gray-900 font-semibold rounded-xl transition duration-200"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link to="/login" className="text-yellow-50 hover:text-yellow-100 text-sm">
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}