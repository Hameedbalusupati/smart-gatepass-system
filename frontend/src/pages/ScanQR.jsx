import { QrReader } from "react-qr-reader";
import { useState } from "react";

export default function ScanQR() {
  const [message, setMessage] = useState("");
  const [locked, setLocked] = useState(false);
  const [student, setStudent] = useState(null);

  const handleResult = async (result) => {
    // ✅ ignore empty scan or locked state
    if (!result?.text || locked) return;

    setLocked(true);
    setMessage("Scanning QR...");
    setStudent(null);

    try {
      const scanUrl = result.text;

      const res = await fetch(scanUrl);
      const data = await res.json();

      console.log("QR DATA:", data);

      if (!res.ok || !data.success) {
        setMessage(data.message || "Scan failed");
        setTimeout(() => setLocked(false), 3000);
        return;
      }

      // ✅ save student data
      setStudent(data);

      // ✅ show message
      setMessage(
        `✅ GATE OPENED\n\n` +
        `Student: ${data.student_name}\n` +
        `College ID: ${data.college_id}\n` +
        `Department: ${data.department}\n` +
        `Time: ${data.time}`
      );

    } catch (err) {
      console.error("SCAN ERROR:", err);
      setMessage("❌ Server error while scanning");
    } finally {
      setTimeout(() => setLocked(false), 3000);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Security QR Scanner</h2>

      {/* CAMERA */}
      <div style={cameraBox}>
        <QrReader
          onResult={handleResult}   // ✅ fixed (no error param)
          constraints={{ facingMode: "environment" }}
          style={{ width: "100%" }}
        />
      </div>

      {/* ✅ STUDENT CARD */}
      {student && (
        <div style={cardStyle}>
          {/* IMAGE */}
          {student.profile_image && (
            <img
              src={student.profile_image}
              alt="student"
              style={imageStyle}
            />
          )}

          <h3 style={{ marginBottom: "10px" }}>
            {student.student_name}
          </h3>

          <p><b>ID:</b> {student.college_id}</p>
          <p><b>Dept:</b> {student.department}</p>
          <p><b>Time:</b> {student.time}</p>
        </div>
      )}

      {/* MESSAGE */}
      {message && (
        <pre style={messageStyle}>
          {message}
        </pre>
      )}
    </div>
  );
}

/* ===== STYLES ===== */

const containerStyle = {
  width: "90%",
  maxWidth: "420px",
  margin: "20px auto",
  padding: "20px",
  background: "#020617",
  color: "white",
  borderRadius: "12px",
  textAlign: "center",
  boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
};

const titleStyle = {
  marginBottom: "15px",
};

const cameraBox = {
  borderRadius: "10px",
  overflow: "hidden",
  border: "2px solid #22c55e",
};

const cardStyle = {
  marginTop: "20px",
  padding: "15px",
  borderRadius: "10px",
  background: "#0f172a",
  border: "1px solid #334155",
};

const imageStyle = {
  width: "120px",
  height: "120px",
  borderRadius: "50%",
  marginBottom: "10px",
  border: "2px solid #22c55e",
  objectFit: "cover",
};

const messageStyle = {
  marginTop: "15px",
  padding: "12px",
  borderRadius: "8px",
  background: "#111827",
  color: "#22c55e",
  whiteSpace: "pre-wrap",
  textAlign: "left",
  fontSize: "14px",
  border: "1px solid #334155",
};