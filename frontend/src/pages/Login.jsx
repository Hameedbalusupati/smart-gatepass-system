import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../index.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginUser = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/auth/login", {
        email: email.toLowerCase(),
        password,
      });

      const data = res.data;
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);

      navigate(`/${data.role}`);

    } catch (err) {
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

        <form onSubmit={loginUser}>
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}