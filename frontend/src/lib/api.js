import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nadi_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const formatRp = (n) => {
  if (n == null || isNaN(n)) return "Rp0";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
};

export const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric"
    });
  } catch { return iso; }
};

export const formatDateTime = (iso) => {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    });
  } catch { return iso; }
};
