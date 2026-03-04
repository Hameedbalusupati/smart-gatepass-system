import { QrReader } from "react-qr-reader";
import { useState } from "react";

export default function ScanQR() {
  const [message, setMessage] = useState("");
  const [locked, setLocked] = useState(false);

  const handleResult = async (result, error) => {
    if (!result?.text || locked) return;

    setLocked(true);
    setMessage("🔄 Scanning QR...");

    try {
      const scanUrl = result.text;

      const res = await fetch(scanUrl);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(`❌ ${data.message || "Scan failed"}`);
        setTimeout(() => setLocked(false), 3000);
        return;
      }

      // SUCCESS
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

      <div style={cameraBox}>
        <QrReader
          onResult={handleResult}
          constraints={{ facingMode: "environment" }}
          style={{ width: "100%" }}
        />
      </div>

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