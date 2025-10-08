// frontend/src/Components/cart/CartItem.jsx
import React from "react";

export default function CartItem({ item, onQtyChange, onRemove }) {
  return (
    <tr>
      <td style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {item.image ? (
          <img src={item.image} alt={item.name} width={48} height={48} style={{ objectFit: "cover", borderRadius: 6 }} />
        ) : null}
        <span>{item.name}</span>
      </td>
      <td>LKR {item.price.toFixed(2)}</td>
      <td>
        <input
          type="number"
          min={1}
          value={item.qty}
          style={{ width: 70 }}
          onChange={(e) => onQtyChange(item.productId, Math.max(1, Number(e.target.value)))}
        />
      </td>
      <td>LKR {(item.price * item.qty).toFixed(2)}</td>
      <td>
        <button onClick={() => onRemove(item.productId)}>Remove</button>
      </td>
    </tr>
  );
}