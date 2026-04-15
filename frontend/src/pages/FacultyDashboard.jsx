import { useEffect, useState, useCallback } from "react";
import API from "../api/api.js";

export default function FacultyDashboard() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("access_token");

  // ================= FETCH DATA =================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      if (!token) {
        setErrorMsg("Please login again");
        return;
      }

      const [res1, res2] = await Promise.all([
        API.get("/gatepass/faculty/gatepasses/pending", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        API.get("/gatepass/faculty/gatepasses/history", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setPending(res1.data?.gatepasses || []);
      setHistory(res2.data?.gatepasses || []);

    } catch (err) {
      console.error("FETCH ERROR:", err);

      if (err.response?.status === 401) {
        setErrorMsg("Session expired. Please login again.");
      } else if (err.response) {
        setErrorMsg(err.response.data?.message || "Server error");
      } else {
        setErrorMsg("Backend not reachable");
      }

      setPending([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= HANDLE ACTION =================
  const handleAction = async (id, action) => {
    try {
      setActionLoading(id);

      let payload = { action };

      if (action === "reject") {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        payload.rejection_reason = reason;
      }

      await API.post(
        `/faculty/gatepass/faculty_action/${id}`, // ✅ CORRECT URL
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // ✅ IMPORTANT FIX
          },
        }
      );

      fetchData();

    } catch (err) {
      console.error("ACTION ERROR:", err);
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ================= STATUS COLOR =================
  const getStatusColor = (status) => {
    if (status === "Approved") return "#22c55e";
    if (status === "Rejected") return "#ef4444";
    if (status === "PendingHOD") return "#f59e0b";
    if (status === "PendingFaculty") return "#3b82f6";
    return "#94a3b8";
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <h2 style={styles.title}>Faculty Dashboard</h2>

        <button onClick={fetchData} style={styles.refreshBtn}>
          {loading ? "Loading..." : "Refresh"}
        </button>

        {errorMsg && (
          <p style={{ color: "#ef4444", textAlign: "center" }}>
            {errorMsg}
          </p>
        )}

        {/* ================= PENDING ================= */}
        <h3 style={styles.section}>Pending Gatepasses</h3>

        {loading ? (
          <p>Loading...</p>
        ) : pending.length === 0 ? (
          <p>No pending requests</p>
        ) : (
          pending.map((p) => (
            <div key={p.id} style={styles.card}>

              <p><b>Student:</b> {p.student_name}</p>
              <p><b>Reason:</b> {p.reason}</p>

              <p>
                <b>Parent:</b>{" "}
                {p.parent_mobile ? (
                  <a href={`tel:${p.parent_mobile}`} style={styles.phoneLink}>
                    📞 {p.parent_mobile}
                  </a>
                ) : (
                  "Not available"
                )}
              </p>

              {/* 🔥 STUDENT PROFILE IMAGE */}
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

              {/* 🔥 GATEPASS IMAGE */}
              {p.gatepass_image && (
                <img
                  src={p.gatepass_image}
                  alt="gatepass"
                  style={styles.image}
                />
              )}

              <div style={styles.btnRow}>
                <button
                  style={styles.approve}
                  disabled={actionLoading === p.id}
                  onClick={() => handleAction(p.id, "approve")}
                >
                  {actionLoading === p.id ? "Processing..." : "Approve"}
                </button>

                <button
                  style={styles.reject}
                  disabled={actionLoading === p.id}
                  onClick={() => handleAction(p.id, "reject")}
                >
                  Reject
                </button>
              </div>

            </div>
          ))
        )}

        {/* ================= HISTORY ================= */}
        <h3 style={styles.section}>History (All Students)</h3>

        {loading ? (
          <p>Loading history...</p>
        ) : history.length === 0 ? (
          <p>No history available</p>
        ) : (
          history.map((h) => (
            <div key={h.id} style={styles.historyCard}>

              <p><b>{h.student_name}</b></p>

              <p>
                <b>Parent:</b>{" "}
                {h.parent_mobile ? (
                  <a href={`tel:${h.parent_mobile}`} style={styles.phoneLink}>
                    📞 {h.parent_mobile}
                  </a>
                ) : (
                  "Not available"
                )}
              </p>

              <p><b>Date:</b> {h.date}</p>
              <p><b>Time:</b> {h.time}</p>

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
  },
  phoneLink: {
    color: "#60a5fa",
    textDecoration: "none",
    fontWeight: "bold"
  }
};