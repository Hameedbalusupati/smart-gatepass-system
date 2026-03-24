import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import API from "../api";
import API_BASE_URL from "../config";

export default function SecurityScan() {

  const [student, setStudent] = useState(null);
  const [gatepass, setGatepass] = useState(null);
  const [message, setMessage] = useState("");
  const [exitCount, setExitCount] = useState(0);

  const scannerRef = useRef(null);
  const scannedRef = useRef(false);

  // ================= LOAD EXIT COUNT =================
  useEffect(() => {
    const loadExitCount = async () => {
      try {
        const res = await API.get("/security/exit-count");
        setExitCount(res.data?.total_exits || 0);
      } catch (err) {
        console.error(err);
      }
    };

    loadExitCount();
  }, []);

  // ================= INIT SCANNER ONLY ONCE =================
  useEffect(() => {

    if (scannerRef.current) return; // ✅ prevent multiple init

    let scanner;

    try {
      scanner = new Html5QrcodeScanner(
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
            const res = await API.post("/gatepass/verify_qr", {
              qr_token: decodedText
            });

            const data = res.data;

            if (!data?.success) {
              setMessage("Invalid QR ❌");
              scannedRef.current = false;
              return;
            }

            setStudent({
              name: data.student_name,
              roll_no: data.college_id,
              year: data.year,
              section: data.section,
              department: data.department,
              profile_image: data.profile_image,
              parent_mobile: data.parent_mobile
            });

            setGatepass({ id: data.gatepass_id });

            setMessage("Gatepass Verified ✅");

            scanner.clear().catch(() => {});

          } catch (err) {
            console.error(err);
            setMessage("Scan failed ❌");
            scannedRef.current = false;
          }
        },
        () => {}
      );

    } catch (err) {
      console.error("Scanner crash:", err);
      setMessage("Camera not supported ❌");
    }

    return () => {
      scanner?.clear().catch(() => {});
    };

  }, []); // ✅ ONLY ONCE

  // ================= CONFIRM EXIT =================
  const confirmExit = async () => {
    try {
      const res = await API.post(`/gatepass/confirm_exit/${gatepass?.id}`);

      if (res.data?.success) {
        setMessage("Exit recorded ✅");

        setStudent(null);
        setGatepass(null);
        scannedRef.current = false;

        const res2 = await API.get("/security/exit-count");
        setExitCount(res2.data?.total_exits || 0);
      }
    } catch (err) {
      console.error(err);
      setMessage("Exit failed ❌");
    }
  };

  return (
    <div style={container}>

      <h2>Security QR Scanner</h2>
      <h4>Today's Exits: {exitCount}</h4>

      {!student && <div id="qr-reader" style={{ width: "100%" }} />}

      {message && <p>{message}</p>}

      {student && (
        <div style={card}>

          {student?.profile_image && (
            <img
              src={`${API_BASE_URL}/uploads/student_images/${student.profile_image}`}
              alt="student"
              style={image}
            />
          )}

          <h3>{student?.name || "N/A"}</h3>

          <p><b>Roll No:</b> {student?.roll_no || "N/A"}</p>
          <p><b>Year:</b> {student?.year || "N/A"}</p>
          <p><b>Section:</b> {student?.section || "N/A"}</p>
          <p><b>Department:</b> {student?.department || "N/A"}</p>

          <p>
            <b>Parent Mobile:</b>{" "}
            {student?.parent_mobile ? (
              <a href={`tel:${student.parent_mobile}`} style={link}>
                {student.parent_mobile}
              </a>
            ) : "N/A"}
          </p>

          <button style={btn} onClick={confirmExit}>
            Confirm Exit
          </button>

        </div>
      )}

    </div>
  );
}

const container = {
  maxWidth: "350px",
  margin: "auto",
  textAlign: "center"
};

const card = {
  marginTop: "20px",
  background: "#111",
  color: "white",
  padding: "15px",
  borderRadius: "10px"
};

const image = {
  width: "250px",
  height: "250px",
  borderRadius: "10px",
  objectFit: "cover"
};

const btn = {
  marginTop: "10px",
  padding: "10px",
  background: "green",
  border: "none",
  color: "white",
  borderRadius: "5px",
  cursor: "pointer"
};

const link = {
  color: "#3b82f6"
};