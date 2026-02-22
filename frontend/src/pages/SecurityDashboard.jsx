import API from "../api";

export default function SecurityDashboard() {
  const verifyQR = async (qrCode) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        alert("Session expired. Please login again.");
        return;
      }

      const res = await API.post(
        "/security/verify",
        { qr: qrCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data.status || "QR verified");

    } catch (err) {
      alert(err.response?.data?.message || "QR verification failed");
    }
  };

  return (
    <div>
      <h2>Security Dashboard</h2>

      <button onClick={() => verifyQR("sample-qr")}>
        Verify QR
      </button>
    </div>
  );
}