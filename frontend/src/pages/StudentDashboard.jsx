import { useState } from "react";
import API from "../api";

export default function StudentDashboard() {
  const [reason, setReason] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // ================= APPLY GATEPASS =================
  const applyGatePass = async () => {
    if (loading) return;

    setMessage("");
    setSuccess(false);

    const trimmedReason = reason.trim();
    const trimmedMobile = parentMobile.trim();

    // Validation
    if (!trimmedReason || !trimmedMobile) {
      setMessage("Reason and parent mobile are required ❌");
      return;
    }

    if (!/^\d{10}$/.test(trimmedMobile)) {
      setMessage("Enter valid 10-digit mobile number ❌");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Session expired. Please login again ❌");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post(
        "/gatepass/apply",
        {
          reason: trimmedReason,
          parent_mobile: trimmedMobile,
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

      // Reset form
      setReason("");
      setParentMobile("");

    } catch (err) {
      setSuccess(false);
      setMessage(
        err.response?.data?.message || "Server error. Try again later ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <div style={card}>

        <h2 style={title}>Student Dashboard</h2>

        <h3 style={subTitle}>Apply Gatepass</h3>

        <input
          type="text"
          placeholder="Enter reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={inputStyle}
        />

        <input
          type="tel"
          placeholder="Enter parent mobile number"
          value={parentMobile}
          onChange={(e) => setParentMobile(e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={applyGatePass}
          disabled={loading}
          style={loading ? disabledBtn : btn}
        >
          {loading ? "Applying..." : "Apply Gatepass"}
        </button>

        {message && (
          <p style={success ? successMsg : errorMsg}>
            {message}
          </p>
        )}

      </div>
    </div>
  );
}


/* ================= STYLES ================= */

const container = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0f172a",
};

const card = {
  width: "400px",
  background: "#111827",
  padding: "25px",
  borderRadius: "10px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
  color: "white",
};

const title = {
  textAlign: "center",
  marginBottom: "15px",
};

const subTitle = {
  marginBottom: "10px",
};

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

const btn = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontWeight: "600",
  cursor: "pointer",
};

const disabledBtn = {
  ...btn,
  backgroundColor: "#64748b",
  cursor: "not-allowed",
};

const successMsg = {
  marginTop: "15px",
  textAlign: "center",
  color: "#22c55e",
  fontWeight: "500",
};

const errorMsg = {
  marginTop: "15px",
  textAlign: "center",
  color: "#ef4444",
  fontWeight: "500",
};