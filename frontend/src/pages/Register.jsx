import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Register() {
  const navigate = useNavigate();

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

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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

    setError("");
    setForm((prev) => ({ ...prev, profile_image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (!form.college_id || !form.name || !form.email || !form.password) {
        throw new Error("All fields are required");
      }

      if (!form.email.endsWith("@pace.ac.in")) {
        throw new Error("Use college email (@pace.ac.in)");
      }

      const formData = new FormData();

      formData.append("college_id", form.college_id.toUpperCase());
      formData.append("name", form.name);
      formData.append("email", form.email.toLowerCase());
      formData.append("password", form.password);
      formData.append("role", form.role);

      if (form.department) formData.append("department", form.department);
      if (form.year) formData.append("year", form.year);
      if (form.section) formData.append("section", form.section);

      if (form.profile_image) {
        formData.append("profile_image", form.profile_image);
      }

      // 🔥 FIXED (no unused variable)
      await API.post("/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Registered Successfully 🎉");
      navigate("/login");

    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Server error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.box}>

        <h2 style={styles.title}>Smart Gatepass Register</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <input style={styles.input} name="college_id" placeholder="College ID" onChange={handleChange} />
        <input style={styles.input} name="name" placeholder="Full Name" onChange={handleChange} />
        <input style={styles.input} name="email" placeholder="College Email" onChange={handleChange} />
        <input style={styles.input} type="password" name="password" placeholder="Password" onChange={handleChange} />

        <select style={styles.input} name="role" onChange={handleChange}>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="hod">HOD</option>
          <option value="security">Security</option>
        </select>

        <select style={styles.input} name="department" onChange={handleChange}>
          <option value="">Department</option>
          <option value="AIDS">AIDS</option>
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="EEE">EEE</option>
        </select>

        <select style={styles.input} name="year" onChange={handleChange}>
          <option value="">Year</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>

        <select style={styles.input} name="section" onChange={handleChange}>
          <option value="">Section</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>

        <input type="file" accept="image/*" onChange={handleImageChange} />

        {preview && <img src={preview} alt="preview" style={styles.preview} />}

        <button style={styles.button} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "350px",
    background: "#020617",
    padding: "20px",
    borderRadius: "10px",
    color: "white",
  },
  title: { textAlign: "center" },
  input: { width: "100%", padding: "10px", marginBottom: "10px" },
  button: {
    width: "100%",
    padding: "10px",
    background: "#2563eb",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  preview: { width: "100px", marginTop: "10px", borderRadius: "8px" },
};