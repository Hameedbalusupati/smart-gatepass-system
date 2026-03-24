import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../index.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // LOGIN FUNCTION
  // =========================
  const loginUser = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", {
        email: email.toLowerCase(),
        password: password,
      });

      const data = res.data;

      // Save token & role
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);

      // Redirect based on role
      navigate(`/${data.role}`);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Smart Gatepass Login</h2>

        {error && <div className="error">{error}</div>}

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

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}