import { useState } from "react";
import API from "../api";

export default function StudentDashboard() {
  const [form, setForm] = useState({
    reason: "",
    parent_mobile: "",
    out_time: "",
    in_time: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= FORMAT DATE =================
  const formatDateTime = (value) => {
    if (!value) return "";
    return value + ":00";
  };

  // ================= APPLY GATEPASS =================
  const applyGatePass = async () => {
    if (loading) return;

    setMessage("");
    setSuccess(false);

    const { reason, parent_mobile, out_time, in_time } = form;

    if (!reason.trim() || !parent_mobile || !out_time || !in_time) {
      setMessage("All fields are required");
      return;
    }

    if (!/^\d{10}$/.test(parent_mobile)) {
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
        "/student/apply_gatepass", // ✅ consistent route
        {
          reason: reason.trim(),
          parent_mobile: parent_mobile,
          out_time: formatDateTime(out_time),
          in_time: formatDateTime(in_time),
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
      setForm({
        reason: "",
        parent_mobile: "",
        out_time: "",
        in_time: "",
      });

    } catch (err) {
      setSuccess(false);
      setMessage(
        err.response?.data?.message ||
        err.message ||
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

        <input
          type="datetime-local"
          name="out_time"
          value={form.out_time}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          type="datetime-local"
          name="in_time"
          value={form.in_time}
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