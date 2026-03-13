import { useEffect, useState } from "react";
import API_BASE_URL from "../config";

export default function HodDashboard() {

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);

  const token = localStorage.getItem("access_token");

  useEffect(() => {

    const loadData = async () => {

      try {

        const pendingRes = await fetch(`${API_BASE_URL}/hod/pending`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const pendingData = await pendingRes.json();

        if (pendingRes.ok) {
          setPending(pendingData);
        }


        const historyRes = await fetch(`${API_BASE_URL}/hod/history`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const historyData = await historyRes.json();

        if (historyRes.ok) {
          setHistory(historyData);
        }

      } catch (error) {
        console.error("Fetch error:", error);
      }

    };

    loadData();

  }, [token]);


  const handleApprove = async (id) => {

    try {

      const res = await fetch(`${API_BASE_URL}/hod/approve/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {

        setPending(prev => prev.filter(item => item.id !== id));

      }

    } catch (error) {
      console.error("Approve error:", error);
    }

  };


  const handleReject = async (id) => {

    try {

      const res = await fetch(`${API_BASE_URL}/hod/reject/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {

        setPending(prev => prev.filter(item => item.id !== id));

      }

    } catch (error) {
      console.error("Reject error:", error);
    }

  };


  return (
    <div style={styles.page}>

      <h2 style={styles.title}>HOD Dashboard</h2>

      <h3>Pending Requests</h3>

      {pending.length === 0 && <p>No pending requests</p>}

      {pending.map(item => (

        <div key={item.id} style={styles.card}>

          <p><b>Student:</b> {item.student_name}</p>
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


      <h3 style={{ marginTop: "30px" }}>History</h3>

      {history.length === 0 && <p>No history</p>}

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