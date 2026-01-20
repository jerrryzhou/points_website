import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Registration from "./pages/registration";
import AccountApprovals from "./pages/accountApprovals";
import AdminDashboard from "./pages/adminDashboard";
import Manage from "./pages/manage";
import PointApprovals from "./pages/pointApprovals";
import Leaderboard from "./pages/leaderboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PointsHistory from "./pages/pointsHistory";
import { useAuth } from "./components/protectedRoute";
import { useState } from "react"
import { AnimatePresence } from "framer-motion";

export default function App() {
  const location = useLocation();
  const { token, user } = useAuth();
  // const [token, setToken] = useState(() => localStorage.getItem("token"));
  // const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  
  

  return (
    <AnimatePresence mode = "wait">
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Navigate to="/login" replace />} />

      
      <Route
        path="/login"
        element={
          token ? (
            user?.position === "admin" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Login  setToken={token} setUser={user}/>
          )
        }
      />

      <Route path="/register" element={<Registration />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element = {<ResetPassword />}/>

      <Route 
        path="/admin/points-history"
        element={ token && user?.position === "admin" ? <PointsHistory /> : <Navigate to="/login" replace/>}
      />

      <Route
        path="/dashboard"
        element={token ? <Dashboard /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/leaderboard"
        element={token ? <Leaderboard /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/admin/approvals"
        element={
          token && user?.position === "admin"
            ? <AccountApprovals  />
            : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          token && user?.position === "admin"
            ? <AdminDashboard />
            : <Navigate to="/login" replace />
        }
      />

      <Route
      path="/admin/manage"
      element={
        token && user?.position === "admin"
        ? <Manage />
        : <Navigate to="/login" replace />
      }
      />

      <Route
      path="/admin/point-approvals"
      element={
        token && user?.position === "admin"
        ? <PointApprovals />
        : <Navigate to="/login" replace />
      }
      />
      
    </Routes>
      </AnimatePresence>
  );
}