// src/Components/qualityControl/api/qualityApi.js
import { api } from "./axios";

const base = "/quality"; // backend route

export const listQuality = async () => {
  const { data } = await api.get(base);
  return data.users ?? [];
};

export const createQuality = async (payload) => {
  const { data } = await api.post(base, payload);
  return data.users;
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