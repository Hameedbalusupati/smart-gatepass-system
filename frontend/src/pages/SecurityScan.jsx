import { useState } from "react";
import { QrReader } from "react-qr-reader";
import API_BASE_URL from "../config";

export default function SecurityScan() {

  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("access_token");

  const verifyGatepass = async (qrData) => {
    try {

      const res = await fetch(`${API_BASE_URL}/security/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qr_token: qrData })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data);
        setMessage("Gatepass Verified ✅");
      } else {
        setMessage(data.message || "Invalid gatepass");
      }

    } catch (error) {
      console.error("Verification error:", error);
      setMessage("Server error");
    }
  };


  const handleScan = (data) => {
    if (data && !scanned) {
      setScanned(true);
      verifyGatepass(data);
    }
  };


  const resetScanner = () => {
    setScanned(false);
    setResult(null);
    setMessage("");
  };


  return (

    <div style={styles.container}>

      <h2 style={styles.title}>Security QR Scanner</h2>

      {!scanned && (

        <div style={styles.scannerBox}>

          <QrReader
            constraints={{ facingMode: "environment" }}
            onResult={(result) => {
              if (result) {
                handleScan(result?.text);
              }
            }}
            style={{ width: "100%" }}
          />

        </div>

      )}

      {scanned && (

        <div style={styles.resultBox}>

          <h3>{message}</h3>

          {result && (
            <div>
              <p><b>Student:</b> {result.student_name}</p>
              <p><b>Reason:</b> {result.reason}</p>
              <p><b>Out Time:</b> {result.out_time}</p>
            </div>
          )}

          <button style={styles.button} onClick={resetScanner}>
            Scan Next Gatepass
          </button>

        </div>

      )}

    </div>

  );
}


const styles = {

  container: {
    padding: "20px",
    textAlign: "center",
    minHeight: "100vh",
    background: "#0f172a",
    color: "white"
  },

  title: {
    marginBottom: "20px"
  },

  scannerBox: {
    maxWidth: "400px",
    margin: "0 auto"
  },

  resultBox: {
    marginTop: "20px",
    background: "#111827",
    padding: "20px",
    borderRadius: "10px"
  },

  button: {
    marginTop: "15px",
    padding: "10px 20px",
    border: "none",
    background: "#2563eb",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer"
  }

};