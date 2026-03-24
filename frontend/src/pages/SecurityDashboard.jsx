import { useState } from "react";
import API from "../api";
import API_BASE_URL from "../config";

export default function SecurityDashboard() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= VERIFY QR =================
  const verifyQR = async () => {
    if (!qrInput.trim()) {
      setMessage("Enter QR code ❌");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("access_token");

      if (!token) {
        setMessage("Session expired ❌");
        return;
      }

      const res = await API.post(
        "/gatepass/verify_qr",
        { qr_token: qrInput },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.data?.success) {
        setMessage("Invalid QR ❌");
        setData(null);
        return;
      }

      setData(res.data);
      setMessage("QR Verified ✅");

    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Verification failed ❌");
      setData(null);
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
        setQrInput("");
      }

    } catch (err) {
      console.error(err);
      setMessage("Exit failed ❌");
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={title}>Security Dashboard</h2>

        {/* ===== QR INPUT ===== */}
        <input
          type="text"
          placeholder="Paste QR token"
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          style={input}
        />

        <button style={btn} onClick={verifyQR} disabled={loading}>
          {loading ? "Verifying..." : "Verify QR"}
        </button>

        {message && <p style={msg}>{message}</p>}

        {/* ===== RESULT ===== */}
        {data && (
          <div style={resultBox}>
            <h3>Student Details</h3>

            {/* ✅ SAFE IMAGE FIX */}
            {data?.profile_image && (
              <img
                src={`${API_BASE_URL}/uploads/student_images/${data.profile_image}`}
                alt="student"
                style={image}
              />
            )}

            <p><b>Name:</b> {data?.student_name || "N/A"}</p>
            <p><b>College ID:</b> {data?.college_id || "N/A"}</p>
            <p><b>Department:</b> {data?.department || "N/A"}</p>
            <p><b>Year:</b> {data?.year || "N/A"}</p>
            <p><b>Section:</b> {data?.section || "N/A"}</p>

            {/* ✅ PARENT MOBILE */}
            <p>
              <b>Parent Mobile:</b>{" "}
              {data?.parent_mobile ? (
                <a href={`tel:${data.parent_mobile}`} style={link}>
                  {data.parent_mobile}
                </a>
              ) : "N/A"}
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

const title = {
  marginBottom: "15px",
};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "1px solid #374151",
  background: "#020617",
  color: "white",
};

const btn = {
  padding: "10px",
  background: "#22c55e",
  border: "none",
  borderRadius: "6px",
  color: "white",
  cursor: "pointer",
  marginBottom: "10px",
};

const msg = {
  marginTop: "10px",
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
  marginBottom: "10px",
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