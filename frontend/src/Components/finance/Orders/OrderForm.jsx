import React, { useState } from "react";
import { createOrder } from "./orderApi";

export default function OrderForm() {
  const [userId, setUserId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        userId,
        items: [{ productId, qty: Number(qty) }],
        shipping: { method: "Standard" }
      };
      const res = await createOrder(orderData);
      setMessage(`Order created: ${res.data.orderNo}`);
    } catch (err) {
      console.error(err);
      setMessage("Failed to create order");
    }
  };

  return (
    <div>
      <h2>Create Order (Checkout)</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>User ID: </label>
          <input value={userId} onChange={e => setUserId(e.target.value)} required />
        </div>
        <div>
          <label>Product ID: </label>
          <input value={productId} onChange={e => setProductId(e.target.value)} required />
        </div>
        <div>
          <label>Quantity: </label>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} required />
        </div>
        <button type="submit">Place Order</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}