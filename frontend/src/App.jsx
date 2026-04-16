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

import ProfileUpload from "./pages/ProfileUpload";

/* ================= HELPER ================= */
function getUser() {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

/* ================= PROTECTED ROUTE ================= */

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("access_token");
  const user = getUser();

  // ❌ Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ❌ No user data
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role?.toLowerCase()?.trim();

  // ❌ Role mismatch
  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* ================= STUDENT IMAGE GUARD ================= */

function StudentImageGuard({ children }) {
  const user = getUser();

  // 🔥 If no image → force upload
  if (!user?.profile_image && !user?.image) {
    return <Navigate to="/profile-upload" replace />;
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

        {/* ---------- PROFILE UPLOAD ---------- */}
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
              <StudentImageGuard>
                <StudentDashboard />
              </StudentImageGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/apply-gatepass"
          element={
            <ProtectedRoute role="student">
              <StudentImageGuard>
                <ApplyGatepass />
              </StudentImageGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/status"
          element={
            <ProtectedRoute role="student">
              <StudentImageGuard>
                <StudentStatus />
              </StudentImageGuard>
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