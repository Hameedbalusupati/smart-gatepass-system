import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import API_BASE_URL from "../config";

export default function StudentStatus() {

  const [pass, setPass] = useState(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  const token = localStorage.getItem("access_token");


  // ================= TIMER =================
  useEffect(() => {

    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(timer);

  }, []);



  // ================= FETCH STATUS =================
  useEffect(() => {

    if (!token) return;

    const fetchStatus = async () => {

      try {

        const res = await fetch(`${API_BASE_URL}/student/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setPass(data.gatepass);
        } else {
          setPass(null);
        }

      } catch (err) {

        console.error("Fetch error:", err);
        setPass(null);

      }

    };

    fetchStatus();

  }, [token]);



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

        {!pass && (
          <p style={styles.error}>No gatepass applied</p>
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


            {/* REJECTION MESSAGE */}

            {pass.status === "Rejected" && pass.rejection_reason && (

              <p style={styles.rejection}>
                <b>Rejection Reason:</b> {pass.rejection_reason}
              </p>

            )}


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

  rejection: {
    marginTop: "10px",
    color: "#f87171",
    fontWeight: "bold",
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