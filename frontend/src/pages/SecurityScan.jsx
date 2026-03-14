import { useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API_BASE_URL from "../config";

export default function SecurityScan() {

  const scannerRef = useRef(null);

  const [scannerStarted, setScannerStarted] = useState(false);
  const [student, setStudent] = useState(null);
  const [gatepass, setGatepass] = useState(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // success | error


  // ================= START SCANNER =================

  const startScanner = async () => {

    try {

      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },

        async (decodedText) => {

          await scanner.stop();
          await scanner.clear();

          setScannerStarted(false);

          verifyGatepass(decodedText);

        }
      );

      setScannerStarted(true);
      setMessage("Scanning QR Code...");

    } catch (error) {

      console.error(error);
      setStatus("error");
      setMessage("Camera permission required");

    }

  };


  // ================= VERIFY QR =================

  const verifyGatepass = async (qrToken) => {

    try {

      const res = await fetch(`${API_BASE_URL}/security/scan/${qrToken}`);
      const data = await res.json();

      if (data.success) {

        setStudent(data.student);
        setGatepass(data.gatepass);

        setStatus("success");
        setMessage("Gatepass Verified");

      } else {

        setStatus("error");
        setMessage(data.message || "Invalid Gatepass");

      }

    } catch (error) {

      console.error(error);

      setStatus("error");
      setMessage("Server Error");

    }

  };


  // ================= RESET =================

  const resetScanner = async () => {

    try {

      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
        await scannerRef.current.clear().catch(() => {});
      }

    } catch (e) {}

    setScannerStarted(false);
    setStudent(null);
    setGatepass(null);
    setStatus("");
    setMessage("");

  };


  return (

    <div style={styles.container}>

      <h2>Security QR Scanner</h2>


      {/* START BUTTON */}

      {!scannerStarted && !student && status === "" && (

        <button style={styles.startButton} onClick={startScanner}>
          Start Scanner
        </button>

      )}


      {/* QR SCANNER */}

      {scannerStarted && (

        <div id="reader" style={styles.reader}></div>

      )}



      {/* SUCCESS SCREEN */}

      {status === "success" && student && gatepass && (

        <div style={styles.successBox}>

          <h2 style={{ color: "#22c55e" }}>Gatepass Verified ✅</h2>

          {student.profile_image && (

            <img
              src={student.profile_image}
              alt="Student"
              style={styles.image}
            />

          )}

          <p><b>Name:</b> {student.name}</p>
          <p><b>College ID:</b> {student.college_id}</p>
          <p><b>Department:</b> {student.department}</p>
          <p><b>Year:</b> {student.year}</p>
          <p><b>Section:</b> {student.section}</p>

          <hr/>

          <p><b>Reason:</b> {gatepass.reason}</p>
          <p><b>Parent Mobile:</b> {gatepass.parent_mobile}</p>
          <p><b>Out Time:</b> {gatepass.out_time}</p>

          <button style={styles.nextButton} onClick={resetScanner}>
            Scan Next Student
          </button>

        </div>

      )}



      {/* ERROR SCREEN */}

      {status === "error" && (

        <div style={styles.errorBox}>

          <h2>❌ Invalid Gatepass</h2>

          <p>{message}</p>

          <button style={styles.nextButton} onClick={resetScanner}>
            Try Again
          </button>

        </div>

      )}

    </div>

  );

}



const styles = {

  container: {
    textAlign: "center",
    padding: "20px",
    background: "#0f172a",
    color: "white",
    minHeight: "100vh"
  },

  reader: {
    width: "320px",
    margin: "20px auto"
  },

  startButton: {
    padding: "12px 20px",
    background: "#2563eb",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer"
  },

  successBox: {
    background: "#022c22",
    border: "2px solid #22c55e",
    padding: "25px",
    borderRadius: "10px",
    marginTop: "20px"
  },

  errorBox: {
    background: "#450a0a",
    border: "2px solid #ef4444",
    padding: "25px",
    borderRadius: "10px",
    marginTop: "20px"
  },

  image: {
    width: "120px",
    borderRadius: "10px",
    marginBottom: "10px"
  },

  nextButton: {
    marginTop: "15px",
    padding: "10px 20px",
    background: "#2563eb",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer"
  }

};