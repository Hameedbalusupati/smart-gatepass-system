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

      // ✅ JSON REQUEST (NO IMAGE, NO TIME)
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

      // RESET
      setReason("");
      setParentMobile("");

    } catch (err) {
      setSuccess(false);
      setMessage(
        err.response?.data?.message || "Server error. Try again later"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>Apply Gatepass</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Reason */}
          <textarea
            placeholder="Reason for leaving"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={styles.input}
          />

          {/* Parent Mobile */}
          <input
            type="tel"
            placeholder="Parent Mobile Number"
            value={parentMobile}
            onChange={(e) => setParentMobile(e.target.value)}
            required
            style={styles.input}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: loading ? "#64748b" : "#22c55e",
            }}
          >
            {loading ? "Submitting..." : "Apply Gatepass"}
          </button>
        </form>

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

/* ===== STYLES ===== */

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
    borderRadius: "10px",
    width: "95%",
    maxWidth: "400px",
    color: "white",
  },

  title: {
    textAlign: "center",
    marginBottom: "15px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
  },

  button: {
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    color: "white",
    cursor: "pointer",
  },

  message: {
    marginTop: "10px",
    textAlign: "center",
    fontWeight: "500",
  },
};