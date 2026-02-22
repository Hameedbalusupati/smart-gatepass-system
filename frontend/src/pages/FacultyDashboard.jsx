import { useEffect, useState } from "react";
import API_BASE_URL from "../config";

export default function FacultyDashboard() {
  const [passes, setPasses] = useState([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ================= FETCH PENDING =================
  const fetchPending = async () => {
    if (!token) {
      setError("Please login again");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/faculty/gatepasses/pending`,
        { headers }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to load gatepasses");
        return;
      }

      setError("");
      setPasses(data.gatepasses || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Server not reachable");
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // ================= APPROVE =================
  const approveGatepass = async (id) => {
    if (!window.confirm("Forward gatepass to HOD?")) return;

    setLoadingId(id);

    try {
      const res = await fetch(
        `${API_BASE_URL}/faculty/gatepasses/approve/${id}`,
        {
          method: "PUT",
          headers,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Approval failed");
        return;
      }

      fetchPending();
    } catch (err) {
      console.error("Approve Error:", err);
      alert("Server not reachable");
    } finally {
      setLoadingId(null);
    }
  };

  // ================= REJECT =================
  const rejectGatepass = async (id) => {
    if (!window.confirm("Reject this gatepass?")) return;

    setLoadingId(id);

    try {
      const res = await fetch(
        `${API_BASE_URL}/faculty/gatepasses/reject/${id}`,
        {
          method: "PUT",
          headers,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Rejection failed");
        return;
      }

      fetchPending();
    } catch (err) {
      console.error("Reject Error:", err);
      alert("Server not reachable");
    } finally {
      setLoadingId(null);
    }
  };

  // ================= UI =================
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>Faculty Dashboard</h2>

        {error && <p style={styles.error}>{error}</p>}

        {!error && passes.length === 0 && (
          <p style={styles.info}>No pending gatepasses</p>
        )}

        {passes.map((p) => (
          <div key={p.id} style={styles.card}>
            <p><b>Student:</b> {p.student_name}</p>
            <p><b>College ID:</b> {p.college_id}</p>
            <p><b>Department:</b> {p.department || "-"}</p>
            <p><b>Year:</b> {p.year}</p>
            <p><b>Section:</b> {p.section}</p>
            <p><b>Reason:</b> {p.reason}</p>
            <p><b>Parent Mobile:</b> {p.parent_mobile}</p>

            <div style={styles.actions}>
              <button
                onClick={() => approveGatepass(p.id)}
                disabled={loadingId === p.id}
                style={styles.approve}
              >
                {loadingId === p.id ? "Processing..." : "Approve"}
              </button>

              <button
                onClick={() => rejectGatepass(p.id)}
                disabled={loadingId === p.id}
                style={styles.reject}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= STYLES =================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#f8fafc",
  },
  container: {
    width: "95%",
    maxWidth: "900px",
    background: "#111827",
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.6)",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  error: {
    color: "#ef4444",
    textAlign: "center",
  },
  info: {
    textAlign: "center",
  },
  card: {
    background: "#020617",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "15px",
    marginBottom: "15px",
  },
  actions: {
    marginTop: "12px",
    display: "flex",
    gap: "10px",
  },
  approve: {
    background: "#22c55e",
    color: "#020617",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  reject: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};