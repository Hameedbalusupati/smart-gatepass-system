import API from "./api";

/**
 * 📸 UPLOAD PROFILE IMAGE
 * @param {FormData} formData - image file
 */
export const uploadProfile = async (formData) => {
  try {
    const response = await API.post("/upload-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // ✅ If backend returns updated user, store it
    if (response.data?.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error("Upload Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 🖼️ GET PROFILE IMAGE (optional)
 */
export const getProfileImage = async () => {
  try {
    const response = await API.get("/profile-image");
    return response.data;
  } catch (error) {
    console.error("Fetch Image Error:", error.response?.data || error.message);
    throw error;
  }
};