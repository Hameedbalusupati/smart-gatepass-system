import { useEffect, useState } from "react";
import API_BASE_URL from "../config";
import "./HodDashboard.css";

export default function HodDashboard() {
  const [passes, setPasses] = useState([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    let isMounted = true;

    const fetchPending = async () => {
      if (!token) {
        if (isMounted) setError("Please login again");
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/hod/gatepasses/pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          if (isMounted) setError(data.message || "Failed to load");
          return;
        }

        if (isMounted) {
          setPasses(data.gatepasses || []);
          setError("");
        }
      } catch {
        if (isMounted) setError("Server not reachable");
      }
    };

    fetchPending();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const approveGatepass = async (id) => {
    if (!window.confirm("Approve this gatepass?")) return;

    setLoadingId(id);

    try {
      const res = await fetch(
        `${API_BASE_URL}/hod/gatepasses/approve/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Approval failed");
      } else {
        setPasses((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      alert("Server error");
    }

    setLoadingId(null);
  };

  return (
    <div className="hod-container">
      <h2 className="hod-title">HOD Dashboard</h2>

      {error && <p className="error-message">{error}</p>}

      {!error && passes.length === 0 && (
        <p className="no-data">No pending gatepasses</p>
      )}

      {passes.map((p) => (
        <div key={p.id} className="gatepass-card">
          <div className="student-name">{p.student_name}</div>
          <div className="gatepass-info">College ID: {p.college_id}</div>
          <div className="gatepass-info">Department: {p.department}</div>
          <div className="gatepass-info">Year: {p.year}</div>
          <div className="gatepass-info">Section: {p.section}</div>
          <div className="gatepass-info">Reason: {p.reason}</div>

          <button
            className="action-btn"
            disabled={loadingId === p.id}
            onClick={() => approveGatepass(p.id)}
          >
            {loadingId === p.id ? "Processing..." : "Approve"}
          </button>
        </div>
      ))}
    </div>
  );
}