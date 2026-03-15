import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import API from "../api";

export default function SecurityScan() {

  const [student, setStudent] = useState(null);
  const [gatepass, setGatepass] = useState(null);
  const [message, setMessage] = useState("");
  const [exitCount, setExitCount] = useState(0);

  const scannerRef = useRef(null);
  const scannedRef = useRef(false);


  // ====================================
  // LOAD EXIT COUNT ON PAGE LOAD
  // ====================================
  useEffect(() => {

    const loadExitCount = async () => {
      try {
        const res = await API.get("/security/exit-count");
        setExitCount(res.data.total_exits);
      } catch (err) {
        console.error("Exit count error:", err);
      }
    };

    loadExitCount();

  }, []);


  // ====================================
  // QR SCANNER
  // ====================================
  useEffect(() => {

    if (student) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scannerRef.current = scanner;

    scanner.render(

      async (decodedText) => {

        if (scannedRef.current) return;

        scannedRef.current = true;

        try {

          const res = await API.post("/security/scan", {
            qr_token: decodedText
          });

          const data = res.data;

          if (!data.success) {
            setMessage(data.message);
            scannedRef.current = false;
            return;
          }

          setStudent(data.student);
          setGatepass(data.gatepass);
          setMessage("Gatepass Verified");

          scanner.clear();

        } catch (err) {

          const msg =
            err.response?.data?.message ||
            "Server error while scanning";

          setMessage(msg);
          scannedRef.current = false;
        }

      },

      () => {}

    );

    return () => {
      scanner.clear().catch(() => {});
    };

  }, [student]);


  // ====================================
  // CONFIRM EXIT
  // ====================================
  const confirmExit = async () => {

    try {

      const res = await API.post(`/security/confirm/${gatepass.id}`);

      if (res.data.success) {

        setMessage("Exit recorded successfully");

        setStudent(null);
        setGatepass(null);

        scannedRef.current = false;

        // refresh exit count
        const res2 = await API.get("/security/exit-count");
        setExitCount(res2.data.total_exits);

      }

    } catch (err) {

      console.error(err);
      setMessage("Error confirming exit");

    }

  };


  return (

    <div style={{ maxWidth: "350px", margin: "auto", textAlign: "center" }}>

      <h2>Security QR Scanner</h2>

      <h4>Today's Exits: {exitCount}</h4>

      {/* Hide scanner after student detected */}
      {!student && (
        <div id="qr-reader" style={{ width: "100%" }} />
      )}

      {message && <p>{message}</p>}

      {student && (

        <div
          style={{
            marginTop: "20px",
            background: "#111",
            color: "white",
            padding: "15px",
            borderRadius: "10px"
          }}
        >

          <img
            src={student.profile_image}
            alt="student"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "10px",
              objectFit: "cover"
            }}
          />

          <h3>{student.name}</h3>

          <p><b>Roll No:</b> {student.roll_no}</p>
          <p><b>Year:</b> {student.year}</p>
          <p><b>Section:</b> {student.section}</p>
          <p><b>Department:</b> {student.department}</p>

          <button
            onClick={confirmExit}
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "green",
              border: "none",
              color: "white",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Confirm Exit
          </button>

        </div>

      )}

    </div>

  );

}