// src/api.js
import axios from "axios";

export const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5001";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // set true only if you use cookies/sessions
});

export default api;

//Then in components, always build URLs from this:

//import { api, API_BASE } from "./api";

// Example
// const res = await api.get("/users");
// OR: const res = await fetch(`${API_BASE}/users`);
