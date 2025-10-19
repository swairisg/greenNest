// src/Components/qualityControl/api/qualityApi.js
import api from "../../../api"; // ✅ shared axios singleton

const getBase = (role = "farmer") =>
  role === "admin" ? "/api/admin/quality" : "/api/farmer/quality";

export const listQuality = async (role = "farmer", params = {}, config = {}) => {
  const { data } = await api.get(getBase(role), { params, ...config });
  return data.items ?? []; // farmer returns {items}; admin may return pagination
};

export const createQuality = async (payload, role = "farmer", config = {}) => {
  const { data } = await api.post(getBase(role), payload, config);
  return data.item ?? data;
};

export const getQuality = async (id, role = "farmer", config = {}) => {
  const { data } = await api.get(`${getBase(role)}/${id}`, config);
  return data.item ?? data;
};

export const updateQuality = async (id, payload, role = "admin", config = {}) => {
  const { data } = await api.patch(`${getBase(role)}/${id}`, payload, config);
  return data.item ?? data;
};

export const deleteQuality = async (id, role = "farmer", config = {}) => {
  const { data } = await api.delete(`${getBase(role)}/${id}`, config);
  return data.item ?? data;
};

export const updateQualityGrade = async (id, payload, config = {}) => {
  const { data } = await api.patch(`/api/admin/quality/${id}/grade`, payload, config);
  return data.item ?? data;
};