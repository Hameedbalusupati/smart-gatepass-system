import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function UploadImage() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= FILE CHANGE =================
  const handleChange = (e) => {
    const selected = e.target.files[0];

    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Only image files allowed");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
  };

  // ================= UPLOAD =================
  const handleUpload = async () => {
    if (!file) {
      setError("Please select image");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("image", file);

      await API.post("/student/update_profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Image uploaded successfully ✅");

      navigate("/student"); // go to dashboard

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2>Upload Profile Image</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <input type="file" accept="image/*" onChange={handleChange} />

        {preview && (
          <img src={preview} alt="preview" style={styles.image} />
        )}

        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>

      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a"
  },
  card: {
    background: "#020617",
    padding: "20px",
    borderRadius: "10px",
    color: "white",
    textAlign: "center"
  },
  image: {
    width: "120px",
    marginTop: "10px",
    borderRadius: "10px"
  }
};