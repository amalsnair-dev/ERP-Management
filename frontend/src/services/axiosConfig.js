/* src/services/axiosConfig.js */
import axios from "axios";

// Read environment variables (Vite style)
const protocol = import.meta.env.VITE_API_PROTOCOL || "http";
const host = import.meta.env.VITE_API_HOST;
const port = import.meta.env.VITE_API_PORT || "8080";
const project = import.meta.env.VITE_API_PROJECT || "aurixwebapi";

// When host is empty, use relative path '/aurixwebapi/' (proxied by Vite to http://localhost:8080)
const baseURL =
  host && host.trim() !== ""
    ? `${protocol}://${host}:${port}/${project}/`
    : `/${project}/`;

// ✅ Default Axios instance (with Security Interceptor)
const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔒 Interceptor: attaches username & password automatically from session or localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const userStr = sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.username && user.password) {
        config.headers["username"] = user.username.trim().toUpperCase();
        config.headers["password"] = user.password.trim();
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Axios instance without any headers (for login page only)
export const axiosInstanceNoHeader = axios.create({
  baseURL,
});

export default axiosInstance;
