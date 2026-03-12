import { useEffect, useState } from "react";
import API_BASE_URL from "../config";

export default function HodDashboard() {

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  /* ================= FETCH PENDING ================= */

  const fetchPending = async () => {

    try {

      const res = await fetch(`${API_BASE_URL}/hod/gatepasses/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPending(data.gatepasses);
      }

    } catch (err) {
      console.error(err);
      setError("Server error");
    }

  };

  /* ================= FETCH HISTORY ================= */

  const fetchHistory = async () => {

    try {

      const res = await fetch(`${API_BASE_URL}/hod/gatepasses/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setHistory(data.gatepasses);
      }

    } catch (err) {
      console.error(err);
    }

  };

  useEffect(() => {

    fetchPending();
    fetchHistory();

  }, []);


  /* ================= APPROVE ================= */

  const approveGatepass = async (id) => {

    try {

      const res = await fetch(`${API_BASE_URL}/hod/gatepasses/approve/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchPending();
        fetchHistory();
      }

    } catch (err) {
      console.error(err);
    }

  };

  /* ================= REJECT ================= */

  const rejectGatepass = async (id) => {

    const reason = prompt("Enter rejection reason");

    if (!reason) return;

    try {

      const res = await fetch(`${API_BASE_URL}/hod/gatepasses/reject/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rejection_reason: reason
        })
      });

      if (res.ok) {
        fetchPending();
        fetchHistory();
      }

    } catch (err) {
      console.error(err);
    }

  };


  return (

    <div style={{ padding: "20px" }}>

      <h2>HOD Dashboard</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

/* ================= PENDING ================= */

      <h3>Pending Gatepasses</h3>

      {pending.length === 0 && <p>No pending requests</p>}

      {pending.map(p => (
        <div key={p.id} style={card}>

          <p><b>Student:</b> {p.student_name}</p>
          <p><b>Roll:</b> {p.college_id}</p>
          <p><b>Reason:</b> {p.reason}</p>

          <button onClick={() => approveGatepass(p.id)} style={approveBtn}>
            Approve
          </button>

          <button onClick={() => rejectGatepass(p.id)} style={rejectBtn}>
            Reject
          </button>

        </div>
      ))}

/* ================= HISTORY ================= */

      <h3 style={{ marginTop: "40px" }}>Gatepass History</h3>

      {history.length === 0 && <p>No history found</p>}

      {history.map(p => (
        <div key={p.id} style={card}>

          <p><b>Student:</b> {p.student_name}</p>
          <p><b>Roll:</b> {p.college_id}</p>
          <p><b>Reason:</b> {p.reason}</p>
          <p><b>Status:</b> {p.status}</p>

          {p.rejection_reason && (
            <p style={{ color: "red" }}>
              <b>Reason:</b> {p.rejection_reason}
            </p>
          )}

        </div>
      ))}

    </div>

  );

}

/* ================= STYLES ================= */

const card = {
  border: "1px solid #ccc",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px"
};

const approveBtn = {
  background: "#22c55e",
  border: "none",
  padding: "6px 12px",
  marginRight: "10px",
  cursor: "pointer"
};

const rejectBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 12px",
  cursor: "pointer"
};