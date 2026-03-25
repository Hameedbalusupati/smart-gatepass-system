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

    const cleanReason = reason.trim();
    const cleanMobile = parentMobile.trim();

    // ✅ VALIDATIONS
    if (!cleanReason || !cleanMobile) {
      setMessage("Reason and parent mobile are required ❌");
      return;
    }

    if (!/^\d{10}$/.test(cleanMobile)) {
      setMessage("Enter valid 10-digit mobile number ❌");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/gatepass/apply", {
        reason: cleanReason,
        parent_mobile: cleanMobile,
      });

      setMessage(res.data.message || "Gatepass applied successfully ✅");
      setSuccess(true);

      // ✅ RESET FORM
      setReason("");
      setParentMobile("");

      // ✅ AUTO CLEAR MESSAGE
      setTimeout(() => {
        setMessage("");
      }, 3000);

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
    <div style={styles.page}>
      <div style={styles.card}>

        <h2 style={styles.title}>Student Dashboard</h2>

        {/* 🔥 CLEAN NAVIGATION */}
        <div style={styles.buttonRow}>
          <button
            onClick={() => navigate("/status")}
            style={styles.navBtn}
          >
            View Status
          </button>

          <button
            onClick={() => navigate("/notifications")}
            style={styles.navBtn}
          >
            Notifications
          </button>
        </div>

        {/* ================= APPLY ================= */}
        <h3 style={styles.subTitle}>Apply Gatepass</h3>

        <input
          type="text"
          placeholder="Enter reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={styles.input}
        />

        <input
          type="tel"
          placeholder="Enter parent mobile number"
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

        {/* ================= MESSAGE ================= */}
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

  card: {
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
    gap: "10px",
    marginBottom: "20px",
  },

  navBtn: {
    flex: 1,
    padding: "10px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
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