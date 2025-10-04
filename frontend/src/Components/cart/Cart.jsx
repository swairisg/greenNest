// frontend/src/Components/cart/Cart.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import CartItem from "./CartItem";
import { loadCart, updateQty, removeFromCart, clearCart } from "./cartUtils";

const API_BASE = "http://localhost:5001"; // adjust if your backend runs elsewhere

export default function Cart({ userId }) {
  // NOTE: pass userId from your auth context to this component
  const [items, setItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const onQtyChange = (productId, q) => setItems(updateQty(productId, q));
  const onRemove = (productId) => setItems(removeFromCart(productId));

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const placeOrder = async () => {
    if (!userId) {
      setMessage("Please log in first.");
      return;
    }
    if (items.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }
    try {
      setPlacing(true);
      setMessage("");

      // backend will re-fetch true price/name from the catalogue by productId
      const payload = {
        userId,
        items: items.map(i => ({ productId: i.productId, qty: i.qty })),
        shipping: { method: "Standard" }
      };

      const res = await axios.post(`${API_BASE}/orders`, payload);
      const orderNo = res.data.orderNo || res.data.order?.orderNo;

      clearCart();
      setItems([]);
      setMessage(`✅ Order placed successfully. Order No: ${orderNo}`);
    } catch (e) {
      console.error(e);
      setMessage("❌ Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div>
      <h2>Your Cart</h2>

      {items.length === 0 ? (
        <p>🛒 Your cart is empty.</p>
      ) : (
        <>
          <table border="1" cellPadding="8" style={{ width: "100%", marginBottom: 16 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <CartItem key={it.productId} item={it} onQtyChange={onQtyChange} onRemove={onRemove} />
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Grand Total: LKR {total.toFixed(2)}</h3>
            <button onClick={placeOrder} disabled={placing}>
              {placing ? "Placing..." : "Place Order"}
            </button>
          </div>
        </>
      )}

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}