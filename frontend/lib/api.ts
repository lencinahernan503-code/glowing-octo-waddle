import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://feriant-api.onrender.com",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["bypass-tunnel-reminder"] = "true";
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;
    // Retry once on network error or 502/503 (Render cold start)
    if (!config._retry && (!error.response || [502, 503, 504].includes(error.response?.status))) {
      config._retry = true;
      await new Promise((r) => setTimeout(r, 4000));
      return api(config);
    }
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);
