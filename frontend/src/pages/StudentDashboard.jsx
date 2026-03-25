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

  // ================= APPLY GATEPASS =================
  const applyGatePass = async () => {
    if (loading) return;

    setMessage("");
    setSuccess(false);

    if (!reason.trim() || !parentMobile.trim()) {
      setMessage("Reason and parent mobile are required");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/gatepass/apply", {
        reason: reason.trim(),
        parent_mobile: parentMobile.trim(),
      });

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
    <div style={styles.page}>
      <div style={styles.container}>
        
        <h2 style={styles.title}>Student Dashboard</h2>

        {/* ===== ACTION BUTTONS ===== */}
        <div style={styles.buttonRow}>
          <button onClick={() => navigate("/status")} style={styles.navBtn}>
            View Status
          </button>

          <button onClick={() => navigate("/notifications")} style={styles.navBtn}>
            Notifications
          </button>
        </div>

        {/* ===== FORM ===== */}
        <h3 style={styles.subTitle}>Apply Gatepass</h3>

        <input
          type="text"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={styles.input}
        />

        <input
          type="tel"
          placeholder="Parent Mobile Number"
          value={parentMobile}
          onChange={(e) => setParentMobile(e.target.value)}
          style={styles.input}
        />

        <button
          onClick={applyGatePass}
          disabled={loading}
          style={{
            ...styles.applyBtn,
            backgroundColor: loading ? "#64748b" : "#22c55e",
          }}
        >
          {loading ? "Applying..." : "Apply Gatepass"}
        </button>

        {/* ===== MESSAGE ===== */}
        {message && (
          <p
            style={{
              ...styles.message,
              color: success ? "#22c55e" : "#ef4444",
            }}
          >
            {message}
          </p>
        )}

      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
    color: "white",
  },

  container: {
    width: "420px",
    background: "#111827",
    padding: "25px",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
  },

  title: {
    textAlign: "center",
    marginBottom: "15px",
  },

  buttonRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },

  navBtn: {
    padding: "8px 12px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
  },

  subTitle: {
    marginBottom: "10px",
  },

  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #374151",
    backgroundColor: "#020617",
    color: "white",
    outline: "none",
  },

  applyBtn: {
    width: "100%",
    padding: "12px",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },

  message: {
    marginTop: "15px",
    textAlign: "center",
    fontWeight: "500",
  },
};