import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api.js";

export default function ApplyGatepass() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    reason: "",
  });

  const [parentMobile, setParentMobile] = useState("");
  const [hasImage, setHasImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // ================= FETCH PROFILE =================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/student/profile");

        console.log("PROFILE RESPONSE:", res.data);

        const userData = res?.data?.user || {};

        setParentMobile(userData.parent_mobile || "");

        // ✅ STRONG IMAGE CHECK (ANY FIELD WITH URL)
        const imageExists = Object.values(userData).some(
          (val) =>
            typeof val === "string" &&
            (val.includes("http") || val.includes("cloudinary"))
        );

        setHasImage(imageExists);

      } catch (error) {
        console.error("Profile error:", error);
        setMessage("Failed to load profile");
        setHasImage(false);
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

    if (loading) return; // ✅ prevent double submit

    setMessage("");
    setSuccess(false);

    if (hasImage === null) {
      setMessage("Please wait, loading profile...");
      return;
    }

    if (!hasImage) {
      setMessage("Please upload profile image first");
      return;
    }

    if (!form.reason.trim()) {
      setMessage("Reason is required");
      return;
    }

    if (!parentMobile) {
      setMessage("Parent mobile not found");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/student/apply_gatepass", {
        reason: form.reason.trim(),
        parent_mobile: parentMobile,
      });

      setMessage(res.data?.message || "Gatepass applied successfully");
      setSuccess(true);

      setForm({ reason: "" });

      // ✅ redirect after success
      setTimeout(() => {
        navigate("/student-dashboard");
      }, 1500);

    } catch (error) {
      console.error("APPLY ERROR:", error);

      setSuccess(false);

      if (error.response) {
        setMessage(error.response.data?.message || "Request failed");
      } else {
        setMessage("Server not reachable");
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
          <textarea
            name="reason"
            placeholder="Reason for leaving"
            value={form.reason}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <div style={{ ...styles.input, textAlign: "center" }}>
            📞 {parentMobile || "Loading..."}
          </div>

          <button
            type="submit"
            disabled={loading || hasImage === null}
            style={{
              ...styles.button,
              backgroundColor: loading ? "#64748b" : "#22c55e",
              cursor: loading ? "not-allowed" : "pointer",
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

// ===== STYLES =====
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
  },
  message: {
    marginTop: "10px",
    textAlign: "center",
    fontWeight: "500",
  },
};