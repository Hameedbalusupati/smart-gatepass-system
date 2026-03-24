import { useEffect, useState } from "react";
import API_BASE_URL from "../config";

export default function FacultyDashboard() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  // ================= LOAD DATA (FIXED) =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const pRes = await fetch(
          `${API_BASE_URL}/faculty/gatepasses/pending`,
          { headers }
        );
        const pData = await pRes.json();

        const hRes = await fetch(
          `${API_BASE_URL}/faculty/gatepasses/history`,
          { headers }
        );
        const hData = await hRes.json();

        if (pRes.ok) setPending(pData.gatepasses || []);
        if (hRes.ok) setHistory(hData.gatepasses || []);

      } catch {
        setError("Server not reachable");
      }
    };

    fetchData();
  }, [token]);

  // ================= REFRESH =================
  const refresh = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const pRes = await fetch(
        `${API_BASE_URL}/faculty/gatepasses/pending`,
        { headers }
      );
      const pData = await pRes.json();

      const hRes = await fetch(
        `${API_BASE_URL}/faculty/gatepasses/history`,
        { headers }
      );
      const hData = await hRes.json();

      if (pRes.ok) setPending(pData.gatepasses || []);
      if (hRes.ok) setHistory(hData.gatepasses || []);

    } catch {
      setError("Server not reachable");
    }
  };

  // ================= APPROVE (FIXED URL) =================
  const approveGatepass = async (id) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/gatepass/faculty_action/${id}`, // ✅ CORRECT
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: new URLSearchParams({
            action: "approve",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Approval failed ❌");
        return;
      }

      alert("Approved ✅");
      refresh();

    } catch {
      alert("Server error");
    }
  };

  // ================= REJECT (FIXED URL) =================
  const rejectGatepass = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/gatepass/faculty_action/${id}`, // ✅ CORRECT
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: new URLSearchParams({
            action: "reject",
            rejection_reason: reason,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Reject failed ❌");
        return;
      }

      refresh();

    } catch {
      alert("Server error");
    }
  };

  // ================= UI =================
  return (
    <div style={container}>
      <div style={box}>
        <h2 style={title}>Faculty Dashboard</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <h3 style={section}>Pending Gatepasses</h3>

        {pending.length === 0 ? (
          <p style={info}>No pending requests</p>
        ) : (
          pending.map((p) => (
            <div key={p.id} style={card}>
              <p><b>Student:</b> {p.student_name}</p>
              <p><b>Reason:</b> {p.reason}</p>

              <div>
                <button style={approveBtn} onClick={() => approveGatepass(p.id)}>
                  Approve
                </button>

                <button style={rejectBtn} onClick={() => rejectGatepass(p.id)}>
                  Reject
                </button>
              </div>
            </div>
          ))
        )}

        <h3 style={section}>History</h3>

        {history.length === 0 ? (
          <p style={info}>No history available</p>
        ) : (
          history.map((p) => (
            <div key={p.id} style={historyCard}>
              <p>
                <b>{p.student_name}</b> -
                <span style={{
                  color:
                    p.status === "Approved"
                      ? "green"
                      : p.status === "Rejected"
                      ? "red"
                      : "orange"
                }}>
                  {" "}{p.status}
                </span>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/////////////////////////////////////////////////////////////////
// 🎨 STYLES
/////////////////////////////////////////////////////////////////

const container = {
  minHeight: "100vh",
  background: "#0f172a",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const box = {
  width: "500px",
  background: "#ffffff",
  padding: "20px",
  borderRadius: "12px",
};

const title = {
  textAlign: "center",
  color: "#111827",
};

const section = {
  marginTop: "20px",
  color: "#1f2937",
};

const card = {
  background: "#f9fafb",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "8px",
};

const historyCard = {
  background: "#eef2ff",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "8px",
};

const approveBtn = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "6px 12px",
  marginRight: "10px",
  cursor: "pointer",
};

const rejectBtn = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "6px 12px",
  cursor: "pointer",
};

const info = {
  color: "#6b7280",
};