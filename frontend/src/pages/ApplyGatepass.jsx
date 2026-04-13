import { useState, useEffect } from "react";
import API from "../api";

export default function ApplyGatepass() {
  const [form, setForm] = useState({
    reason: "",
  });

  const [parentMobile, setParentMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  // ================= FETCH PROFILE =================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/student/profile");

        console.log("PROFILE DATA:", res.data);

        setParentMobile(res.data.user?.parent_mobile || "");
      } catch (err) {
        console.error("Profile error:", err);
      }
    };

    fetchProfile();
  }, []);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!form.reason.trim()) {
      setMessage("Reason is required");
      return;
    }

    if (!token) {
      setMessage("Please login again");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post(
        "/student/apply_gatepass",
        {
          reason: form.reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(res.data.message || "Gatepass applied successfully");
      setSuccess(true);

      setForm({ reason: "" });
    } catch (err) {
      setSuccess(false);
      setMessage(
        err.response?.data?.message ||
          err.message ||
          "Server error"
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
          <textarea
            name="reason"
            placeholder="Reason for leaving"
            value={form.reason}
            onChange={handleChange}
            required
            style={styles.input}
          />

          {/* 🔥 CLICKABLE PHONE (DIAL PAD) */}
          <a
            href={parentMobile ? `tel:${parentMobile}` : "#"}
            style={{
              ...styles.input,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textDecoration: "none",
              cursor: parentMobile ? "pointer" : "not-allowed",
              background: "#020617",
              border: "1px solid #334155",
            }}
          >
            📞 {parentMobile || "Loading..."}
          </a>

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