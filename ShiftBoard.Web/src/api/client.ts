import axios from "axios";

export const AUTH_STORAGE_KEY = "shiftboard.auth";
export const UNAUTHORIZED_EVENT = "shiftboard:unauthorized";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5199/api";

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    const { token } = JSON.parse(stored) as { token: string };
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);
