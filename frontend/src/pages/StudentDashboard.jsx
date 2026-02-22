import { useState } from "react";
import API from "../api";

export default function StudentDashboard() {
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
        "/gatepass/apply", // ✅ API baseURL already includes /api
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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0f172a",
        color: "white",
      }}
    >
      <div
        style={{
          width: "420px",
          background: "#111827",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Student Dashboard
        </h2>

        <h3 style={{ marginBottom: "10px" }}>Apply Gatepass</h3>

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
            width: "100%",
            padding: "12px",
            backgroundColor: loading ? "#64748b" : "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "10px",
          }}
        >
          {loading ? "Applying..." : "Apply Gatepass"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "15px",
              textAlign: "center",
              color: success ? "#22c55e" : "#ef4444",
              fontWeight: "500",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

/* ===== INPUT STYLE ===== */
const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "1px solid #374151",
  backgroundColor: "#020617",
  color: "white",
  outline: "none",
};