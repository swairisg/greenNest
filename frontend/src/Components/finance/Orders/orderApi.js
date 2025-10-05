import axios from "axios";

// Use env when available; strip trailing slashes. Default to current local port.
const API_BASE =
  (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.replace(/\/+$/, "")) ||
  "http://localhost:5001";

// Backend mount path defined in backend/app.js:
// app.use("/api/finance/orders", orderRoutes);
const ORDERS_BASE = `${API_BASE}/api/finance/orders`;

// Create new order
export const createOrder = (data) =>
  axios.post(ORDERS_BASE, data, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// Get all orders
export const fetchOrders = () => axios.get(ORDERS_BASE);

// Get order by ID
export const fetchOrderById = (id) => axios.get(`${ORDERS_BASE}/${id}`);

// Confirm order
export const confirmOrder = (id) => axios.post(`${ORDERS_BASE}/${id}/confirm`);

// Mark as paid
export const markPaid = (id) => axios.post(`${ORDERS_BASE}/${id}/mark-paid`);

// Delete order
export const deleteOrder = (id) => axios.delete(`${ORDERS_BASE}/${id}`);