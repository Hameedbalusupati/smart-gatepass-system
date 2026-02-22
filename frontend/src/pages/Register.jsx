import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

const COLLEGE_DOMAIN = "@pace.ac.in";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    college_id: "",
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    year: "",
    section: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      let updated = { ...prev, [name]: value };

      if (name === "role") {
        if (value === "security") {
          updated.department = "";
          updated.year = "";
          updated.section = "";
        } else if (value === "hod") {
          updated.year = "";
          updated.section = "";
        }
      }

      return updated;
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    const email = form.email.trim().toLowerCase();

    // ===============================
    // VALIDATION
    // ===============================
    if (!email.endsWith(COLLEGE_DOMAIN)) {
      setError("Use college email (@pace.ac.in)");
      return;
    }

    if (!form.college_id || !form.name || !form.password || !form.role) {
      setError("All required fields must be filled");
      return;
    }

    if (
      (form.role === "student" || form.role === "faculty") &&
      (!form.department || !form.year || !form.section)
    ) {
      setError("Department, Year and Section are required");
      return;
    }

    if (form.role === "hod" && !form.department) {
      setError("Department required for HOD");
      return;
    }

    setLoading(true);

    // ===============================
    // BUILD PAYLOAD (MATCH BACKEND)
    // ===============================
    const payload = {
      college_id: form.college_id.trim(),
      name: form.name.trim(),
      email,
      password: form.password,
      role: form.role,
    };

    if (form.role === "student" || form.role === "faculty") {
      payload.department = form.department;
      payload.year = parseInt(form.year, 10); // 🔥 IMPORTANT
      payload.section = form.section;
    }

    if (form.role === "hod") {
      payload.department = form.department;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      alert("Registered successfully ✅");
      navigate("/");

    } catch (err) {
      console.error(err);
      setError("Cannot reach server");
    } finally {
      setLoading(false);
    }
  };

  const showYearSection =
    form.role === "student" || form.role === "faculty";

  return (
    <div style={container}>
      <form onSubmit={handleRegister} style={box}>
        <h2 style={title}>Register</h2>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <input
          style={input}
          name="college_id"
          placeholder="College ID"
          value={form.college_id}
          onChange={handleChange}
        />

        <input
          style={input}
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          style={input}
          type="email"
          name="email"
          placeholder={`Email (${COLLEGE_DOMAIN})`}
          value={form.email}
          onChange={handleChange}
        />

        <input
          style={input}
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <select
          style={input}
          name="role"
          value={form.role}
          onChange={handleChange}
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="hod">HOD</option>
          <option value="security">Security</option>
        </select>

        {form.role !== "security" && (
          <select
            style={input}
            name="department"
            value={form.department}
            onChange={handleChange}
          >
            <option value="">Select Department</option>
            <option value="CSE">CSE</option>
            <option value="EEE">EEE</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
            <option value="CE">CE</option>
            <option value="AIDS">AIDS</option>
            <option value="AIML">AIML</option>
            <option value="IT">IT</option>
          </select>
        )}

        {showYearSection && (
          <>
            <select
              style={input}
              name="year"
              value={form.year}
              onChange={handleChange}
            >
              <option value="">Select Year</option>
              <option value="1">1st</option>
              <option value="2">2nd</option>
              <option value="3">3rd</option>
              <option value="4">4th</option>
            </select>

            <select
              style={input}
              name="section"
              value={form.section}
              onChange={handleChange}
            >
              <option value="">Select Section</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </>
        )}

        <button style={btn} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}

/* ===== STYLES ===== */
const container = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0f172a",
};

const box = {
  width: "420px",
  background: "#020617",
  padding: "25px",
  borderRadius: "10px",
};

const title = {
  color: "white",
  textAlign: "center",
};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
  background: "#020617",
  color: "white",
  border: "1px solid #374151",
};

const btn = {
  width: "100%",
  padding: "12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
};