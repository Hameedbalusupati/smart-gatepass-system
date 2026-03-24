import { useEffect, useState } from "react";
import API_BASE_URL from "../config";

export default function HodDashboard() {

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  // ================= LOAD DATA =================
  useEffect(() => {

    const fetchData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`
        };

        const pRes = await fetch(
          `${API_BASE_URL}/hod/gatepasses/pending`,
          { headers }
        );
        const pData = await pRes.json();

        const hRes = await fetch(
          `${API_BASE_URL}/hod/gatepasses/history`,
          { headers }
        );
        const hData = await hRes.json();

        if (pRes.ok && pData.success) {
          setPending(pData.gatepasses || []);
        }

        if (hRes.ok && hData.success) {
          setHistory(hData.gatepasses || []);
        }

      } catch {
        setError("Server not reachable");
      }
    };

    fetchData();

  }, [token]);



  // ================= APPROVE =================
  const handleApprove = async (id) => {

    try {
      const res = await fetch(
        `${API_BASE_URL}/gatepass/hod_action/${id}`,   // ✅ FIXED
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ action: "approve" })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Approval failed ❌");
        return;
      }

      alert("Approved ✅");

      // refresh UI
      setPending(prev => prev.filter(item => item.id !== id));

    } catch {
      alert("Server error");
    }
  };


  // ================= REJECT =================
  const handleReject = async (id) => {

    const reason = prompt("Enter rejection reason");
    if (!reason) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/gatepass/hod_action/${id}`,   // ✅ FIXED
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "reject",
            rejection_reason: reason
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Reject failed ❌");
        return;
      }

      setPending(prev => prev.filter(item => item.id !== id));

    } catch {
      alert("Server error");
    }
  };


  return (

    <div style={styles.page}>

      <h2 style={styles.title}>HOD Dashboard</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

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

          {/* ✅ NEW FIELD */}
          <p>
            <b>Parent Mobile:</b>{" "}
            <a href={`tel:${item.parent_mobile}`} style={{ color: "#60a5fa" }}>
              {item.parent_mobile}
            </a>
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

      {history.length === 0 && (
        <p>No history</p>
      )}

      {history.map(item => (

        <div key={item.id} style={styles.card}>

          <p><b>Student:</b> {item.student_name}</p>
          <p><b>Reason:</b> {item.reason}</p>

          {/* ✅ NEW FIELD */}
          <p>
            <b>Parent Mobile:</b>{" "}
            <a href={`tel:${item.parent_mobile}`} style={{ color: "#60a5fa" }}>
              {item.parent_mobile}
            </a>
          </p>

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