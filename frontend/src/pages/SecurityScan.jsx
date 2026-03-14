import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API_BASE_URL from "../config";

export default function SecurityScan() {

  const scannerRef = useRef(null);

  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("Initializing scanner...");

  const token = localStorage.getItem("access_token");


  // ================= VERIFY GATEPASS =================

  const verifyGatepass = useCallback(async (qrToken) => {

    try {

      const res = await fetch(
        `${API_BASE_URL}/security/scan/${qrToken}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {

        setResult(data);
        setMessage("Gatepass Verified ✅");

      } else {

        setMessage(data.message || "Invalid Gatepass ❌");

      }

    } catch (error) {

      console.error("Verification error:", error);
      setMessage("Server error");

    }

  }, [token]);


  // ================= START CAMERA =================

  useEffect(() => {

    const startScanner = async () => {

      try {

        // Request camera permission
        await navigator.mediaDevices.getUserMedia({ video: true });

        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250
          },
          (decodedText) => {

            if (!scanned) {

              setScanned(true);

              verifyGatepass(decodedText);

              scanner.stop();

            }

          },
          () => { }
        );

        setMessage("Scan QR Code");

      } catch (error) {

        console.error("Camera error:", error);
        setMessage("Camera permission denied or not supported");

      }

    };

    startScanner();

    return () => {

      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { });
      }

    };

  }, [scanned, verifyGatepass]);


  // ================= RESET SCANNER =================

  const resetScanner = () => {

    setScanned(false);
    setResult(null);
    setMessage("Restarting scanner...");

    window.location.reload();

  };


  return (

    <div style={styles.container}>

      <h2>Security QR Scanner</h2>

      {!scanned && (

        <div id="reader" style={styles.reader}></div>

      )}

      <p style={styles.message}>{message}</p>


      {result && (

        <div style={styles.resultBox}>

          <h3>Student Details</h3>

          {result.student.profile_image && (

            <img
              src={`${API_BASE_URL}${result.student.profile_image}`}
              alt="Student"
              style={styles.image}
            />

          )}

          <p><b>Name:</b> {result.student.name}</p>
          <p><b>College ID:</b> {result.student.college_id}</p>
          <p><b>Department:</b> {result.student.department}</p>
          <p><b>Year:</b> {result.student.year}</p>
          <p><b>Section:</b> {result.student.section}</p>

          <hr />

          <h3>Gatepass Details</h3>

          <p><b>Reason:</b> {result.gatepass.reason}</p>
          <p><b>Parent Mobile:</b> {result.gatepass.parent_mobile}</p>
          <p><b>Out Time:</b> {result.gatepass.out_time}</p>

          <button style={styles.button} onClick={resetScanner}>
            Scan Next Gatepass
          </button>

        </div>

      )}

    </div>

  );

}


// ================= STYLES =================

const styles = {

  container: {
    textAlign: "center",
    padding: "20px",
    minHeight: "100vh",
    background: "#0f172a",
    color: "white"
  },

  reader: {
    width: "320px",
    margin: "20px auto"
  },

  message: {
    marginTop: "10px",
    fontSize: "16px"
  },

  resultBox: {
    marginTop: "20px",
    background: "#111827",
    padding: "20px",
    borderRadius: "10px"
  },

  image: {
    width: "120px",
    borderRadius: "10px",
    marginBottom: "10px"
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