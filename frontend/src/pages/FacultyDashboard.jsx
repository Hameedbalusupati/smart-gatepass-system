import { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import API_BASE_URL from "../config";

export default function FacultyDashboard() {

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const webcamRef = useRef(null);
  const token = localStorage.getItem("access_token");

  // ================= LOAD DATA =================
  useEffect(() => {
    const loadData = async () => {

      if (!token) {
        setError("Please login again");
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const pendingRes = await fetch(
          `${API_BASE_URL}/faculty/gatepasses/pending`,
          { headers }
        );

        const pendingData = await pendingRes.json();
        if (pendingRes.ok) setPending(pendingData.gatepasses || []);

        const historyRes = await fetch(
          `${API_BASE_URL}/faculty/gatepasses/history`,
          { headers }
        );

        const historyData = await historyRes.json();
        if (historyRes.ok) setHistory(historyData.gatepasses || []);

        setError("");

      } catch (err) {
        console.error(err);
        setError("Server not reachable");
      }
    };

    loadData();
  }, [token]);


  // ================= OPEN CAMERA =================
  const openCamera = (id) => {
    if (!id) return;
    setSelectedId(id);
    setShowCamera(true);
  };


  // ================= CAPTURE & APPROVE =================
  const captureAndApprove = async () => {

    if (!webcamRef.current) {
      alert("Camera not ready ❌");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      alert("Failed to capture image ❌");
      return;
    }

    try {
      const blob = await (await fetch(imageSrc)).blob();

      const formData = new FormData();
      formData.append("live_image", blob, "capture.jpg");

      setLoadingId(selectedId);

      const res = await fetch(
        `${API_BASE_URL}/faculty/gatepasses/approve/${selectedId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Approval failed ❌");
        return;
      }

      // Move to history safely
      const approvedItem = pending.find(p => p.id === selectedId);
      if (approvedItem) {
        setHistory(prev => [
          { ...approvedItem, status: "PendingHOD" },
          ...prev
        ]);
      }

      setPending(prev => prev.filter(p => p.id !== selectedId));

      alert("Approved successfully ✅");

    } catch (err) {
      console.error(err);
      alert("Error during approval ❌");
    }

    setLoadingId(null);
    setShowCamera(false);
  };


  // ================= REJECT =================
  const rejectGatepass = async (id) => {

    const reason = prompt("Enter rejection reason:");

    if (!reason) {
      alert("Rejection reason required");
      return;
    }

    setLoadingId(id);

    try {
      const res = await fetch(
        `${API_BASE_URL}/faculty/gatepasses/reject/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rejection_reason: reason })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Rejection failed");
        return;
      }

      const rejectedItem = pending.find(p => p.id === id);
      if (rejectedItem) {
        setHistory(prev => [
          { ...rejectedItem, status: "Rejected" },
          ...prev
        ]);
      }

      setPending(prev => prev.filter(p => p.id !== id));

    } catch (err) {
      console.error(err);
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

        {/* CAMERA */}
        {showCamera && (
          <div style={styles.cameraBox}>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              onUserMediaError={() => {
                alert("Camera permission denied ❌");
                setShowCamera(false);
              }}
              style={{ width: "100%" }}
            />

            <button
              style={styles.approve}
              onClick={captureAndApprove}
            >
              Capture & Approve
            </button>
          </div>
        )}

        {/* ================= PENDING ================= */}
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

            <div style={styles.actions}>
              <button
                onClick={() => openCamera(p.id)}
                disabled={loadingId === p.id}
                style={styles.approve}
              >
                Approve
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

        {/* ================= HISTORY ================= */}
        <h3 style={styles.section}>Gatepass History</h3>

        {history.length === 0 && (
          <p style={styles.info}>No history available</p>
        )}

        {history.map(p => (
          <div key={p.id} style={styles.card}>
            <p><b>Student:</b> {p.student_name}</p>
            <p><b>Status:</b> {p.status}</p>
            <p><b>Reason:</b> {p.reason}</p>
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
  },
  section: {
    marginTop: "20px",
  },
  error: {
    color: "red",
    textAlign: "center",
  },
  info: {
    textAlign: "center",
  },
  card: {
    background: "#020617",
    padding: "15px",
    marginTop: "10px",
    borderRadius: "10px",
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
    cursor: "pointer",
  },
  reject: {
    background: "#ef4444",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
  },
  cameraBox: {
    marginBottom: "20px",
    border: "2px solid #334155",
    padding: "10px",
    borderRadius: "10px",
  }
};