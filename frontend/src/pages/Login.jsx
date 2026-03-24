import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../index.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // =========================
  // CAMERA INIT (FINAL FIX ✅)
  // =========================
  useEffect(() => {
    let isMounted = true;
    let videoElement = videoRef.current; // ✅ FIX

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoElement) {
          videoElement.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);

        if (isMounted) {
          setError("Camera access denied. Please allow camera.");
        }
      }
    };

    initCamera();

    // =========================
    // CLEANUP (SAFE ✅)
    // =========================
    return () => {
      isMounted = false;

      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // =========================
  // LOGIN FUNCTION
  // =========================
  const loginUser = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || video.videoWidth === 0) {
        setError("Camera not ready. Please wait...");
        return;
      }

      // Capture image
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg")
      );

      // Send FormData
      const formData = new FormData();
      formData.append("email", email.toLowerCase());
      formData.append("password", password);
      formData.append("image", blob, "login.jpg");

      const res = await API.post("/auth/login", formData);

      const data = res.data;

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);

      navigate(`/${data.role}`);

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Cannot reach server"
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Smart Gatepass Login</h2>

        {error && <div className="error">{error}</div>}

        {/* CAMERA */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            borderRadius: "10px",
            marginBottom: "10px",
          }}
        ></video>

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