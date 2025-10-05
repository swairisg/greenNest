import React, { useEffect, useState } from "react";
import { fetchOrders, confirmOrder, markPaid, deleteOrder } from "./orderApi";
import "./OrderList.css";

export default function OrderList() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders()
      .then(res => setOrders(res.data.orders))
      .catch(err => console.error(err));
  }, []);

  const handleConfirm = (id) => {
    confirmOrder(id).then(() => window.location.reload());
  };

  const handleMarkPaid = (id) => {
    markPaid(id).then(() => window.location.reload());
  };

  const handleDelete = (id) => {
    deleteOrder(id).then(() => window.location.reload());
  };

  return (
    <div className="order-list">
      <h2>Orders</h2>
      <table className="order-table">
        <thead>
          <tr>
            <th>Order No</th>
            <th>User ID</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td>{o.orderNo}</td>
              <td>{o.userId}</td>
              <td>{o.status}</td>
              <td>{o.paymentStatus}</td>
              <td>{o.amounts?.grandTotal}</td>
              <td>
                <div className="actions">
                  <button className="btn confirm" onClick={() => handleConfirm(o._id)}>Confirm</button>
                  <button className="btn paid" onClick={() => handleMarkPaid(o._id)}>Mark Paid</button>
                  <button className="btn delete" onClick={() => handleDelete(o._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}