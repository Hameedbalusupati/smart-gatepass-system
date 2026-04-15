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

    // ================= CREATE FORM DATA =================
    const formData = new FormData();
    formData.append("image", file); // 🔥 must match backend key

    // ================= API CALL =================
    const response = await API.post(
      "/upload/upload-profile", // ✅ matches app.py route
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ Upload Success:", response.data);

    // ================= SAVE USER =================
    if (response.data?.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // 🔥 trigger UI update (navbar etc.)
      window.dispatchEvent(new Event("authChanged"));
    }

    return response.data;

  } catch (error) {
    console.error(
      "❌ Upload Error:",
      error?.response?.data || error.message
    );

    // ================= CLEAN ERROR MESSAGE =================
    let message = "Upload failed";

    if (error.response?.data?.error) {
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
 * 🖼️ GET PROFILE IMAGE (OPTIONAL)
 */
export const getProfileImage = async () => {
  try {
    const response = await API.get("/upload/profile-image");

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