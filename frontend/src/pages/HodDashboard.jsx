import { useEffect, useState } from "react";
import API_BASE_URL from "../config";
import "./HodDashboard.css";

export default function HodDashboard() {

  const [passes, setPasses] = useState([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const token = localStorage.getItem("access_token");


  // =================================================
  // FETCH PENDING GATEPASSES
  // =================================================
  useEffect(() => {

    let isMounted = true;

    const loadGatepasses = async () => {

      if (!token) {
        if (isMounted) {
          setError("Please login again");
          setLoadingPage(false);
        }
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
          if (isMounted) {
            setError(data.message || "Failed to load gatepasses");
            setLoadingPage(false);
          }
          return;
        }

        if (isMounted) {
          setPasses(data.gatepasses || []);
          setError("");
          setLoadingPage(false);
        }

      } catch (err) {

        console.error(err);

        if (isMounted) {
          setError("Server not reachable");
          setLoadingPage(false);
        }

      }
    };

    loadGatepasses();

    return () => {
      isMounted = false;
    };

  }, [token]);



  // =================================================
  // APPROVE GATEPASS
  // =================================================
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

        // remove approved item
        setPasses((prev) => prev.filter((p) => p.id !== id));

      }

    } catch (err) {

      console.error(err);
      alert("Server error");

    }

    setLoadingId(null);
  };



  // =================================================
  // REJECT GATEPASS
  // =================================================
  const rejectGatepass = async (id) => {

    const reason = prompt("Enter rejection reason:");

    if (!reason) {
      alert("Rejection reason required");
      return;
    }

    setLoadingId(id);

    try {

      const res = await fetch(
        `${API_BASE_URL}/hod/gatepasses/reject/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rejection_reason: reason,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Rejection failed");
      } else {

        // remove rejected item
        setPasses((prev) => prev.filter((p) => p.id !== id));

      }

    } catch (err) {

      console.error(err);
      alert("Server error");

    }

    setLoadingId(null);
  };



  // =================================================
  // UI
  // =================================================
  return (
    <div className="hod-container">

      <h2 className="hod-title">HOD Dashboard</h2>

      {loadingPage && (
        <p className="no-data">Loading gatepasses...</p>
      )}

      {error && (
        <p className="error-message">{error}</p>
      )}

      {!loadingPage && !error && passes.length === 0 && (
        <p className="no-data">No pending gatepasses</p>
      )}

      {passes.map((p) => (

        <div key={p.id} className="gatepass-card">

          <div className="student-name">{p.student_name}</div>

          <div className="gatepass-info">
            <b>College ID:</b> {p.college_id}
          </div>

          <div className="gatepass-info">
            <b>Department:</b> {p.department}
          </div>

          <div className="gatepass-info">
            <b>Year:</b> {p.year}
          </div>

          <div className="gatepass-info">
            <b>Section:</b> {p.section}
          </div>

          <div className="gatepass-info">
            <b>Reason:</b> {p.reason}
          </div>

          <div className="hod-actions">

            <button
              className="approve-btn"
              disabled={loadingId === p.id}
              onClick={() => approveGatepass(p.id)}
            >
              {loadingId === p.id ? "Processing..." : "Approve"}
            </button>

            <button
              className="reject-btn"
              disabled={loadingId === p.id}
              onClick={() => rejectGatepass(p.id)}
            >
              Reject
            </button>

          </div>

        </div>

      ))}

    </div>
  );
}