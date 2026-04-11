import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://smart-gatepass-system.onrender.com/api",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= ATTACH TOKEN =================
API.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // 🔥 ✅ FIXED HERE
      const token = sessionStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================= OPTIONAL: AUTO LOGOUT ON 401 =================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 🔥 Token expired or invalid → logout
      sessionStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;