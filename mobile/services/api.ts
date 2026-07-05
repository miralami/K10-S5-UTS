import axios from "axios";
import { API_BASE_URL, API_TIMEOUT } from "../constants/config";
import { getToken, saveToken, deleteToken } from "../utils/storage";
import { syncToken } from "../store/authStore";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { Accept: "application/json" },
});

// Request interceptor — inject token
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — 401 refresh + retry
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (v: any) => void;
  reject: (e: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL.replace(/\/+$/, '')}/api/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        const newToken = data.data?.access_token;
        if (newToken) {
          await saveToken(newToken);
          syncToken(newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        await deleteToken();
        // Auth store listener will catch this and redirect
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
