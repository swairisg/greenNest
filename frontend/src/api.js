// src/api.js
import axios from "axios";

// Include `/api` in the default so calls hit /api/*
export const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5001";

  // Cloudinary direct (unsigned) uploader
export async function uploadToCloudinary(file) {
  const CLOUD = process.env.REACT_APP_CLOUDINARY_CLOUD;
  const PRESET = process.env.REACT_APP_CLOUDINARY_PRESET;
  if (!CLOUD || !PRESET) throw new Error("Cloudinary env vars missing");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);

  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
    fd,
    { headers: { "X-Requested-With": "XMLHttpRequest" } }
  );
  return { url: data.secure_url };
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // keep true only if you use cookies; for Bearer tokens it's not required
});

export const ProductsAPI = {
  list: (params) => api.get("/products", { params }).then(r => r.data),
  filters: () => api.get("/products/filters").then(r => r.data),
  adminAll: (params) => api.get("/products", { params }).then(r => r.data),
  get: (id) => api.get(`/products/${id}`).then(r => r.data),
  create: (body) => api.post("/products", body).then(r => r.data),
  update: (id, body) => api.put(`/products/${id}`, body).then(r => r.data),
  remove: (id) => api.delete(`/products/${id}`).then(r => r.data),
};

export default api;
