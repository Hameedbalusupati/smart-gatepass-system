import API_BASE_URL from "../config";

export default function QrView({ token }) {
  if (!token) {
    return <p style={{ color: "red" }}>QR not available</p>;
  }

  const qrUrl = `${API_BASE_URL}/security/scan/${token}`;

  return (
    <div style={styles.container}>
      <img
        style={styles.qr}
        src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
          qrUrl
        )}`}
        alt="Gatepass QR"
      />
      <p style={styles.text}>Scan at Security Gate</p>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    textAlign: "center",
    padding: "20px",
    background: "#020617",
    borderRadius: "12px",
  },
  qr: {
    border: "4px solid #22c55e",
    borderRadius: "10px",
  },
  text: {
    marginTop: "10px",
    color: "#22c55e",
    fontWeight: "bold",
  },
};