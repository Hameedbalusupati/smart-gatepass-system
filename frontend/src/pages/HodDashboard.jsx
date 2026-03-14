import { useEffect, useState } from "react";
import API_BASE_URL from "../config";

export default function HodDashboard() {

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);

  const token = localStorage.getItem("access_token");

  // ================= FETCH DATA =================

  useEffect(() => {

    const loadData = async () => {

      try {

        // ---------- Pending Gatepasses ----------

        const pendingRes = await fetch(
          `${API_BASE_URL}/hod/gatepasses/pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const pendingData = await pendingRes.json();

        if (pendingRes.ok && pendingData.success) {
          setPending(pendingData.gatepasses || []);
        } else {
          setPending([]);
        }


        // ---------- History ----------

        const historyRes = await fetch(
          `${API_BASE_URL}/hod/gatepasses/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const historyData = await historyRes.json();

        if (historyRes.ok && historyData.success) {
          setHistory(historyData.gatepasses || []);
        } else {
          setHistory([]);
        }

      } catch (error) {

        console.error("Fetch error:", error);

      }

    };

    loadData();

  }, [token]);



  // ================= APPROVE =================

  const handleApprove = async (id) => {

    try {

      const res = await fetch(
        `${API_BASE_URL}/hod/gatepasses/approve/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {

        setPending(prev => prev.filter(item => item.id !== id));

      }

    } catch (error) {

      console.error("Approve error:", error);

    }

  };


  // ================= REJECT =================

  const handleReject = async (id) => {

    const reason = prompt("Enter rejection reason");

    if (!reason) return;

    try {

      const res = await fetch(
        `${API_BASE_URL}/hod/gatepasses/reject/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ rejection_reason: reason })
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {

        setPending(prev => prev.filter(item => item.id !== id));

      }

    } catch (error) {

      console.error("Reject error:", error);

    }

  };


  return (

    <div style={styles.page}>

      <h2 style={styles.title}>HOD Dashboard</h2>


      {/* ================= PENDING ================= */}

      <h3>Pending Requests</h3>

      {pending.length === 0 && (
        <p>No pending requests</p>
      )}

      {pending.map(item => (

        <div key={item.id} style={styles.card}>

          <p><b>Student:</b> {item.student_name}</p>
          <p><b>College ID:</b> {item.college_id}</p>
          <p><b>Department:</b> {item.department}</p>
          <p><b>Year:</b> {item.year}</p>
          <p><b>Section:</b> {item.section}</p>
          <p><b>Reason:</b> {item.reason}</p>

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

      {history.length === 0 && (
        <p>No history</p>
      )}

      {history.map(item => (

        <div key={item.id} style={styles.card}>

          <p><b>Student:</b> {item.student_name}</p>
          <p><b>Reason:</b> {item.reason}</p>
          <p><b>Status:</b> {item.status}</p>

        </div>

      ))}

    </div>

  );
}



/* ================= STYLES ================= */

const styles = {

  page: {
    padding: "20px",
    minHeight: "100vh",
    background: "#0f172a",
    color: "white"
  },

  title: {
    marginBottom: "20px"
  },

  card: {
    background: "#111827",
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
  }

};