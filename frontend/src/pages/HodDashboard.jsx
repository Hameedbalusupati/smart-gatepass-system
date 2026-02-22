import { useEffect, useState } from "react";
import API_BASE_URL from "../config";

export default function HodDashboard() {
  const [passes, setPasses] = useState([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const token = localStorage.getItem("access_token");

  // =========================================
  // FETCH PENDING GATEPASSES (HOD)
  // =========================================
  const fetchPending = async () => {
    if (!token) {
      setError("Please login again");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/hod/gatepasses/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to load gatepasses");
        return;
      }

      setError("");
      setPasses(data.gatepasses || []);
    } catch (err) {
      console.error(err);
      setError("Server not reachable");
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // =========================================
  // APPROVE → FORWARD TO SECURITY
  // =========================================
  const approveGatepass = async (id) => {
    if (!window.confirm("Approve and forward to security?")) return;
    setLoadingId(id);

    try {
      const res = await fetch(
        `${API_BASE_URL}/hod/gatepasses/approve/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Approval failed");
        return;
      }

      fetchPending(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Server not reachable");
    } finally {
      setLoadingId(null);
    }
  };

  // =========================================
  // REJECT
  // =========================================
  const rejectGatepass = async (id) => {
    if (!window.confirm("Reject this gatepass?")) return;
    setLoadingId(id);

    try {
      const res = await fetch(
        `${API_BASE_URL}/hod/gatepasses/reject/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Rejection failed");
        return;
      }

      fetchPending(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Server not reachable");
    } finally {
      setLoadingId(null);
    }
  };

  // =========================================
  // UI
  // =========================================
  return (
    <div style={styles.container}>
      <h2>HOD Dashboard</h2>

      {error && <p style={styles.error}>{error}</p>}

      {!error && passes.length === 0 && (
        <p style={styles.info}>No pending gatepasses</p>
      )}

      {passes.map((p) => (
        <div key={p.id} style={styles.card}>
          <p><b>Student:</b> {p.student_name}</p>
          <p><b>College ID:</b> {p.college_id}</p>
          <p><b>Year:</b> {p.year}</p>
          <p><b>Section:</b> {p.section}</p>
          <p><b>Reason:</b> {p.reason}</p>

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
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    padding: "20px",
  },
  error: {
    color: "red",
    textAlign: "center",
  },
  info: {
    textAlign: "center",
    color: "#555",
  },
  card: {
    border: "1px solid #ccc",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
  },
  actions: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },
  approve: {
    background: "#22c55e",
    border: "none",
    padding: "6px 12px",
    cursor: "pointer",
  },
  reject: {
    background: "#ef4444",
    border: "none",
    padding: "6px 12px",
    cursor: "pointer",
    color: "white",
  },
};