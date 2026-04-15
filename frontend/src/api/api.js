import axios from "axios";

// Create axios instance
const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://smart-gatepass-system.onrender.com/api",
  timeout: 20000,
});

// ✅ Attach token automatically to every request
API.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle common errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        console.log("Unauthorized - Please login again");

        // optional: auto logout
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        // redirect to login (optional)
        window.location.href = "/login";
      }

      if (status === 500) {
        console.log("Server error");
      }
    }

    return Promise.reject(error);
  }
);

export default API;