// src/Components/qualityControl/api/qualityApi.js
import { api } from "./axios";

// Backend mounts at /api/quality
const base = "/api/quality";

export const listQuality = async () => {
  const { data } = await api.get(base);
  return data.items ?? [];
};

export const createQuality = async (payload) => {
  const { data } = await api.post(base, payload);
  return data.item;
};

export const getQuality = async (id) => {
  const { data } = await api.get(`${base}/${id}`);
  return data.item;
};

export const updateQuality = async (id, payload) => {
  const { data } = await api.put(`${base}/${id}`, payload);
  return data.item;
};

export const deleteQuality = async (id) => {
  const { data } = await api.delete(`${base}/${id}`);
  return data.item;
};