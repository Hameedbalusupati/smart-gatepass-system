import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [reason, setReason] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyGatePass = async () => {
    if (loading) return;

    setMessage("");
    setSuccess(false);

    if (!reason.trim() || !parentMobile.trim()) {
      setMessage("Reason and parent mobile are required");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setMessage("Session expired. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post(
        "/gatepass/apply",
        {
          reason: reason.trim(),
          parent_mobile: parentMobile.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data;

      setMessage(data.message || "Gatepass applied successfully ✅");
      setSuccess(true);
      setReason("");
      setParentMobile("");

    } catch (err) {
      setSuccess(false);
      setMessage(
        err.response?.data?.message || "Server error. Try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>

        <h2 style={{ textAlign: "center" }}>Student Dashboard</h2>

        {/* 🔥 NEW BUTTONS */}
        <div style={buttonRow}>
          <button onClick={() => navigate("/status")} style={navBtn}>
            View Status
          </button>

          <button onClick={() => navigate("/notifications")} style={navBtn}>
            Notifications
          </button>

          <button onClick={logout} style={logoutBtn}>
            Logout
          </button>
        </div>

        <h3 style={{ marginTop: "15px" }}>Apply Gatepass</h3>

        <input
          type="text"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={inputStyle}
        />

        <input
          type="tel"
          placeholder="Parent Mobile Number"
          value={parentMobile}
          onChange={(e) => setParentMobile(e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={applyGatePass}
          disabled={loading}
          style={{
            ...applyBtn,
            backgroundColor: loading ? "#64748b" : "#22c55e",
          }}
        >
          {loading ? "Applying..." : "Apply Gatepass"}
        </button>

        {message && (
          <p style={{ ...msgStyle, color: success ? "#22c55e" : "#ef4444" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

/* ===== STYLES ===== */

const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#0f172a",
  color: "white",
};

const cardStyle = {
  width: "420px",
  background: "#111827",
  padding: "25px",
  borderRadius: "10px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
};

const buttonRow = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "10px",
};

const navBtn = {
  padding: "8px 10px",
  background: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const logoutBtn = {
  padding: "8px 10px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "6px",
  border: "1px solid #374151",
  backgroundColor: "#020617",
  color: "white",
};

const applyBtn = {
  width: "100%",
  padding: "12px",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "10px",
};

const msgStyle = {
  marginTop: "15px",
  textAlign: "center",
  fontWeight: "500",
};