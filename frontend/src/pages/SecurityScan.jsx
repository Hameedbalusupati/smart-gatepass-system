import { useState } from "react";
import { QrReader } from "react-qr-reader";
import API_BASE_URL from "../config";

export default function SecurityScan() {

  const [scanned, setScanned] = useState(false);
  const [student, setStudent] = useState(null);
  const [gatepass, setGatepass] = useState(null);
  const [message, setMessage] = useState("");



  // ================= VERIFY GATEPASS =================

  const verifyGatepass = async (qrData) => {

    try {

      const res = await fetch(`${API_BASE_URL}/security/scan/${qrData}`);

      const data = await res.json();

      if (res.ok && data.success) {

        setStudent(data.student);
        setGatepass(data.gatepass);
        setMessage("Gatepass Verified ✅");

      } else {

        setMessage(data.message || "Invalid Gatepass");

      }

    } catch (error) {

      console.error("Verification error:", error);
      setMessage("Server error");

    }

  };


  // ================= HANDLE SCAN =================

  const handleScan = (data) => {

    if (data && !scanned) {

      setScanned(true);

      verifyGatepass(data);

    }

  };


  // ================= RESET =================

  const resetScanner = () => {

    setScanned(false);
    setStudent(null);
    setGatepass(null);
    setMessage("");

  };


  return (

    <div style={styles.container}>

      <h2 style={styles.title}>Security QR Scanner</h2>

      {/* Scanner */}

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


      {/* Result */}

      {scanned && (

        <div style={styles.resultBox}>

          <h3>{message}</h3>

          {student && gatepass && (

            <div>

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
              <p><b>Out Time:</b> {gatepass.out_time}</p>

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