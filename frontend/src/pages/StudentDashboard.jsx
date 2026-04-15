import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    reason: "",
    parent_mobile: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Get user from localStorage
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user"))
      : null;

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= APPLY GATEPASS =================
  const applyGatePass = async () => {
    if (loading) return;

    setMessage("");
    setSuccess(false);

    // 🔥 PROFILE IMAGE CHECK (MAIN FIX)
    if (!user?.image) {
      setMessage("Please upload profile image first");
      navigate("/profile-upload");
      return;
    }

    const { reason, parent_mobile } = form;

    // ✅ VALIDATION
    if (!reason.trim() || !parent_mobile) {
      setMessage("Reason and parent mobile are required");
      return;
    }

    // ✅ MOBILE VALIDATION
    if (!/^\d{10}$/.test(parent_mobile)) {
      setMessage("Enter valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);

      // ✅ NO NEED TOKEN (handled by interceptor)
      const res = await API.post("/student/apply_gatepass", {
        reason: reason.trim(),
        parent_mobile: parent_mobile,
      });

      setMessage(res.data.message || "Gatepass applied successfully");
      setSuccess(true);

      // RESET FORM
      setForm({
        reason: "",
        parent_mobile: "",
      });

    } catch (error) {
      setSuccess(false);
      setMessage(
        error.response?.data?.message ||
        error.message ||
        "Server error. Try again later"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Student Dashboard</h2>

        <h3 style={styles.subTitle}>Apply Gatepass</h3>

        <input
          type="text"
          name="reason"
          placeholder="Enter reason"
          value={form.reason}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          type="tel"
          name="parent_mobile"
          placeholder="Enter parent mobile number"
          value={form.parent_mobile}
          onChange={handleChange}
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
    marginBottom: "20px",
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