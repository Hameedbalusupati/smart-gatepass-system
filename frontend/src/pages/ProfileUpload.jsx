import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadProfile } from "../api/uploadService";

function ProfileUpload() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ================= FILE SELECT =================
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // ✅ Validate type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    // ✅ Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // ================= UPLOAD =================
  const handleUpload = async () => {
    if (!image) {
      alert("Please select an image first");
      return;
    }

    try {
      setLoading(true);

      // 🔥 FIX: send FILE directly (NOT FormData)
      const res = await uploadProfile(image);

      alert(res?.message || "Upload successful");

      // ✅ Redirect to dashboard
      navigate("/student");

    } catch (error) {
      alert(
        error.message || "Upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Upload Profile Image</h2>

        {/* 📸 Preview */}
        {preview && (
          <img
            src={preview}
            alt="Preview"
            style={styles.imagePreview}
          />
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />

        <br /><br />

        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>

        <br /><br />

        <button onClick={() => navigate("/student")}>
          Skip (Go to Dashboard)
        </button>
      </div>
    </div>
  );
}

export default ProfileUpload;

// ================= STYLES =================
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#0f172a",
  },
  card: {
    padding: "30px",
    border: "1px solid #334155",
    borderRadius: "10px",
    textAlign: "center",
    background: "#111827",
    color: "white",
  },
  imagePreview: {
    width: "150px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "50%",
    marginBottom: "10px",
  },
};