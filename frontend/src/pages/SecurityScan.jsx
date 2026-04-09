import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API from "../api";

export default function SecurityScan() {
  const [student, setStudent] = useState(null);
  const [gatepass, setGatepass] = useState(null);
  const [message, setMessage] = useState("");
  const [exitCount, setExitCount] = useState(0);

  const qrRef = useRef(null);
  const scannedRef = useRef(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const BACKEND_URL = API.defaults.baseURL.replace("/api", "");

  // ================= LOAD EXIT COUNT =================
  const loadExitCount = useCallback(async () => {
    try {
      const res = await API.get("/security/exit-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExitCount(res.data?.total_exits || 0);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // ✅ FIXED EFFECT (NO WARNING)
  useEffect(() => {
    const fetchData = async () => {
      await loadExitCount();
    };
    fetchData();
  }, [loadExitCount]);

  // ================= VERIFY QR =================
  const verifyQR = useCallback(
    async (qrToken) => {
      try {
        const res = await API.post(
          "/security/verify_qr",
          { qr_token: qrToken },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = res.data;

        if (!data?.success) {
          setMessage(data?.message || "Invalid QR");
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

        await qrRef.current?.stop();
      } catch (err) {
        console.error(err);
        setMessage("Verification failed");
        scannedRef.current = false;
      }
    },
    [token]
  );

  // ================= START CAMERA =================
  useEffect(() => {
    const startCamera = async () => {
      try {
        const qr = new Html5Qrcode("qr-reader");
        qrRef.current = qr;

        const devices = await Html5Qrcode.getCameras();

        if (!devices.length) {
          setMessage("No camera found");
          return;
        }

        const cam =
          devices.find((d) =>
            d.label.toLowerCase().includes("back")
          ) || devices[0];

        await qr.start(
          cam.id,
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            if (scannedRef.current) return;

            scannedRef.current = true;
            verifyQR(decodedText);
          }
        );

        setMessage("Scanning... 📷");
      } catch (err) {
        console.error(err);
        setMessage("Camera error");
      }
    };

    startCamera();

    return () => {
      qrRef.current?.stop().catch(() => {});
    };
  }, [verifyQR]);

  // ================= CONFIRM EXIT =================
  const confirmExit = async () => {
    try {
      const res = await API.post(
        `/security/confirm_exit/${gatepass?.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.success) {
        setMessage("Exit recorded ✅");

        setStudent(null);
        setGatepass(null);
        scannedRef.current = false;

        loadExitCount(); // safe
      }
    } catch (err) {
      console.error(err);
      setMessage("Exit failed");
    }
  };

  // ================= IMAGE FIX =================
  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/120";

    if (img.startsWith("http")) return img;

    const clean = img.replace(/^\/+/, "");
    return `${BACKEND_URL}/${clean}`;
  };

  return (
    <div style={styles.container}>
      <h2>Security Dashboard</h2>
      <h4>Today's Exits: {exitCount}</h4>

      {!student && <div id="qr-reader" style={styles.camera}></div>}

      {message && <p>{message}</p>}

      {student && (
        <div style={styles.card}>
          <img
            src={getImageUrl(student.profile_image)}
            alt="student"
            style={styles.image}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/120";
            }}
          />

          <h3>{student.name}</h3>
          <p><b>Roll:</b> {student.roll_no}</p>
          <p><b>Year:</b> {student.year}</p>
          <p><b>Section:</b> {student.section}</p>
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

/* STYLES */
const styles = {
  container: {
    maxWidth: "350px",
    margin: "auto",
    textAlign: "center",
    color: "white",
  },
  camera: {
    width: "100%",
    height: "300px",
    marginTop: "20px",
    borderRadius: "10px",
    overflow: "hidden",
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
    objectFit: "cover",
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