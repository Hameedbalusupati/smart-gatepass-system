import { useEffect, useState } from "react";
import API_BASE_URL from "../config";

export default function FacultyDashboard() {

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const token = localStorage.getItem("access_token");


  // ================= CAMERA FUNCTION =================
  const captureImage = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      const video = document.createElement("video");
      video.srcObject = stream;

      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, 300, 300);

      // stop camera
      stream.getTracks().forEach(track => track.stop());

      return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), "image/jpeg");
      });

    } catch (err) {
      alert("Camera access denied or not available");
      return null;
    }
  };


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


  // ================= APPROVE (WITH FACE) =================
  const approveGatepass = async (id) => {

    if (!window.confirm("Show your face to approve gatepass")) return;

    setLoadingId(id);

    try {

      // 📸 Capture face
      const imageBlob = await captureImage();

      if (!imageBlob) {
        setLoadingId(null);
        return;
      }

      const formData = new FormData();
      formData.append("image", imageBlob);

      const res = await fetch(
        `${API_BASE_URL}/faculty/gatepasses/approve/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Face verification failed");
        setLoadingId(null);
        return;
      }

      alert("Gatepass forwarded to HOD ✅");

      setPending(prev => prev.filter(p => p.id !== id));

    } catch (err) {
      console.error(err);
      alert("Camera or server error");
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

    try {

      const res = await fetch(
        `${API_BASE_URL}/faculty/gatepasses/reject/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rejection_reason: reason
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Rejection failed");
        setLoadingId(null);
        return;
      }

      alert("Gatepass rejected ❌");

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


// ================= STYLES =================
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