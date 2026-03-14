import { useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API_BASE_URL from "../config";

export default function SecurityScan() {

  const scannerRef = useRef(null);

  const [scannerStarted, setScannerStarted] = useState(false);
  const [student, setStudent] = useState(null);
  const [gatepass, setGatepass] = useState(null);
  const [message, setMessage] = useState("Click Start Scanner");


  const startScanner = async () => {

    try {

      const scanner = new Html5Qrcode("reader");

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },

        (decodedText) => {

          scanner.stop();

          setScannerStarted(false);

          verifyGatepass(decodedText);

        }
      );

      setScannerStarted(true);
      setMessage("Scanning QR Code...");

    } catch (error) {

      console.error(error);
      setMessage("Camera permission required");

    }

  };


  const verifyGatepass = async (qrToken) => {

    try {

      const res = await fetch(`${API_BASE_URL}/security/scan/${qrToken}`);

      const data = await res.json();

      console.log("API Response:", data);

      if (data.success) {

        setStudent(data.student);
        setGatepass(data.gatepass);
        setMessage("Gatepass Verified");

      } else {

        setMessage(data.message);

      }

    } catch (error) {

      console.error(error);
      setMessage("Server Error");

    }

  };


  const resetScanner = () => {

    setStudent(null);
    setGatepass(null);
    setMessage("Click Start Scanner");

  };


  return (

    <div style={styles.container}>

      <h2>Security QR Scanner</h2>

      {!scannerStarted && !student && (

        <button style={styles.button} onClick={startScanner}>
          Start Scanner
        </button>

      )}

      {scannerStarted && (

        <div id="reader" style={styles.reader}></div>

      )}

      <p>{message}</p>


      {student && gatepass && (

        <div style={styles.resultBox}>

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

          <button style={styles.button} onClick={resetScanner}>
            Scan Next
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

  resultBox: {
    background: "#111827",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "20px"
  },

  image: {
    width: "120px",
    borderRadius: "10px",
    marginBottom: "10px"
  },

  button: {
    padding: "10px 20px",
    background: "#2563eb",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer"
  }

};