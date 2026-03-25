import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function FacultyDashboard() {
  const navigate = useNavigate();

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  // ================= LOAD DATA =================
  const fetchData = async () => {
    try {
      setLoading(true);

      const pRes = await API.get("/faculty/gatepasses/pending");
      const hRes = await API.get("/faculty/gatepasses/history");

      setPending(pRes.data.gatepasses || []);
      setHistory(hRes.data.gatepasses || []);

    } catch (err) {
      console.error(err);
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, []);

  // ================= APPROVE =================
  const approveGatepass = async (id) => {
    try {
      await API.post(`/gatepass/faculty_action/${id}`, {
        action: "approve"
      });

      alert("Approved ✅");
      fetchData();

    } catch (err) {
      alert(err.response?.data?.message || "Approval failed ❌");
    }
  };

  // ================= REJECT =================
  const rejectGatepass = async (id) => {
    const reason = prompt("Enter rejection reason");
    if (!reason) return;

    try {
      await API.post(`/gatepass/faculty_action/${id}`, {
        action: "reject",
        rejection_reason: reason
      });

      alert("Rejected ❌");
      fetchData();

    } catch (err) {
      alert(err.response?.data?.message || "Reject failed ❌");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ================= UI =================
  return (
    <div style={container}>
      <div style={box}>

        <h2 style={title}>Faculty Dashboard</h2>

        {/* 🔥 NAVIGATION BUTTONS */}
        <div style={topButtons}>
          <button onClick={fetchData} style={navBtn}>Refresh</button>
          <button onClick={logout} style={logoutBtn}>Logout</button>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* ================= PENDING ================= */}
        <h3 style={section}>Pending Gatepasses</h3>

        {loading ? (
          <p>Loading...</p>
        ) : pending.length === 0 ? (
          <p style={info}>No pending requests</p>
        ) : (
          pending.map((p) => (
            <div key={p.id} style={card}>

              <p><b>Student:</b> {p.student_name}</p>
              <p><b>Reason:</b> {p.reason}</p>

              {/* ✅ FIXED MOBILE */}
              <p>
                <b>Parent Mobile:</b>{" "}
                {p.parent_mobile || p.parentMobile || "N/A"}
              </p>

              <div style={{ marginTop: "10px" }}>
                <button
                  style={approveBtn}
                  onClick={() => approveGatepass(p.id)}
                >
                  Approve
                </button>

                <button
                  style={rejectBtn}
                  onClick={() => rejectGatepass(p.id)}
                >
                  Reject
                </button>
              </div>

            </div>
          ))
        )}

        {/* ================= HISTORY ================= */}
        <h3 style={section}>History</h3>

        {history.length === 0 ? (
          <p style={info}>No history available</p>
        ) : (
          history.map((p) => (
            <div key={p.id} style={historyCard}>

              <p><b>{p.student_name}</b></p>

              {/* ✅ FIXED MOBILE */}
              <p>
                <b>Parent Mobile:</b>{" "}
                {p.parent_mobile || p.parentMobile || "N/A"}
              </p>

              <p>
                Status:{" "}
                <span
                  style={{
                    color:
                      p.status === "Approved"
                        ? "green"
                        : p.status === "Rejected"
                        ? "red"
                        : "orange"
                  }}
                >
                  {p.status}
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
  alignItems: "center"
};

const box = {
  width: "500px",
  background: "#ffffff",
  padding: "20px",
  borderRadius: "12px"
};

const title = {
  textAlign: "center",
  color: "#111827"
};

const section = {
  marginTop: "20px",
  color: "#1f2937"
};

const card = {
  background: "#f9fafb",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "8px"
};

const historyCard = {
  background: "#eef2ff",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "8px"
};

const approveBtn = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "6px 12px",
  marginRight: "10px",
  cursor: "pointer"
};

const rejectBtn = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "6px 12px",
  cursor: "pointer"
};

const info = {
  color: "#6b7280"
};

const topButtons = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px"
};

const navBtn = {
  padding: "6px 10px",
  background: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};

const logoutBtn = {
  padding: "6px 10px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};