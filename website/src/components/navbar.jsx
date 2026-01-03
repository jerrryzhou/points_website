import { Link, useNavigate } from "react-router-dom";
import { isJwtExpired } from "../utils/jwt";
import { useEffect } from "react";

export default function Navbar({ setToken, setUser }) {
  const navigate = useNavigate();
   useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && isJwtExpired(token)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <span className="text-green-800 font-semibold text-2xl">ΔΣΦ</span>
      </div>

      {/* Links */}
      <div className="hidden md:flex space-x-6">
        <Link
          to="/dashboard"
          className="text-green-900 hover:text-green-700 font-medium"
        >
          Dashboard
        </Link>
        <Link
          to="/leaderboard"
          className="text-green-900 hover:text-green-700 font-medium"
        >
          Leaderboard
        </Link>
        <a href="#" className="text-green-900 hover:text-green-700 font-medium">
          Fines
        </a>
       
      </div>

      {/* Profile Icon */}
      <div className="flex items-center space-x-2">
        <button
          onClick={logout}
          className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}