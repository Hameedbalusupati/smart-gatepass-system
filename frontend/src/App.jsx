import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

import StudentDashboard from "./pages/StudentDashboard";
import ApplyGatepass from "./pages/ApplyGatepass";
import StudentStatus from "./pages/StudentStatus";

import FacultyDashboard from "./pages/FacultyDashboard";
import HodDashboard from "./pages/HodDashboard";
import SecurityScan from "./pages/SecurityScan";
import NotificationsPage from "./pages/NotificationsPage";

/* ================= PROTECTED ROUTE ================= */

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("access_token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* ================= APP ================= */

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* ---------- PUBLIC ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ---------- STUDENT ---------- */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/apply-gatepass"
          element={
            <ProtectedRoute role="student">
              <ApplyGatepass />
            </ProtectedRoute>
          }
        />

        <Route
          path="/status"
          element={
            <ProtectedRoute role="student">
              <StudentStatus />
            </ProtectedRoute>
          }
        />

        {/* ---------- FACULTY ---------- */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute role="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        {/* ---------- HOD ---------- */}
        <Route
          path="/hod"
          element={
            <ProtectedRoute role="hod">
              <HodDashboard />
            </ProtectedRoute>
          }
        />

        {/* ---------- SECURITY ---------- */}
        <Route
          path="/security"
          element={
            <ProtectedRoute role="security">
              <SecurityScan />
            </ProtectedRoute>
          }
        />

        {/* ---------- NOTIFICATIONS (Protected) ---------- */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* ---------- FALLBACK ---------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}