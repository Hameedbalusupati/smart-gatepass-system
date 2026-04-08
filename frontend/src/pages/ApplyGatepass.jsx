import { useState } from "react";
import API from "../api";

export default function ApplyGatepass() {
  const [reason, setReason] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setMessage("");
    setSuccess(false);

    const cleanReason = reason.trim();
    const cleanMobile = parentMobile.trim();

    // ✅ VALIDATION
    if (!cleanReason || !cleanMobile) {
      setMessage("All fields are required");
      return;
    }

    if (!/^\d{10}$/.test(cleanMobile)) {
      setMessage("Enter valid 10-digit mobile number");
      return;
    }

    if (!token) {
      setMessage("Session expired. Please login again");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post(
        "/student/apply_gatepass",
        {
          reason: cleanReason,
          parent_mobile: cleanMobile,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(res.data.message || "Gatepass applied successfully");
      setSuccess(true);

      // ✅ RESET
      setReason("");
      setParentMobile("");

      setTimeout(() => setMessage(""), 3000);

    } catch (err) {
      setSuccess(false);

      if (err.response) {
        setMessage(err.response.data.message || "Error occurred");
      } else if (err.request) {
        setMessage("Server not responding");
      } else {
        setMessage("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>Apply Gatepass</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* ===== REASON ===== */}
          <textarea
            placeholder="Enter reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required   // ✅ FIXED
            style={styles.input}
          />

          {/* ===== PARENT MOBILE ===== */}
          <input
            type="tel"
            placeholder="Enter parent mobile number"
            value={parentMobile}
            onChange={(e) => setParentMobile(e.target.value)}
            required   // ✅ FIXED
            maxLength={10}
            style={styles.input}
          />

          {/* ===== BUTTON ===== */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: loading ? "#64748b" : "#22c55e",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Apply Gatepass"}
          </button>
        </form>

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
    background: "#0f172a",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    background: "#111827",
    padding: "25px",
    borderRadius: "12px",
    width: "95%",
    maxWidth: "420px",
    color: "white",
    boxShadow: "0 0 20px rgba(0,0,0,0.5)",
  },

  title: {
    textAlign: "center",
    marginBottom: "15px",
    fontSize: "22px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
    outline: "none",
  },

  button: {
    padding: "12px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontWeight: "bold",
  },

  message: {
    marginTop: "12px",
    textAlign: "center",
    fontWeight: "500",
  },
};