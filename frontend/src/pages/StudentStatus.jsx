import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import API_BASE_URL from "../config";

export default function StudentStatus() {
  const [passes, setPasses] = useState([]);
  const [now, setNow] = useState(0);

  const token = localStorage.getItem("access_token");

  // ======================================
  // LIVE TIMER FOR QR EXPIRY
  // ======================================
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ======================================
  // FETCH STUDENT GATEPASSES
  // ======================================
  useEffect(() => {
    if (!token) return;

    const fetchGatepasses = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/gatepass/my_gatepasses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (res.ok && data.success) {
          setPasses(data.gatepasses);
        } else {
          setPasses([]);
        }
      } catch (err) {
        console.error("FETCH ERROR:", err);
        setPasses([]);
      }
    };

    fetchGatepasses();
  }, [token]);

  // ======================================
  // CHECK IF QR EXPIRED
  // ======================================
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
        <h2 style={styles.title}>Gatepass History</h2>

        {passes.length === 0 && (
          <p style={styles.error}>No gatepasses found</p>
        )}

        {passes.map((p) => (
          <div key={p.id} style={styles.card}>
            <p><b>Reason:</b> {p.reason}</p>

            <p>
              <b>Status:</b>{" "}
              <span style={statusStyle(p.status)}>
                {p.status}
              </span>
            </p>

            {/* ================= QR DISPLAY ================= */}
            {p.status === "Approved" &&
              p.qr_token &&
              !p.is_used && (
                isQrValid(p.qr_token) ? (
                  <div style={styles.qrBox}>
                    <img
                      style={styles.qrImage}
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        p.qr_token
                      )}`}
                      alt="Gatepass QR"
                    />
                    <p style={styles.valid}>
                      Show this QR at Security Gate
                    </p>
                  </div>
                ) : (
                  <p style={styles.expired}>
                    ❌ QR expired. Contact HOD.
                  </p>
                )
              )}
          </div>
        ))}
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
    maxWidth: "900px",
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
    marginBottom: "15px",
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
  error: {
    textAlign: "center",
    color: "#eab308",
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