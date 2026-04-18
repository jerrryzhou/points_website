import { Link, useNavigate } from "react-router-dom";
import { isJwtExpired } from "../utils/jwt";
import { useEffect, useState } from "react";
import { useAuth } from "./protectedRoute";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"))

  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && isJwtExpired(token)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      logout();
      navigate("/login", { replace: true });
    }
  }, [navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-emerald-50 border-b border-emerald-100 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <span className="text-green-800 font-semibold text-2xl">ΔΣΦ</span>

        {/* Desktop links */}
        <div className="hidden md:flex space-x-6">
          <Link to="/dashboard" className="text-green-900 hover:text-green-700 font-medium">Dashboard</Link>
          <Link to="/leaderboard" className="text-green-900 hover:text-green-700 font-medium">Leaderboard</Link>
          <Link to="/calendar" className="text-green-900 hover:text-green-700 font-medium">Calendar</Link>
          {user?.position === "position-holder" && (
            <Link to="/points-given" className="text-green-900 hover:text-green-700 font-medium">Points Given</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition"
          >
            Logout
          </button>
          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className="block w-6 h-0.5 bg-green-800" />
            <span className="block w-6 h-0.5 bg-green-800" />
            <span className="block w-6 h-0.5 bg-green-800" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-3 pt-3 pb-1">
          <Link to="/dashboard" className="text-green-900 hover:text-green-700 font-medium" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/leaderboard" className="text-green-900 hover:text-green-700 font-medium" onClick={() => setMenuOpen(false)}>Leaderboard</Link>
          <Link to="/calendar" className="text-green-900 hover:text-green-700 font-medium" onClick={() => setMenuOpen(false)}>Calendar</Link>
          {user?.position === "position-holder" && (
            <Link to="/points-given" className="text-green-900 hover:text-green-700 font-medium" onClick={() => setMenuOpen(false)}>Points Given</Link>
          )}
        </div>
      )}
    </nav>
  );
}