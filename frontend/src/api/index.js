// src/api/index.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001",
  headers: { "Content-Type": "application/json" },
  withCredentials: false, // using Bearer tokens, not cookies
});

export default api;