import { useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API_BASE_URL from "../config";

export default function SecurityScan() {

  const scannerRef = useRef(null);

  const [scannerStarted, setScannerStarted] = useState(false);
  const [student, setStudent] = useState(null);
  const [gatepass, setGatepass] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");



  // ================= START SCANNER =================

  const startScanner = async () => {

    try {

      setError("");
      setMessage("");

      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },

        async (decodedText) => {

          await scanner.stop();
          await scanner.clear();

          setScannerStarted(false);

          verifyGatepass(decodedText);

        }
      );

      setScannerStarted(true);

    } catch (err) {

      console.error(err);
      setError("Camera permission required");

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

      } else {

        setError(data.message);

      }

    } catch (err) {

      console.error(err);
      setError("Server error");

    }

  };



  // ================= RESET =================

  const resetScanner = async () => {

    try {

      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
        await scannerRef.current.clear().catch(() => {});
      }

    } catch {}

    setStudent(null);
    setGatepass(null);
    setError("");
    setMessage("");
    setScannerStarted(false);

  };



  return (

    <div style={styles.container}>

      <h2>Security QR Scanner</h2>


      {/* START BUTTON */}

      {!scannerStarted && !student && !error && (

        <button style={styles.button} onClick={startScanner}>
          Start Scanner
        </button>

      )}



      {/* SCANNER */}

      {scannerStarted && (

        <div id="reader" style={styles.reader}></div>

      )}



      {/* SUCCESS RESULT */}

      {student && gatepass && (

        <div style={styles.successBox}>

          <h2>Gatepass Verified ✅</h2>

          {student.profile_image && (

            <img
              src={student.profile_image}
              alt="Student"
              style={styles.image}
            />

          )}

          <p><b>Name:</b> {student.name}</p>
          <p><b>ID:</b> {student.college_id}</p>
          <p><b>Department:</b> {student.department}</p>
          <p><b>Year:</b> {student.year}</p>
          <p><b>Section:</b> {student.section}</p>

          <hr/>

          <p><b>Reason:</b> {gatepass.reason}</p>
          <p><b>Parent Mobile:</b> {gatepass.parent_mobile}</p>

          <button style={styles.button} onClick={resetScanner}>
            Scan Next Student
          </button>

        </div>

      )}



      {/* ERROR MESSAGE */}

      {error && (

        <div style={styles.errorBox}>

          <h3>{error}</h3>

          <button style={styles.button} onClick={resetScanner}>
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
    minHeight: "100vh",
    background: "#0f172a",
    color: "white"
  },

  reader: {
    width: "320px",
    margin: "20px auto"
  },

  button: {
    marginTop: "15px",
    padding: "10px 20px",
    background: "#2563eb",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer"
  },

  successBox: {
    background: "#022c22",
    border: "2px solid #22c55e",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "20px"
  },

  errorBox: {
    background: "#450a0a",
    border: "2px solid #ef4444",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "20px"
  },

  image: {
    width: "120px",
    borderRadius: "10px",
    marginBottom: "10px"
  }

};