import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import API from "../api";   // ✅ USE CENTRAL API

export default function SecurityScan() {
  const [result, setResult] = useState("");

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
        try {
          // ✅ USE AXIOS API (ngrok / localhost safe)
          const res = await API.post("/security/scan", {
            qr_token: decodedText,
          });

          const data = res.data;

          setResult(
            `✅ ${data.action} Recorded\nStudent: ${data.student_name}\nRoll No: ${data.roll_no}`
          );
        } catch (err) {
          const msg =
            err.response?.data?.message ||
            "Server error while scanning";

          setResult(`❌ ${msg}`);
        }
      },
      (error) => {
        // ignore continuous scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => { });
    };
  }, []);

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
            color: "white",
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
