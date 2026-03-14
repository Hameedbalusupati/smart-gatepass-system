import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API_BASE_URL from "../config";

export default function SecurityScan() {

  const scannerRef = useRef(null);

  const [scanned, setScanned] = useState(false);
  const [student, setStudent] = useState(null);
  const [gatepass, setGatepass] = useState(null);
  const [message, setMessage] = useState("Starting camera...");


  // ================= VERIFY QR =================

  const verifyGatepass = async (qrToken) => {

    try {

      const res = await fetch(`${API_BASE_URL}/security/scan/${qrToken}`);

      const data = await res.json();

      if (res.ok && data.success) {

        setStudent(data.student);
        setGatepass(data.gatepass);
        setMessage("Gatepass Verified ✅");

      } else {

        setMessage(data.message);

      }

    } catch (error) {

      console.error(error);
      setMessage("Server Error");

    }

  };


  // ================= START SCANNER =================

  useEffect(() => {

    const startScanner = async () => {

      try {

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

          }
        );

        setMessage("Scan Gatepass QR");

      } catch (error) {

        console.error(error);

        setMessage("Camera not supported");

      }

    };

    startScanner();

    return () => {

      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { });
      }

    };

  }, [scanned]);


  // ================= CONFIRM EXIT =================

  const confirmExit = async () => {

    try {

      const res = await fetch(
        `${API_BASE_URL}/security/confirm/${gatepass.id}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {

        alert("Gatepass Completed");

        resetScanner();

      }

    } catch (error) {

      console.error(error);

    }

  };


  // ================= RESET =================

  const resetScanner = () => {

    setScanned(false);
    setStudent(null);
    setGatepass(null);
    setMessage("Restarting scanner...");

    window.location.reload();

  };


  return (

    <div style={styles.container}>

      <h2 style={styles.title}>Security QR Scanner</h2>

      {!scanned && (
        <div id="reader" style={styles.reader}></div>
      )}

      <p>{message}</p>

      {student && gatepass && (

        <div style={styles.resultBox}>

          <h3>Student Details</h3>

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

          <hr />

          <p><b>Reason:</b> {gatepass.reason}</p>
          <p><b>Parent Mobile:</b> {gatepass.parent_mobile}</p>

          <button style={styles.button} onClick={confirmExit}>
            Confirm Exit
          </button>

          <button style={styles.reset} onClick={resetScanner}>
            Scan Next
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

  reader: {
    width: "320px",
    margin: "20px auto"
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
    background: "#22c55e",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer"
  },

  reset: {
    marginTop: "10px",
    padding: "10px 20px",
    background: "#2563eb",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer"
  }

};