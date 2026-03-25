import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API from "../api";
import API_BASE_URL from "../config";

export default function SecurityDashboard() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("Starting camera...");
  const [loading, setLoading] = useState(false);

  const qrRef = useRef(null);
  const scannedRef = useRef(false);

  // ================= START CAMERA =================
  useEffect(() => {
    const startScanner = async () => {
      try {
        const qr = new Html5Qrcode("qr-reader");
        qrRef.current = qr;

        const devices = await Html5Qrcode.getCameras();

        if (!devices.length) {
          setMessage("No camera found ❌");
          return;
        }

        // 🔥 BACK CAMERA FIX
        const camera =
          devices.find(d => d.label.toLowerCase().includes("back")) ||
          devices[0];

        await qr.start(
          camera.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            if (scannedRef.current) return;

            scannedRef.current = true;
            verifyQR(decodedText);

            await qr.stop();
          },
          () => {}
        );

        setMessage("Camera ready 📷");

      } catch (err) {
        console.error(err);
        setMessage("Camera permission denied ❌");
      }
    };

    startScanner();

    return () => {
      qrRef.current?.stop().catch(() => {});
    };
  }, []);

  // ================= VERIFY QR =================
  const verifyQR = async (qrToken) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("access_token");

      const res = await API.post(
        "/gatepass/verify_qr",
        { qr_token: qrToken },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.data?.success) {
        setMessage("Invalid QR ❌");
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
      const token = localStorage.getItem("access_token");

      const res = await API.post(
        `/gatepass/confirm_exit/${data?.gatepass_id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.success) {
        setMessage("Exit Confirmed ✅");
        setData(null);
        scannedRef.current = false;

        // 🔥 Restart scanner
        window.location.reload();
      }

    } catch (err) {
      console.error(err);
      setMessage("Exit failed ❌");
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2>Security Dashboard</h2>

        {/* ✅ CAMERA VIEW */}
        {!data && <div id="qr-reader" style={cameraStyle}></div>}

        <p>{message}</p>

        {/* ===== RESULT ===== */}
        {data && (
          <div style={resultBox}>
            <h3>Student Details</h3>

            {data?.profile_image && (
              <img
                src={`${API_BASE_URL}/uploads/student_images/${data.profile_image}`}
                alt="student"
                style={image}
              />
            )}

            <p><b>Name:</b> {data.student_name}</p>
            <p><b>College ID:</b> {data.college_id}</p>
            <p><b>Department:</b> {data.department}</p>
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

//////////////////////////////////////////////////////////
// 🎨 STYLES
//////////////////////////////////////////////////////////

const container = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0f172a",
};

const card = {
  background: "#111827",
  padding: "25px",
  borderRadius: "10px",
  color: "white",
  width: "400px",
  textAlign: "center",
};

const cameraStyle = {
  width: "100%",
  marginBottom: "15px",
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
  cursor: "pointer",
};

const link = {
  color: "#3b82f6",
};