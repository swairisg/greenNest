// src/Components/qualityControl/api/axios.js
import axios from "axios";

// CRA rule: env vars must start with REACT_APP_
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5001";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});