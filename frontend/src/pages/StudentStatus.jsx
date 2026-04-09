import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import API from "../api";

export default function StudentStatus() {
  const [pass, setPass] = useState(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  // ================= CURRENT TIME =================
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ================= FETCH STATUS =================
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await API.get("/gatepass/my_gatepass", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("API RESPONSE:", res.data);

        if (res.data.success) {
          setPass({
            status: "Approved",
            reason: "Gatepass Approved",
            qr_token: res.data.qr_token,
            is_used: false,
          });
        } else {
          setPass(null);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setPass(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [token]);

  // ================= QR COUNTDOWN =================
  useEffect(() => {
    if (!pass?.qr_token) return;

    try {
      const decoded = jwtDecode(pass.qr_token);
      const remaining = decoded.exp - now;
      setTimeLeft(remaining > 0 ? remaining : 0);
    } catch {
      setTimeLeft(0);
    }
  }, [pass, now]);

  // ================= FORMAT TIME =================
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ================= QR VALIDATION =================
  const isQrValid = (qrToken) => {
    try {
      const decoded = jwtDecode(qrToken);
      return decoded.exp > now;
    } catch {
      return false;
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>Gatepass Status</h2>

        {loading && <p style={styles.info}>Loading...</p>}

        {!loading && !pass && (
          <p style={styles.error}>No approved gatepass found</p>
        )}

        {pass && (
          <div style={styles.card}>
            <p><b>Reason:</b> {pass.reason}</p>

            <p>
              <b>Status:</b>{" "}
              <span style={statusStyle(pass.status)}>
                {pass.status}
              </span>
            </p>

            {/* QR CODE */}
            {pass.status === "Approved" &&
              pass.qr_token &&
              !pass.is_used && (
                isQrValid(pass.qr_token) ? (
                  <div style={styles.qrBox}>
                    <img
                      style={styles.qrImage}
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pass.qr_token)}`}
                      alt="Gatepass QR"
                    />

                    <p style={styles.valid}>
                      Show this QR at Security Gate
                    </p>

                    <p style={styles.timer}>
                      ⏳ Expires in: {formatTime(timeLeft)}
                    </p>
                  </div>
                ) : (
                  <p style={styles.expired}>
                    QR expired. Contact HOD.
                  </p>
                )
              )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#f8fafc",
  },

  container: {
    width: "95%",
    maxWidth: "600px",
    background: "#111827",
    padding: "25px",
    borderRadius: "12px",
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
  },

  card: {
    background: "#020617",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "15px",
  },

  qrBox: {
    marginTop: "15px",
    textAlign: "center",
  },

  qrImage: {
    border: "4px solid #22c55e",
    borderRadius: "8px",
  },

  valid: {
    color: "#22c55e",
    marginTop: "8px",
    fontWeight: "bold",
  },

  expired: {
    color: "#ef4444",
    fontWeight: "bold",
    marginTop: "10px",
  },

  timer: {
    marginTop: "8px",
    color: "#facc15",
    fontWeight: "bold",
  },

  error: {
    textAlign: "center",
    color: "#eab308",
  },

  info: {
    textAlign: "center",
    color: "#38bdf8",
  },
};

const statusStyle = (status) => ({
  fontWeight: "bold",
  color:
    status === "Approved"
      ? "#22c55e"
      : status === "Rejected"
      ? "#ef4444"
      : "#eab308",
});