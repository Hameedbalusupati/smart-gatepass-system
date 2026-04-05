import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../index.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // ================= LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    // ================= VALIDATION =================
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        email,
        password
      });

      const data = res.data;

      console.log("LOGIN RESPONSE:", data);

      // ================= STORE DATA =================
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name || "");
      localStorage.setItem("user_id", data.id || "");
      localStorage.setItem("email", email);

      //  IMPORTANT → UPDATE NAVBAR
      window.dispatchEvent(new Event("authChanged"));

      // ================= NAVIGATE =================
      if (data.role === "student") {
        navigate("/student");
      } else if (data.role === "faculty") {
        navigate("/faculty");
      } else if (data.role === "hod") {
        navigate("/hod");
      } else if (data.role === "security") {
        navigate("/security");
      } else {
        navigate("/");
      }

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.response) {
        setError(err.response.data?.message || "Login failed");
      } else {
        setError("Server not reachable");
      }

    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2>Smart Gatepass Login</h2>

        {error && (
          <div className="error" style={{ marginBottom: "10px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>
    </div>
  );
}