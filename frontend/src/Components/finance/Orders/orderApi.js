import axios from "axios";

const API_BASE = "http://localhost:5001"; // adjust if needed

// Create new order
export const createOrder = (data) => axios.post(`${API_BASE}/orders`, data);

// Get all orders
export const fetchOrders = () => axios.get(`${API_BASE}/orders`);

// Get order by ID
export const fetchOrderById = (id) => axios.get(`${API_BASE}/orders/${id}`);

// Confirm order
export const confirmOrder = (id) => axios.post(`${API_BASE}/orders/${id}/confirm`);

// Mark as paid
export const markPaid = (id) => axios.post(`${API_BASE}/orders/${id}/mark-paid`);

// Delete order
export const deleteOrder = (id) => axios.delete(`${API_BASE}/orders/${id}`);