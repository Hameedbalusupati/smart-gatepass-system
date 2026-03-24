import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../index.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // =========================
  // START CAMERA (FIXED)
  // =========================
  const startCamera = async () => {
    setError("");

    try {
      // ✅ Stop old stream
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });

      videoRef.current.srcObject = mediaStream;

      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };

      setStream(mediaStream);
      setCameraOn(true);

    } catch (err) {
      console.error("Camera error:", err);

      if (err.name === "NotAllowedError") {
        setError("Please allow camera permission.");
      } else if (err.name === "NotReadableError") {
        setError("Camera is already in use.");
      } else {
        setError("Unable to access camera.");
      }
    }
  };

  // =========================
  // STOP CAMERA
  // =========================
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraOn(false);
  };

  // =========================
  // LOGIN FUNCTION
  // =========================
  const loginUser = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let blob = null;

      if (cameraOn && videoRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.videoWidth === 0) {
          setError("Camera not ready.");
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        blob = await new Promise(resolve =>
          canvas.toBlob(resolve, "image/jpeg")
        );
      }

      const formData = new FormData();
      formData.append("email", email.toLowerCase());
      formData.append("password", password);

      if (blob) {
        formData.append("image", blob, "login.jpg");
      }

      const res = await API.post("/auth/login", formData);
      const data = res.data;

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);

      stopCamera();

      navigate(`/${data.role}`);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Smart Gatepass Login</h2>

        {error && <div className="error">{error}</div>}

        {/* CAMERA SECTION */}
        {!cameraOn ? (
          <button onClick={startCamera}>
            Enable Camera
          </button>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted   // ✅ IMPORTANT FIX
              style={{
                width: "100%",
                borderRadius: "10px",
                marginBottom: "10px",
              }}
            />

            <button onClick={stopCamera}>Close Camera</button>
          </>
        )}

        {/* FORM */}
        <form onSubmit={loginUser}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>

        {/* HIDDEN CANVAS */}
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      </div>
    </div>
  );
}