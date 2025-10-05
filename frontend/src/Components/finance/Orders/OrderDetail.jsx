import React, { useEffect, useState } from "react";
import { fetchOrderById } from "./orderApi";
import { useParams } from "react-router-dom";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrderById(id)
      .then(res => setOrder(res.data.order))
      .catch(err => console.error(err));
  }, [id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div>
      <h2>Order Details</h2>
      <p><b>Order No:</b> {order.orderNo}</p>
      <p><b>User ID:</b> {order.userId}</p>
      <p><b>Status:</b> {order.status}</p>
      <p><b>Payment:</b> {order.paymentStatus}</p>
      <p><b>Total:</b> {order.amounts?.grandTotal}</p>

      <h3>Items:</h3>
      <ul>
        {order.items.map((item, idx) => (
          <li key={idx}>
            {item.name} – {item.qty} × {item.unitPrice}
          </li>
        ))}
      </ul>
    </div>
  );
}