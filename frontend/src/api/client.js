import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor: attach auth token if available
api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("access") || localStorage.getItem("access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor: silent token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/hr/login/")
    ) {
      const refreshToken =
        sessionStorage.getItem("refresh") || localStorage.getItem("refresh");

      if (!refreshToken || originalRequest.url?.includes("/token/refresh/")) {
        sessionStorage.removeItem("access");
        sessionStorage.removeItem("refresh");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        if (
          window.location.pathname.startsWith("/hr") &&
          window.location.pathname !== "/hr/login"
        ) {
          window.location.replace("/hr/login");
        }

        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccess = data.access;
        sessionStorage.setItem("access", newAccess);
        if (localStorage.getItem("access")) {
          localStorage.setItem("access", newAccess);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        sessionStorage.removeItem("access");
        sessionStorage.removeItem("refresh");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        if (
          window.location.pathname.startsWith("/hr") &&
          window.location.pathname !== "/hr/login"
        ) {
          window.location.replace("/hr/login");
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
