import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function SecurityScan() {
  const [studentData, setStudentData] = useState(null);
  const [message, setMessage] = useState("");
  const scannerRef = useRef(null);
  const lockedRef = useRef(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!API_BASE_URL) {
      console.error("API Base URL not set");
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        if (lockedRef.current) return;

        lockedRef.current = true;
        setMessage("🔄 Verifying QR...");
        setStudentData(null);

        try {
          const encodedToken = encodeURIComponent(decodedText.trim());

          const res = await fetch(
            `${API_BASE_URL}/security/scan/${encodedToken}`
          );

          const data = await res.json();

          if (!res.ok || !data.success) {
            setMessage(`❌ ${data.message || "Verification failed"}`);
            return;
          }

          setMessage("✅ Gate Opened");
          setStudentData(data);

        } catch (err) {
          console.error(err);
          setMessage("❌ Server connection error");
        } finally {
          setTimeout(() => {
            lockedRef.current = false;
          }, 3000);
        }
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [API_BASE_URL]);

  const baseURL = API_BASE_URL.replace("/api", "");

  return (
    <div style={container}>
      <h2 style={{ marginBottom: "15px" }}>Security QR Scanner</h2>

      <div id="qr-reader" style={{ width: "100%" }} />

      {message && (
        <p
          style={{
            marginTop: "15px",
            fontWeight: "bold",
            color: message.startsWith("✅") ? "green" : "red",
          }}
        >
          {message}
        </p>
      )}

      {studentData && (
        <div style={card}>
          {studentData.student.profile_image && (
            <img
              src={`${baseURL}${studentData.student.profile_image}`}
              alt="Student"
              style={imageStyle}
            />
          )}

          <h3>{studentData.student.name}</h3>

          <p><strong>College ID:</strong> {studentData.student.college_id}</p>
          <p><strong>Department:</strong> {studentData.student.department}</p>
          <p><strong>Year:</strong> {studentData.student.year}</p>
          <p><strong>Section:</strong> {studentData.student.section}</p>

          <hr />

          <p><strong>Reason:</strong> {studentData.gatepass.reason}</p>
          <p><strong>Parent Mobile:</strong> {studentData.gatepass.parent_mobile}</p>
          <p><strong>Out Time:</strong> {studentData.gatepass.out_time}</p>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const container = {
  maxWidth: "400px",
  margin: "30px auto",
  textAlign: "center",
};

const card = {
  marginTop: "20px",
  padding: "15px",
  background: "#f1f5f9",
  borderRadius: "10px",
  textAlign: "left",
  boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
};

const imageStyle = {
  width: "120px",
  height: "120px",
  objectFit: "cover",
  borderRadius: "8px",
  display: "block",
  margin: "0 auto 10px auto",
};