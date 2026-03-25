import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function ApplyGatepass() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    reason: "",
    out_time: "",
    return_time: "",
    parent_mobile: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "parent_mobile") {
      if (!/^\d{0,10}$/.test(value)) return;
    }

    setForm({
      ...form,
      [name]: value
    });
  };

  // ================= VALIDATION =================
  const validateMobile = (number) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(number);
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!validateMobile(form.parent_mobile)) {
      setMessage("Enter valid 10-digit mobile number");
      return;
    }

    if (!token) {
      setMessage("Session expired. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post(
        "/gatepass/apply",
        {
          reason: form.reason.trim(),
          out_time: form.out_time,
          return_time: form.return_time,
          parent_mobile: form.parent_mobile.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(res.data.message || "Gatepass applied successfully ✅");
      setSuccess(true);

      setForm({
        reason: "",
        out_time: "",
        return_time: "",
        parent_mobile: ""
      });

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
    <div style={styles.page}>
      <div style={styles.container}>

        <h2 style={styles.title}>Apply Gatepass</h2>

        {/* 🔥 NAVIGATION BUTTONS */}
        <div style={styles.topButtons}>
          <button onClick={() => navigate("/student")} style={styles.navBtn}>
            Dashboard
          </button>

          <button onClick={() => navigate("/status")} style={styles.navBtn}>
            Status
          </button>

          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>

          <textarea
            name="reason"
            placeholder="Reason for leaving"
            value={form.reason}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <input
            type="datetime-local"
            name="out_time"
            value={form.out_time}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <input
            type="datetime-local"
            name="return_time"
            value={form.return_time}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <input
            type="tel"
            name="parent_mobile"
            placeholder="Parent Mobile Number"
            value={form.parent_mobile}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Submitting..." : "Apply Gatepass"}
          </button>

        </form>

        {message && (
          <p
            style={{
              ...styles.message,
              color: success ? "#22c55e" : "#ef4444"
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
    alignItems: "center"
  },

  container: {
    background: "#111827",
    padding: "25px",
    borderRadius: "10px",
    width: "95%",
    maxWidth: "400px",
    color: "white"
  },

  title: {
    textAlign: "center",
    marginBottom: "15px"
  },

  topButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px"
  },

  navBtn: {
    padding: "6px 10px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },

  logoutBtn: {
    padding: "6px 10px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  input: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white"
  },

  button: {
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    background: "#22c55e",
    color: "white",
    cursor: "pointer"
  },

  message: {
    marginTop: "10px",
    textAlign: "center",
    fontWeight: "500"
  }
};