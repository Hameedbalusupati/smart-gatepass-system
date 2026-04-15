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
import SecurityDashboard from "./pages/SecurityDashboard";
import NotificationsPage from "./pages/NotificationsPage";

// ✅ FIXED IMPORT
import ProfileUpload from "./pages/ProfileUpload";

/* ================= PROTECTED ROUTE ================= */

function ProtectedRoute({ children, role }) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  let userRole = null;

  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    userRole = user ? JSON.parse(user)?.role?.toLowerCase().trim() : null;
  }

  // ❌ Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Role mismatch
  if (role && userRole && userRole !== role) {
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

        {/* ---------- 🔥 PROFILE UPLOAD ---------- */}
        <Route
          path="/profile-upload"
          element={
            <ProtectedRoute role="student">
              <ProfileUpload />
            </ProtectedRoute>
          }
        />

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
              <SecurityDashboard />
            </ProtectedRoute>
          }
        />

        {/* ---------- NOTIFICATIONS ---------- */}
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