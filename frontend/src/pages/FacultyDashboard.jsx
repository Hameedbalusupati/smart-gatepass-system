import { useEffect, useState } from "react";
import API from "../api";

export default function FacultyDashboard() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setLoading(true);

      const [res1, res2] = await Promise.all([
        API.get("/gatepass/faculty/gatepasses/pending"),
        API.get("/gatepass/faculty/gatepasses/history"),
      ]);

      setPending(res1.data?.gatepasses || []);
      setHistory(res2.data?.gatepasses || []);

    } catch (err) {
      console.error("FULL ERROR:", err);

      // 🔥 SHOW REAL ERROR (IMPORTANT)
      if (err.response) {
        alert(err.response.data?.message || "Server Error");
      } else {
        alert("Backend not reachable. Check Render server.");
      }

    } finally {
      setLoading(false);
    }
  };

  // ================= LOAD =================
  useEffect(() => {
    fetchData();
  }, []);

  // ================= HANDLE ACTION =================
  const handleAction = async (id, action) => {
    try {
      let payload = { action };

      if (action === "reject") {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        payload.rejection_reason = reason;
      }

      await API.post(`/gatepass/faculty_action/${id}`, payload);

      fetchData();

    } catch (err) {
      console.error("Action error:", err);
      alert(err.response?.data?.message || "Action failed");
    }
  };

  // ================= STATUS COLOR =================
  const getStatusColor = (status) => {
    if (status === "Approved") return "#22c55e";
    if (status === "Rejected") return "#ef4444";
    if (status === "PendingHOD") return "#f59e0b";
    return "#94a3b8";
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <h2 style={styles.title}>Faculty Dashboard</h2>

        <button onClick={fetchData} style={styles.refreshBtn}>
          {loading ? "Loading..." : "Refresh"}
        </button>

        {/* ================= PENDING ================= */}
        <h3 style={styles.section}>Pending Gatepasses</h3>

        {pending.length === 0 ? (
          <p>No pending requests</p>
        ) : (
          pending.map((p) => (
            <div key={p.id} style={styles.card}>
              <p><b>Student:</b> {p.student_name}</p>
              <p><b>Reason:</b> {p.reason}</p>
              <p><b>Parent:</b> {p.parent_mobile}</p>

              {/* 🔥 IMAGE SUPPORT */}
              {p.student_image && (
                <img
                  src={p.student_image}
                  alt="student"
                  style={styles.image}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/100";
                  }}
                />
              )}

              <div style={styles.btnRow}>
                <button
                  style={styles.approve}
                  onClick={() => handleAction(p.id, "approve")}
                >
                  Approve
                </button>

                <button
                  style={styles.reject}
                  onClick={() => handleAction(p.id, "reject")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}

        {/* ================= HISTORY ================= */}
        <h3 style={styles.section}>History</h3>

        {history.length === 0 ? (
          <p>No history available</p>
        ) : (
          history.map((h) => (
            <div key={h.id} style={styles.historyCard}>
              <p><b>{h.student_name}</b></p>
              <p><b>Parent:</b> {h.parent_mobile}</p>

              <p style={{ color: getStatusColor(h.status) }}>
                Status: {h.status}
              </p>
            </div>
          ))
        )}

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
    paddingTop: "30px"
  },
  container: {
    width: "450px",
    background: "#111827",
    padding: "25px",
    borderRadius: "10px",
    color: "white",
    boxShadow: "0 10px 25px rgba(0,0,0,0.6)"
  },
  title: {
    textAlign: "center",
    marginBottom: "10px"
  },
  refreshBtn: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "15px"
  },
  section: {
    marginTop: "15px",
    marginBottom: "10px"
  },
  card: {
    background: "#1f2937",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "10px"
  },
  historyCard: {
    background: "#374151",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px"
  },
  btnRow: {
    marginTop: "10px",
    display: "flex",
    gap: "10px"
  },
  approve: {
    background: "#22c55e",
    border: "none",
    padding: "6px 12px",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer"
  },
  reject: {
    background: "#ef4444",
    border: "none",
    padding: "6px 12px",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer"
  },
  image: {
    width: "100px",
    height: "100px",
    borderRadius: "8px",
    marginTop: "5px",
    objectFit: "cover"
  }
};