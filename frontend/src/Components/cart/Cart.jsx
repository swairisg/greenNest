// src/Components/cart/cart.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  getCart,            // alias to loadCart
  removeFromCart,
  updateQuantity,     // alias to updateQty (delta-based)
  clearCart,
} from "../cart/cartUtils";
import { createOrder } from "../finance/Orders/orderApi"; // adjust path if needed
import "./Cart.css"; // optional styling

function money(n) {
  const x = Number(n || 0);
  return `LKR ${x.toFixed(2)}`;
}

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth(); // user may be null on first render

  const [items, setItems] = useState([]);

  // initial load
  useEffect(() => {
    setItems(getCart()); // [{ productId, name, price, qty, image }]
  }, []);

  // derive totals
  const totals = useMemo(() => {
    const sub = items.reduce((s, it) => s + it.price * it.qty, 0);
    const delivery = 0; // set your delivery logic if any
    const grand = sub + delivery;
    return { sub, delivery, grand };
  }, [items]);

  // qty handlers
  const inc = (productId) => {
    updateQuantity(productId, +1);   // delta +1
    setItems(getCart());
  };
  const dec = (productId) => {
    updateQuantity(productId, -1);   // delta -1 (cartUtils should remove if <=0; if not, minimum guard here)
    setItems(getCart());
  };
  const setQty = (productId, newQty) => {
    // Convert absolute input to delta expected by updateQuantity
    const cur = items.find(i => i.productId === productId)?.qty ?? 0;
    const delta = Math.max(1, Number(newQty) || 1) - cur;
    if (delta !== 0) {
      updateQuantity(productId, delta);
      setItems(getCart());
    }
  };

  const remove = (productId) => {
    removeFromCart(productId);
    setItems(getCart());
  };

  const placeOrder = async () => {
    if (!items.length) return;

    // Try to pick a sensible userId; adjust based on your auth shape
    const userId =
      user?.id || user?._id || user?.userId || user?.uid || "guest";

    // Build payload the backend expects
    const payload = {
      userId,
      items: items.map(i => ({
           productId: i.productId,
            name: i.name,           // REQUIRED by your orderItemSchema
            qty: i.qty,
            unitPrice: i.price,
          })),
      // You can extend with shipping, notes, etc.
      // shipping: { method: "Standard" }
    };

    try {
      const res = await createOrder(payload);
      // Clear cart and go to order details or list
      clearCart();
      setItems([]);

      const created = res?.data?.order;
      if (created?._id) {
        navigate(`/orders/${created._id}`, { replace: true });
      } else {
        navigate(`/orders`, { replace: true });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to place order. Please try again.");
    }
  };

  if (!items.length) {
    return (
      <section className="cart">
        <h2>Shopping Cart</h2>
        <p>Your cart is empty.</p>
        <button className="sc-btn sc-btn-primary" onClick={() => navigate("/catalog")}>
          Browse products
        </button>
      </section>
    );
  }

  return (
    <section className="cart">
      <h2>Shopping Cart</h2>

      <table className="cart-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Item</th>
            <th>Price</th>
            <th style={{ minWidth: 140 }}>Qty</th>
            <th>Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.productId}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {it.image ? (
                    <img
                      src={it.image}
                      alt={it.name}
                      loading="lazy"
                      width={56}
                      height={56}
                      style={{ objectFit: "cover", borderRadius: 8 }}
                    />
                  ) : null}
                  <div>{it.name}</div>
                </div>
              </td>
              <td style={{ textAlign: "center" }}>{money(it.price)}</td>
              <td style={{ textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <button className="qty-btn" onClick={() => dec(it.productId)} aria-label="Decrease">
                    −
                  </button>
                  <input
                    className="qty-input"
                    type="number"
                    min="1"
                    value={it.qty}
                    onChange={(e) => setQty(it.productId, e.target.value)}
                  />
                  <button className="qty-btn" onClick={() => inc(it.productId)} aria-label="Increase">
                    +
                  </button>
                </div>
              </td>
              <td style={{ textAlign: "center" }}>{money(it.price * it.qty)}</td>
              <td style={{ textAlign: "right" }}>
                <button className="remove-btn" onClick={() => remove(it.productId)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={5}><hr/></td></tr>
          <tr>
            <td />
            <td />
            <td style={{ textAlign: "right" }}><strong>Subtotal</strong></td>
            <td style={{ textAlign: "center" }}>{money(totals.sub)}</td>
            <td />
          </tr>
          <tr>
            <td />
            <td />
            <td style={{ textAlign: "right" }}>Delivery</td>
            <td style={{ textAlign: "center" }}>{money(totals.delivery)}</td>
            <td />
          </tr>
          <tr>
            <td />
            <td />
            <td style={{ textAlign: "right" }}><strong>Grand Total</strong></td>
            <td style={{ textAlign: "center" }}><strong>{money(totals.grand)}</strong></td>
            <td />
          </tr>
        </tfoot>
      </table>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button className="sc-btn sc-btn-ghost" onClick={() => navigate("/catalog")}>
          Continue shopping
        </button>
        <button
          className="sc-btn sc-btn-primary"
          onClick={placeOrder}
          disabled={!items.length}
        >
          Place Order
        </button>
      </div>
    </section>
  );
}