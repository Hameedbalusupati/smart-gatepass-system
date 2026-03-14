import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import API from "../api";

export default function SecurityScan() {

  const [student, setStudent] = useState(null);
  const [gatepass, setGatepass] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(

      async (decodedText) => {

        try {

          const res = await API.post("/security/scan", {
            qr_token: decodedText
          });

          const data = res.data;

          if (!data.success) {
            setMessage(data.message);
            return;
          }

          setStudent(data.student);
          setGatepass(data.gatepass);
          setMessage("Gatepass Verified");

        } catch (err) {

          console.error(err);

          const msg =
            err.response?.data?.message ||
            "Server error while scanning";

          setMessage(msg);
        }

      },

      () => { }

    );

    return () => {
      scanner.clear().catch(() => { });
    };

  }, []);


  const confirmExit = async () => {

    try {

      const res = await API.post(`/security/confirm/${gatepass.id}`);

      if (res.data.success) {

        setMessage("Exit recorded successfully");
        setStudent(null);
      }

    } catch (err) {

      setMessage("Error confirming exit");

    }

  };


  return (

    <div style={{
      maxWidth: "350px",
      margin: "auto",
      textAlign: "center"
    }}>

      <h2>Security QR Scanner</h2>

      <div id="qr-reader" style={{ width: "100%" }} />

      {message && (
        <p style={{ marginTop: "10px", color: "white" }}>
          {message}
        </p>
      )}

      {student && (

        <div style={{
          marginTop: "20px",
          background: "#111",
          color: "white",
          padding: "15px",
          borderRadius: "10px"
        }}>

          <img
            src={student.profile_image}
            alt="student"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "10px",
              objectFit: "cover",
              marginBottom: "10px"
            }}
          />

          <h3>{student.name}</h3>

          <p>Roll No: {student.roll_no}</p>

          <p>Year: {student.year}</p>

          <p>Section: {student.section}</p>

          <p>Department: {student.department}</p>

          <button
            onClick={confirmExit}
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "green",
              border: "none",
              color: "white",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Confirm Exit
          </button>

        </div>

      )}

    </div>

  );

}