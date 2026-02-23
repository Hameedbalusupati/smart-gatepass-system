import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function SecurityScan() {
  const [result, setResult] = useState("");
  const scannerRef = useRef(null);
  const lockedRef = useRef(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!API_BASE_URL) {
      console.error("API Base URL not set in .env");
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
        setResult("🔄 Verifying QR...");

        try {
          const encodedToken = encodeURIComponent(decodedText.trim());

          const res = await fetch(
            `${API_BASE_URL}/security/scan/${encodedToken}`
          );

          if (!res.ok) {
            const errText = await res.text();
            console.error("Backend error:", errText);
            setResult("❌ Scan rejected by server");
            return;
          }

          const data = await res.json();

          if (!data.success) {
            setResult(`❌ ${data.message}`);
            return;
          }

          setResult(
            `✅ GATE OPENED\n\n` +
              `Student: ${data.student.name}\n` +
              `College ID: ${data.student.college_id}\n` +
              `Department: ${data.student.department}\n` +
              `Time: ${data.gatepass.out_time}`
          );
        } catch (err) {
          console.error("Scan error:", err);
          setResult("❌ Server connection error");
        } finally {
          setTimeout(() => {
            lockedRef.current = false;
          }, 3000);
        }
      },
      () => {} // Removed unused parameter
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [API_BASE_URL]); // Only dependency needed

  return (
    <div style={{ maxWidth: "350px", margin: "auto", textAlign: "center" }}>
      <h2>Security QR Scanner</h2>
      <div id="qr-reader" style={{ width: "100%" }} />
      {result && (
        <pre
          style={{
            marginTop: "15px",
            background: "#111",
            color: "lightgreen",
            padding: "10px",
            borderRadius: "6px",
            whiteSpace: "pre-wrap",
          }}
        >
          {result}
        </pre>
      )}
    </div>
  );
}