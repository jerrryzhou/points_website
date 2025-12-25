import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Registration from "./pages/registration";
import AccountApprovals from "./pages/accountApprovals";
import AdminDashboard from "./pages/adminDashboard";
import { useState } from "react"

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      
      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login setToken={setToken} setUser={setUser} />
          )
        }
      />

      <Route path="/register" element={<Registration />} />

      <Route
        path="/dashboard"
        element={token ? <Dashboard /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/admin/approvals"
        element={
          token && user?.position === "admin"
            ? <AccountApprovals />
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
    </Routes>
  );
}