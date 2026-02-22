import { useState } from "react";
import API_BASE_URL from "../config";

export default function ApplyGatepass() {
  const [reason, setReason] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("access_token");

  const applyGatepass = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!token) {
      setIsError(true);
      setMessage("You are not logged in. Please login again.");
      return;
    }

    if (!reason.trim() || !parentMobile.trim()) {
      setIsError(true);
      setMessage("Reason and Parent Mobile are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/gatepass/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: reason.trim(),
          parent_mobile: parentMobile.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsError(true);
        setMessage(data.message || "Failed to apply gatepass.");
        return;
      }

      setIsError(false);
      setMessage("✅ Gatepass applied successfully.");
      setReason("");
      setParentMobile("");
    } catch (err) {
      console.error("Apply Gatepass Error:", err);
      setIsError(true);
      setMessage("Server not reachable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Apply Gatepass</h2>

        <form onSubmit={applyGatepass}>
          <input
            type="text"
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={styles.input}
          />

          <input
            type="tel"
            placeholder="Parent Mobile"
            value={parentMobile}
            onChange={(e) => setParentMobile(e.target.value)}
            style={styles.input}
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Applying..." : "Apply Gatepass"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "15px",
              color: isError ? "#ef4444" : "#22c55e",
              textAlign: "center",
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
    color: "white",
  },
  card: {
    background: "#111827",
    padding: "30px",
    borderRadius: "12px",
    width: "350px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.6)",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
  },
  button: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#22c55e",
    fontWeight: "bold",
    cursor: "pointer",
  },
};