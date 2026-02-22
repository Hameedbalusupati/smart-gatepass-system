import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function SecurityScan() {
  const [result, setResult] = useState("");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        if (locked) return;
        setLocked(true);
        setResult("🔄 Verifying QR...");

        try {
          // ✅ QR already contains FULL backend URL
          const res = await fetch(decodedText);
          const data = await res.json();

          if (!res.ok || !data.success) {
            setResult(`❌ ${data.message || "Scan failed"}`);
            setTimeout(() => setLocked(false), 3000);
            return;
          }

          setResult(
            `✅ GATE OPENED\n\n` +
            `Student: ${data.student_name}\n` +
            `College ID: ${data.college_id}\n` +
            `Department: ${data.department}\n` +
            `Time: ${data.time}`
          );

        } catch (err) {
          console.error("SCAN ERROR:", err);
          setResult("❌ Server error while scanning");
        } finally {
          setTimeout(() => setLocked(false), 3000);
        }
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [locked]);

  return (
    <div
      className="page"
      style={{
        maxWidth: "350px",
        margin: "auto",
        textAlign: "center",
      }}
    >
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