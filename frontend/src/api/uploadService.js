import API from "./api.js";

/**
 * 📸 UPLOAD PROFILE IMAGE
 */
export const uploadProfile = async (file) => {
  try {
    // ================= VALIDATION =================
    if (!file) {
      throw new Error("Please select an image");
    }

    // ✅ File type check
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files allowed");
    }

    // ✅ File size check (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image must be less than 5MB");
    }

    // ================= FORM DATA =================
    const formData = new FormData();
    formData.append("image", file); // MUST match backend

    // ================= TOKEN =================
    const token = localStorage.getItem("access_token");

    // ================= API CALL =================
    const response = await API.post(
      "/upload/upload-profile",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // ❌ Do NOT set Content-Type manually
        },
      }
    );

    console.log("✅ Upload Success:", response.data);

    // ================= SAVE USER =================
    if (response.data?.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // 🔥 Update UI (navbar/profile)
      window.dispatchEvent(new Event("authChanged"));
    }

    return response.data;

  } catch (error) {
    console.error(
      "❌ Upload Error:",
      error?.response?.data || error.message
    );

    let message = "Upload failed";

    if (error.response?.status === 401) {
      message = "Unauthorized - please login again";
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }

    throw new Error(message);
  }
};


/**
 * 🖼️ GET PROFILE IMAGE
 */
export const getProfileImage = async () => {
  try {
    const token = localStorage.getItem("access_token");

    const response = await API.get("/upload/profile-image", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Image Fetch Success:", response.data);

    return response.data;

  } catch (error) {
    console.error(
      "❌ Fetch Image Error:",
      error?.response?.data || error.message
    );

    throw error;
  }
};