import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Registration from './pages/registration';
import AccountApprovals from './pages/accountApprovals'

export default function App() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    return (
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />

                 {/* Public Routes */}
                <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
                <Route path="/register" element={<Registration />} />

                {/* Protected Member Route */}
                <Route
                path="/dashboard"
                element={token ? <Dashboard /> : <Navigate to="/login" />}
                />

                {/* Admin-only route */}
                <Route
                path="/admin/approvals"
                element={
                    token && user?.position === "admin"
                    ? <AccountApprovals />
                    : <Navigate to="/login" />
                }
                />
            </Routes>
    )
}