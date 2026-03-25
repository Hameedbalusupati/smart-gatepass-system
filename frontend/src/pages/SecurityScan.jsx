import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API from "../api";
import API_BASE_URL from "../config";

export default function SecurityScan() {
  const [student, setStudent] = useState(null);
  const [gatepass, setGatepass] = useState(null);
  const [message, setMessage] = useState("");
  const [exitCount, setExitCount] = useState(0);

  const qrRef = useRef(null);
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

  // ================= VERIFY QR =================
  const verifyQR = async (token) => {
    try {
      const res = await API.post("/gatepass/verify_qr", {
        qr_token: token,
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
        parent_mobile: data.parent_mobile,
      });

      setGatepass({ id: data.gatepass_id });
      setMessage("Gatepass Verified ✅");

      // stop camera after scan
      await qrRef.current.stop();

    } catch (err) {
      console.error(err);
      setMessage("Verification failed ❌");
      scannedRef.current = false;
    }
  };

  // ================= START CAMERA =================
  useEffect(() => {
    const startCamera = async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        qrRef.current = html5QrCode;

        const devices = await Html5Qrcode.getCameras();

        if (!devices || devices.length === 0) {
          setMessage("No camera found ❌");
          return;
        }

        // 🔥 FORCE BACK CAMERA (important)
        const backCamera =
          devices.find((d) =>
            d.label.toLowerCase().includes("back")
          ) || devices[0];

        await html5QrCode.start(
          backCamera.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (scannedRef.current) return;

            scannedRef.current = true;
            verifyQR(decodedText);
          },
          () => {}
        );

        setMessage("Camera started 📷");

      } catch (err) {
        console.error(err);
        setMessage("Camera permission denied ❌");
      }
    };

    startCamera();

    return () => {
      qrRef.current?.stop().catch(() => {});
    };
  }, []);

  // ================= CONFIRM EXIT =================
  const confirmExit = async () => {
    try {
      const res = await API.post(
        `/gatepass/confirm_exit/${gatepass?.id}`
      );

      if (res.data?.success) {
        setMessage("Exit recorded ✅");

        setStudent(null);
        setGatepass(null);
        scannedRef.current = false;

        const res2 = await API.get("/security/exit-count");
        setExitCount(res2.data?.total_exits || 0);

        // restart camera
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setMessage("Exit failed ❌");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Security Dashboard</h2>
      <h4>Today's Exits: {exitCount}</h4>

      {/* 🔥 CAMERA ONLY */}
      {!student && (
        <div id="qr-reader" style={styles.camera} />
      )}

      {message && <p>{message}</p>}

      {/* STUDENT DATA */}
      {student && (
        <div style={styles.card}>
          {student.profile_image && (
            <img
              src={`${API_BASE_URL}/uploads/student_images/${student.profile_image}`}
              alt="student"
              style={styles.image}
            />
          )}

          <h3>{student.name}</h3>

          <p><b>Roll:</b> {student.roll_no}</p>
          <p><b>Year:</b> {student.year}</p>
          <p><b>Dept:</b> {student.department}</p>

          <p>
            <b>Parent:</b>{" "}
            <a href={`tel:${student.parent_mobile}`} style={styles.link}>
              {student.parent_mobile}
            </a>
          </p>

          <button style={styles.btn} onClick={confirmExit}>
            Confirm Exit
          </button>
        </div>
      )}
    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    maxWidth: "350px",
    margin: "auto",
    textAlign: "center",
    color: "white",
  },

  camera: {
    width: "100%",
    marginTop: "20px",
  },

  card: {
    marginTop: "20px",
    background: "#111",
    padding: "15px",
    borderRadius: "10px",
  },

  image: {
    width: "200px",
    height: "200px",
    borderRadius: "10px",
  },

  btn: {
    marginTop: "10px",
    padding: "10px",
    background: "green",
    color: "white",
    border: "none",
    borderRadius: "5px",
  },

  link: {
    color: "#3b82f6",
  },
};