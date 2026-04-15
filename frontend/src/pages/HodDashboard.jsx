import { useEffect, useState } from "react";
import API from "../api/api.js";

export default function HodDashboard() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const pRes = await API.get("/hod/gatepasses/pending");
      const hRes = await API.get("/hod/gatepasses/history");

      setPending(pRes.data.gatepasses || []);
      setHistory(hRes.data.gatepasses || []);

    } catch (err) {
      console.error(err);
      setError("Server not reachable ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= APPROVE =================
  const handleApprove = async (id) => {
    try {
      await API.put(`/hod/gatepasses/approve/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Approval failed");
    }
  };

  // ================= REJECT =================
  const handleReject = async (id) => {
    const reason = prompt("Enter rejection reason");
    if (!reason) return;

    try {
      await API.put(`/hod/gatepasses/reject/${id}`, {
        rejection_reason: reason,
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Reject failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <h2 style={styles.title}>HOD Dashboard</h2>

        <button onClick={fetchData} style={styles.refresh}>
          {loading ? "Loading..." : "Refresh"}
        </button>

        {error && <p style={styles.error}>{error}</p>}

        {/* ================= PENDING ================= */}
        <h3>Pending Requests</h3>

        {pending.length === 0 && <p>No pending requests</p>}

        {pending.map((item) => (
          <div key={item.id} style={styles.card}>

            <p><b>Student:</b> {item.student_name}</p>
            <p><b>Reason:</b> {item.reason}</p>

            {/* CALL BUTTON */}
            <p>
              <b>Parent Mobile:</b>{" "}
              {item.parent_mobile ? (
                <a href={`tel:${item.parent_mobile}`} style={styles.callLink}>
                  📞 {item.parent_mobile}
                </a>
              ) : (
                "Not available"
              )}
            </p>

            <div style={styles.actions}>
              <button
                style={styles.approve}
                onClick={() => handleApprove(item.id)}
              >
                Approve
              </button>

              <button
                style={styles.reject}
                onClick={() => handleReject(item.id)}
              >
                Reject
              </button>
            </div>

          </div>
        ))}

        {/* ================= HISTORY ================= */}
        <h3 style={{ marginTop: "30px" }}>History</h3>

        {history.length === 0 && <p>No history</p>}

        {history.map((item) => (
          <div key={item.id} style={styles.card}>

            <p><b>Student:</b> {item.student_name}</p>
            <p><b>Reason:</b> {item.reason}</p>

            <p>
              <b>Parent Mobile:</b>{" "}
              {item.parent_mobile ? (
                <a href={`tel:${item.parent_mobile}`} style={styles.callLink}>
                  📞 {item.parent_mobile}
                </a>
              ) : (
                "Not available"
              )}
            </p>

            <p style={{ color: getStatusColor(item.status) }}>
              <b>Status:</b> {item.status}
            </p>

          </div>
        ))}

      </div>
    </div>
  );
}


// ================= STATUS COLOR =================
function getStatusColor(status) {
  if (status === "Approved") return "#22c55e";
  if (status === "Rejected") return "#ef4444";
  if (status === "PendingHOD") return "#f59e0b";
  return "#94a3b8";
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
    color: "white"
  },

  title: {
    textAlign: "center",
    marginBottom: "10px"
  },

  refresh: {
    background: "#3b82f6",
    border: "none",
    padding: "6px 12px",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "15px"
  },

  error: {
    color: "#ef4444",
    marginBottom: "10px"
  },

  card: {
    background: "#1f2937",
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "8px"
  },

  actions: {
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

  callLink: {
    color: "#38bdf8",
    textDecoration: "none",
    fontWeight: "bold"
  }
};