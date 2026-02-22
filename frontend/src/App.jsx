import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Components
import Navbar from "./components/Navbar";

// Auth
import Login from "./pages/Login";
import Register from "./pages/Register";

// Student
import StudentDashboard from "./pages/StudentDashboard";
import ApplyGatepass from "./pages/ApplyGatepass";
import StudentStatus from "./pages/StudentStatus";

// Faculty
import FacultyDashboard from "./pages/FacultyDashboard";

// HOD
import HodDashboard from "./pages/HodDashboard";

// Security
import SecurityScan from "./pages/SecurityScan";

/* ================= PROTECTED ROUTE ================= */

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("access_token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
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
        {/* -------- AUTH -------- */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* -------- STUDENT -------- */}
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

        {/* -------- FACULTY -------- */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute role="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        {/* -------- HOD -------- */}
        <Route
          path="/hod"
          element={
            <ProtectedRoute role="hod">
              <HodDashboard />
            </ProtectedRoute>
          }
        />

        {/* -------- SECURITY -------- */}
        <Route
          path="/security"
          element={
            <ProtectedRoute role="security">
              <SecurityScan />
            </ProtectedRoute>
          }
        />

        {/* -------- FALLBACK -------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}