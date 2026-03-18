import { useEffect, useState } from "react";
import API_BASE_URL from "../config";

export default function FacultyDashboard() {

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const token = localStorage.getItem("access_token");



  // ================= LOAD DATA =================
  useEffect(() => {

    const loadData = async () => {

      if (!token) {
        setError("Please login again");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {

        // ---------- Pending ----------
        const pendingRes = await fetch(
          `${API_BASE_URL}/faculty/gatepasses/pending`,
          { headers }
        );

        const pendingData = await pendingRes.json();

        if (pendingRes.ok) {
          setPending(pendingData.gatepasses || []);
        }

        // ---------- History ----------
        const historyRes = await fetch(
          `${API_BASE_URL}/faculty/gatepasses/history`,
          { headers }
        );

        const historyData = await historyRes.json();

        if (historyRes.ok) {
          setHistory(historyData.gatepasses || []);
        }

        setError("");

      } catch (err) {

        console.error(err);
        setError("Server not reachable");

      }

    };

    loadData();

  }, [token]);



  // ================= APPROVE =================
  const approveGatepass = async (id) => {

    if (!window.confirm("Forward gatepass to HOD?")) return;

    setLoadingId(id);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

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

      setPending(prev => prev.filter(p => p.id !== id));

    } catch {

      alert("Server not reachable");

    }

    setLoadingId(null);
  };



  // ================= REJECT =================
  const rejectGatepass = async (id) => {

    const reason = prompt("Enter rejection reason:");

    if (!reason) {
      alert("Rejection reason required");
      return;
    }

    setLoadingId(id);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {

      const res = await fetch(
        `${API_BASE_URL}/faculty/gatepasses/reject/${id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            rejection_reason: reason
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Rejection failed");
        return;
      }

      setPending(prev => prev.filter(p => p.id !== id));

    } catch {

      alert("Server not reachable");

    }

    setLoadingId(null);
  };



  // ================= UI =================
  return (
    <div style={styles.page}>

      <div style={styles.container}>

        <h2 style={styles.title}>Faculty Dashboard</h2>

        {error && <p style={styles.error}>{error}</p>}


        {/* ================= Pending ================= */}
        <h3 style={styles.section}>Pending Gatepasses</h3>

        {pending.length === 0 && (
          <p style={styles.info}>No pending requests</p>
        )}

        {pending.map(p => (
          <div key={p.id} style={styles.card}>

            <p><b>Student:</b> {p.student_name}</p>
            <p><b>College ID:</b> {p.college_id}</p>
            <p><b>Department:</b> {p.department}</p>
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



        {/* ================= History ================= */}
        <h3 style={styles.section}>Gatepass History</h3>

        {history.map(p => (

          <div key={p.id} style={styles.card}>

            <p><b>Student:</b> {p.student_name}</p>
            <p><b>College ID:</b> {p.college_id}</p>
            <p><b>Status:</b> {p.status}</p>
            <p><b>Reason:</b> {p.reason}</p>

            {p.rejected_by && (
              <>
                <p><b>Rejected By:</b> {p.rejected_by}</p>
                <p><b>Rejection Reason:</b> {p.rejection_reason}</p>
              </>
            )}

          </div>

        ))}

      </div>

    </div>
  );
}



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
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
  },

  section: {
    marginTop: "20px",
    marginBottom: "10px",
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
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },

  approve: {
    background: "#22c55e",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  reject: {
    background: "#ef4444",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  }

};