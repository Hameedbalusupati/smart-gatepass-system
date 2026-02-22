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
      // QR already contains FULL backend URL
      const scanUrl = result.text;

      const res = await fetch(scanUrl);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(`❌ ${data.message || "Scan failed"}`);
        setTimeout(() => setLocked(false), 3000);
        return;
      }

      // ✅ SUCCESS
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
      <h2>Security QR Scanner</h2>

      <QrReader
        onResult={handleResult}
        constraints={{ facingMode: "environment" }}
        style={{ width: "100%" }}
      />

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
  maxWidth: "400px",
  margin: "20px auto",
  padding: "15px",
  background: "#111827",
  color: "white",
  borderRadius: "10px",
};

const messageStyle = {
  marginTop: "10px",
  color: "lightgreen",
  whiteSpace: "pre-wrap",
};