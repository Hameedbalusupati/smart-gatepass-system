import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

/* ======================================
   STRICT EMAIL FORMAT
   23kq1a54g7@pace.ac.in
====================================== */

const STUDENT_REGEX =
  /^[0-9]{2}[a-z]{2}[0-9][a-z][0-9]{2}[a-z0-9]@pace\.ac\.in$/;

const DOMAIN_REGEX =
  /^[a-z0-9._-]+@pace\.ac\.in$/;

export default function Register() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    college_id: "",
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    year: "",
    section: "",
    profile_image: null,
  });

  /* ================= HANDLE INPUT ================= */

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

  };



  /* ================= IMAGE VALIDATION ================= */

  const handleImageChange = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    setForm((prev) => ({ ...prev, profile_image: file }));
    setPreview(URL.createObjectURL(file));

  };



  /* ================= REGISTER ================= */

  const handleRegister = async (e) => {

    e.preventDefault();
    if (loading) return;

    setError("");

    const email = form.email.trim().toLowerCase();
    const collegeId = form.college_id.trim().toLowerCase();



    /* ===== EMAIL DOMAIN CHECK ===== */

    if (!DOMAIN_REGEX.test(email)) {
      setError("Use valid college email (@pace.ac.in)");
      return;
    }



    /* ===== STUDENT EMAIL FORMAT ===== */

    if (form.role === "student" && !STUDENT_REGEX.test(email)) {
      setError("Email must be like 23kq1a54g7@pace.ac.in");
      return;
    }



    /* ===== EMAIL = COLLEGE ID CHECK ===== */

    if (form.role === "student") {

      const expectedEmail = `${collegeId}@pace.ac.in`;

      if (email !== expectedEmail) {
        setError("Email must match your College ID");
        return;
      }

    }



    if (!collegeId || !form.name || !form.password) {
      setError("All required fields must be filled");
      return;
    }



    if (
      ["student", "faculty", "hod"].includes(form.role) &&
      !form.department
    ) {
      setError("Department is required");
      return;
    }



    if (
      ["student", "faculty"].includes(form.role) &&
      (!form.year || !form.section)
    ) {
      setError("Year and Section are required");
      return;
    }



    if (form.role === "student" && !form.profile_image) {
      setError("Student image is required");
      return;
    }



    setLoading(true);



    try {

      const formData = new FormData();

      formData.append("college_id", collegeId);
      formData.append("name", form.name.trim());
      formData.append("email", email);
      formData.append("password", form.password);
      formData.append("role", form.role);

      if (["student", "faculty", "hod"].includes(form.role)) {
        formData.append("department", form.department);
      }

      if (["student", "faculty"].includes(form.role)) {
        formData.append("year", form.year);
        formData.append("section", form.section);
      }

      if (form.profile_image) {
        formData.append("profile_image", form.profile_image);
      }



      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      alert("Registered Successfully");
      navigate("/login");

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

        {error && (
          <p style={{ color: "#ef4444", textAlign: "center" }}>
            {error}
          </p>
        )}

        <input
          style={input}
          name="college_id"
          placeholder="College ID (23kq1a54g7)"
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
          type="text"
          name="email"
          placeholder="College Email (23kq1a54g7@pace.ac.in)"
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

        {form.role === "student" && (
          <>
            <input
              style={input}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {preview && (
              <img
                src={preview}
                alt="Preview"
                style={{ width: "120px", borderRadius: "8px" }}
              />
            )}
          </>
        )}

        <button style={btn} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

      </form>
    </div>
  );
}



/* ================= STYLES ================= */

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
  cursor: "pointer",
};