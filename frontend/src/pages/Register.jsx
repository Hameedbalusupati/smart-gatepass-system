import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

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
    face_image: null
  });

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ================= IMAGE HANDLER =================
  const handleImageChange = (e, type) => {
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

    setForm(prev => ({
      ...prev,
      [type]: file
    }));

    setPreview(URL.createObjectURL(file));
  };

  // ================= REGISTER =================
  const handleRegister = async (e) => {

    e.preventDefault();
    if (loading) return;

    setError("");

    const collegeId = form.college_id.trim();
    const email = form.email.trim().toLowerCase();

    // ================= VALIDATION =================
    if (!collegeId || !form.name || !form.password) {
      setError("All required fields must be filled");
      return;
    }

    if (!email.includes("@pace.ac.in")) {
      setError("Email must be @pace.ac.in");
      return;
    }

    if (form.role === "student" && !form.profile_image) {
      setError("Student image required");
      return;
    }

    if (form.role === "faculty" && !form.face_image) {
      setError("Faculty face image required");
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

      if (form.department) formData.append("department", form.department);
      if (form.year) formData.append("year", form.year);
      if (form.section) formData.append("section", form.section);

      if (form.role === "student") {
        formData.append("profile_image", form.profile_image);
      }

      if (form.role === "faculty") {
        formData.append("face_image", form.face_image);
      }

      // ✅ FIXED URL
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: formData
      });

      let data;

      try {
        data = await res.json();
      } catch {
        const text = await res.text();
        console.error("SERVER ERROR:", text);
        setError("Server crashed (non-JSON response)");
        return;
      }

      console.log("RESPONSE:", data);

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      alert("Registered Successfully ✅");
      navigate("/login");

    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  const showYearSection =
    form.role === "student" || form.role === "faculty";

  // ================= UI =================
  return (
    <div style={container}>
      <form onSubmit={handleRegister} style={box}>

        <h2 style={title}>Register</h2>

        {error && <p style={{ color: "#ef4444" }}>{error}</p>}

        <input style={input} name="college_id" placeholder="College ID" onChange={handleChange} required />
        <input style={input} name="name" placeholder="Full Name" onChange={handleChange} required />
        <input style={input} name="email" placeholder="College Email" onChange={handleChange} required />
        <input style={input} type="password" name="password" placeholder="Password" onChange={handleChange} required />

        <select style={input} name="role" onChange={handleChange}>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="hod">HOD</option>
          <option value="security">Security</option>
        </select>

        {form.role !== "security" && (
          <select style={input} name="department" onChange={handleChange}>
            <option value="">Select Department</option>
            <option value="CSE">CSE</option>
            <option value="AIDS">AIDS</option>
          </select>
        )}

        {showYearSection && (
          <>
            <select style={input} name="year" onChange={handleChange}>
              <option value="">Year</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>

            <select style={input} name="section" onChange={handleChange}>
              <option value="">Section</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </>
        )}

        {form.role === "student" && (
          <input type="file" onChange={(e) => handleImageChange(e, "profile_image")} />
        )}

        {form.role === "faculty" && (
          <input type="file" onChange={(e) => handleImageChange(e, "face_image")} />
        )}

        {preview && (
          <img src={preview} alt="Preview" style={{ width: "100px" }} />
        )}

        <button style={btn} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

      </form>
    </div>
  );
}

// ================= STYLES =================
const container = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0f172a"
};

const box = {
  width: "400px",
  background: "#020617",
  padding: "20px",
  borderRadius: "10px"
};

const title = {
  color: "white",
  textAlign: "center"
};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px"
};

const btn = {
  width: "100%",
  padding: "10px",
  background: "#2563eb",
  color: "white",
  border: "none"
};