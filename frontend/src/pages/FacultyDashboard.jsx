import { useEffect, useState, useRef } from "react";
import "../index.css";
import API_BASE_URL from "../config";

export default function FacultyDashboard() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const token = localStorage.getItem("access_token");

  // ================= LOAD DATA =================
  const loadData = async () => {
    try {
      if (!token) {
        setError("Login required");
        return;
      }

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

  useEffect(() => {
    loadData();

    // cleanup camera on unmount
    return () => stopCamera();
  }, []);

  // ================= STOP CAMERA =================
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // ================= OPEN CAMERA =================
  const openCamera = async (id) => {
    setSelectedId(id);
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };
    } catch {
      alert("Camera not supported. Use HTTPS or real device.");
      setShowCamera(false);
    }
  };

  // ================= CAPTURE & APPROVE =================
  const captureAndApprove = async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        alert("Camera error ❌");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg")
      );

      if (!blob) {
        alert("Image capture failed ❌");
        return;
      }

      const formData = new FormData();
      formData.append("action", "approve");
      formData.append("live_image", blob, "capture.jpg");

      const res = await fetch(
        `${API_BASE_URL}/gatepass/faculty_action/${selectedId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Approval failed ❌");
        return;
      }

      alert("Approved successfully ✅");

      // refresh data
      await loadData();

    } catch (err) {
      console.error(err);
      alert("Error ❌");
    } finally {
      stopCamera();
      setShowCamera(false);
    }
  };

  // ================= REJECT =================
  const rejectGatepass = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/gatepass/faculty_action/${id}`,
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

      await loadData();

    } catch {
      alert("Server error");
    }
  };

  // ================= UI =================
  return (
    <div className="page">
      <div className="container">
        <h2 className="title">Faculty Dashboard</h2>

        {error && <p className="error">{error}</p>}

        {/* CAMERA */}
        {showCamera && (
          <div className="cameraBox">
            <video ref={videoRef} autoPlay playsInline muted />

            <button className="approve" onClick={captureAndApprove}>
              Capture & Approve
            </button>

            <button
              className="reject"
              onClick={() => {
                stopCamera();
                setShowCamera(false);
              }}
            >
              Cancel
            </button>

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        {/* PENDING */}
        <h3 className="section">Pending Gatepasses</h3>

        {pending.length === 0 && (
          <p className="info">No pending requests</p>
        )}

        {pending.map((p) => (
          <div key={p.id} className="card">
            <p><b>Student:</b> {p.student_name}</p>
            <p><b>Reason:</b> {p.reason}</p>

            <div className="actions">
              <button
                className="approve"
                onClick={() => openCamera(p.id)}
              >
                Approve
              </button>

              <button
                className="reject"
                onClick={() => rejectGatepass(p.id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}

        {/* HISTORY */}
        <h3 className="section">History</h3>

        {history.length === 0 && (
          <p className="info">No history available</p>
        )}

        {history.map((p) => (
          <div key={p.id} className="card">
            <p>{p.student_name} - {p.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}