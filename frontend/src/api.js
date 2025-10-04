// src/api.js
import axios from "axios";

// Include `/api` in the default so calls hit /api/*
export const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5001";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // keep true only if you use cookies; for Bearer tokens it's not required
});

export default api;
