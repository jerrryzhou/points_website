import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Registration from "./pages/registration";
import AccountApprovals from "./pages/accountApprovals";
import AdminDashboard from "./pages/adminDashboard";

export default function App() {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" replace /> : <Login />}
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