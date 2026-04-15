import API from "./api.js";

/**
 * 🔐 LOGIN USER
 * @param {Object} data - { email, password }
 */
export const loginUser = async (data) => {
  try {
    const response = await API.post("/login", data);

    // ✅ Store token
    if (response.data?.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
    }

    // ✅ Store user details
    if (response.data?.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error("Login Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 📝 REGISTER USER
 * @param {Object} data - user registration data
 */
export const registerUser = async (data) => {
  try {
    const response = await API.post("/register", data);
    return response.data;
  } catch (error) {
    console.error("Register Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 👤 GET CURRENT USER (from localStorage)
 */
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Parse Error:", error.message);
    return null;
  }
};

/**
 * 🔓 LOGOUT USER
 */
export const logoutUser = () => {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  } catch (error) {
    console.error("Logout Error:", error.message);
  }
};

/**
 * 🔑 CHECK AUTH STATUS
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("access_token");
};