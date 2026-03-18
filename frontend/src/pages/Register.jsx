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
    profile_image: null,   // student
    face_image: null       // faculty
  });


  // ================= INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };


  // ================= IMAGE =================
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

    if (type === "student") {
      setForm(prev => ({ ...prev, profile_image: file }));
    } else {
      setForm(prev => ({ ...prev, face_image: file }));
    }

    setPreview(URL.createObjectURL(file));
  };


  // ================= REGISTER =================
  const handleRegister = async (e) => {

    e.preventDefault();
    if (loading) return;

    setError("");

    const collegeId = form.college_id.trim();
    const email = form.email.trim();

    const parts = email.split("@");

    if (parts.length !== 2) {
      setError("Invalid email format");
      return;
    }

    const emailUser = parts[0];
    const domain = parts[1];

    if (domain.toLowerCase() !== "pace.ac.in") {
      setError("Email must end with @pace.ac.in");
      return;
    }

    // ===== STUDENT RULE =====
    if (form.role === "student") {
      if (emailUser.toLowerCase() !== collegeId.toLowerCase()) {
        setError("Student email must match Roll Number");
        return;
      }
    }

    // ===== FACULTY RULE =====
    if (form.role === "faculty") {
      if (!/^[0-9]+$/.test(collegeId)) {
        setError("Faculty ID must be numeric");
        return;
      }
    }

    // ===== REQUIRED =====
    if (!collegeId || !form.name || !form.password) {
      setError("All required fields must be filled");
      return;
    }

    if (["student", "faculty", "hod"].includes(form.role) && !form.department) {
      setError("Department required");
      return;
    }

    if (["student", "faculty"].includes(form.role) && (!form.year || !form.section)) {
      setError("Year & Section required");
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

      if (["student", "faculty", "hod"].includes(form.role)) {
        formData.append("department", form.department);
      }

      if (["student", "faculty"].includes(form.role)) {
        formData.append("year", form.year);
        formData.append("section", form.section);
      }

      // ✅ Student image
      if (form.profile_image) {
        formData.append("profile_image", form.profile_image);
      }

      // ✅ Faculty face image
      if (form.face_image) {
        formData.append("face_image", form.face_image);
      }

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      alert("Registered Successfully ✅");
      navigate("/login");

    } catch (err) {
      console.error(err);
      setError("Server error");
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

        <input style={input} name="college_id" placeholder="College ID" onChange={handleChange} />
        <input style={input} name="name" placeholder="Full Name" onChange={handleChange} />
        <input style={input} name="email" placeholder="Email" onChange={handleChange} />
        <input style={input} type="password" name="password" placeholder="Password" onChange={handleChange} />

        <select style={input} name="role" onChange={handleChange}>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="hod">HOD</option>
          <option value="security">Security</option>
        </select>

        {form.role !== "security" && (
          <input style={input} name="department" placeholder="Department" onChange={handleChange} />
        )}

        {showYearSection && (
          <>
            <input style={input} name="year" placeholder="Year" onChange={handleChange} />
            <input style={input} name="section" placeholder="Section" onChange={handleChange} />
          </>
        )}

        {/* STUDENT IMAGE */}
        {form.role === "student" && (
          <>
            <input type="file" onChange={(e) => handleImageChange(e, "student")} />
          </>
        )}

        {/* FACULTY FACE */}
        {form.role === "faculty" && (
          <>
            <p style={{ color: "white" }}>Upload Face Image</p>
            <input type="file" onChange={(e) => handleImageChange(e, "faculty")} />
          </>
        )}

        {preview && (
          <img src={preview} alt="Preview" style={{ width: "120px" }} />
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
  width: "420px",
  background: "#020617",
  padding: "25px",
  borderRadius: "10px"
};

const title = {
  color: "white",
  textAlign: "center"
};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
  background: "#020617",
  color: "white",
  border: "1px solid #374151"
};

const btn = {
  width: "100%",
  padding: "12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};