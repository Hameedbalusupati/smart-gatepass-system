import { useRef, useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API from "../api/api.js";

export default function SecurityDashboard() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("Click Start Scanner");
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [exitCount, setExitCount] = useState(0);

  const qrRef = useRef(null);
  const scannedRef = useRef(false);

  // ================= FETCH EXIT COUNT =================
  const fetchExitCount = async () => {
    try {
      const res = await API.get("/security/exit-count");
      setExitCount(res.data.total_exits || 0);
    } catch (err) {
      console.error("Exit count error:", err);
    }
  };

  useEffect(() => {
    fetchExitCount();
    const interval = setInterval(fetchExitCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================= CLEANUP =================
  useEffect(() => {
    return () => {
      if (qrRef.current) {
        qrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // ================= START SCANNER =================
  const startScanner = async () => {
    try {
      const qr = new Html5Qrcode("qr-reader");
      qrRef.current = qr;

      const devices = await Html5Qrcode.getCameras();

      if (!devices.length) {
        setMessage("No camera found");
        return;
      }

      const camera =
        devices.find((d) => d.label.toLowerCase().includes("back")) ||
        devices[0];

      scannedRef.current = false;

      await qr.start(
        camera.id,
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          if (scannedRef.current) return;

          scannedRef.current = true;

          await qr.stop();
          setIsScanning(false);

          verifyQR(decodedText);
        }
      );

      setIsScanning(true);
      setMessage("Scanning QR...");
    } catch (err) {
      console.error(err);
      setMessage("Camera error");
    }
  };

  // ================= STOP =================
  const stopScanner = async () => {
    try {
      if (qrRef.current) {
        await qrRef.current.stop();
      }
      setIsScanning(false);
      setMessage("Scanner stopped");
    } catch (err) {
      console.error(err);
    }
  };

  // ================= VERIFY =================
  const verifyQR = async (qrToken) => {
    try {
      setLoading(true);
      setMessage("Verifying QR... ⏳");

      const res = await API.post("/security/verify_qr", {
        qr_token: qrToken,
      });

      if (!res.data?.success) {
        setMessage(res.data?.message || "Invalid QR");
        scannedRef.current = false;
        return;
      }

      setData(res.data);
      setMessage("QR Verified ✅");
    } catch (err) {
      console.error(err);
      setMessage("Verification failed ❌");
      scannedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // ================= CONFIRM EXIT =================
  const confirmExit = async () => {
    try {
      setLoading(true);

      const res = await API.post(
        `/security/confirm_exit/${data?.gatepass_id}`
      );

      if (res.data?.success) {
        setMessage("Exit Confirmed ✅");

        setData(null);
        scannedRef.current = false;

        fetchExitCount();

        // 🔥 Restart scanner automatically
        setTimeout(() => {
          startScanner();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setMessage("Exit failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // ================= IMAGE FIX =================
  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/120";

    // ✅ If already Cloudinary or HTTPS
    if (img.startsWith("https://")) return img;

    // ✅ Fix HTTP → HTTPS
    if (img.startsWith("http://")) {
      return img.replace("http://", "https://");
    }

    // ❌ Avoid broken relative paths
    return "https://via.placeholder.com/120";
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2>Security Dashboard</h2>

        <h3 style={{ color: "#22c55e" }}>
          Students Exited Today: {exitCount}
        </h3>

        {!data && <div id="qr-reader" style={camera}></div>}

        <p>{message}</p>

        {loading && <p>Processing... ⏳</p>}

        {!data && (
          <div style={btnRow}>
            {!isScanning ? (
              <button style={btnGreen} onClick={startScanner}>
                Start Scan
              </button>
            ) : (
              <button style={btnRed} onClick={stopScanner}>
                Stop
              </button>
            )}
          </div>
        )}

        {data && (
          <div style={resultBox}>
            <h3>Student Details</h3>

            {/* ✅ IMAGE */}
            <img
              src={getImageUrl(data.profile_image)}
              alt="student"
              style={image}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/120";
              }}
            />

            <p><b>Name:</b> {data.student_name}</p>
            <p><b>ID:</b> {data.college_id}</p>
            <p><b>Dept:</b> {data.department}</p>
            <p><b>Year:</b> {data.year}</p>

            <p>
              <b>Parent:</b>{" "}
              <a href={`tel:${data.parent_mobile}`} style={link}>
                {data.parent_mobile}
              </a>
            </p>

            <button style={exitBtn} onClick={confirmExit}>
              Confirm Exit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ================= STYLES =================

const container = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0f172a",
};

const card = {
  background: "#111827",
  padding: "20px",
  borderRadius: "10px",
  color: "white",
  width: "350px",
  textAlign: "center",
};

const camera = {
  width: "100%",
  marginBottom: "10px",
};

const btnRow = {
  marginTop: "10px",
};

const btnGreen = {
  background: "#22c55e",
  padding: "10px",
  border: "none",
  borderRadius: "5px",
  color: "white",
};

const btnRed = {
  background: "#ef4444",
  padding: "10px",
  border: "none",
  borderRadius: "5px",
  color: "white",
};

const resultBox = {
  marginTop: "15px",
  padding: "15px",
  background: "#020617",
  borderRadius: "8px",
};

const image = {
  width: "120px",
  height: "120px",
  borderRadius: "10px",
  objectFit: "cover",
};

const exitBtn = {
  marginTop: "10px",
  padding: "10px",
  background: "#ef4444",
  border: "none",
  borderRadius: "6px",
  color: "white",
};

const link = {
  color: "#3b82f6",
};