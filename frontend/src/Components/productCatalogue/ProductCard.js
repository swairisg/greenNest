import React from "react";
import "./ProductCatalog.css";

export default function ProductCard({ product, onAdd, onView }) {
  const img = Array.isArray(product?.images) && product.images[0]
    ? product.images[0]
    : "https://via.placeholder.com/640x360?text=GreenNest";
  return (
    <div className="gn-card pcard">
      <img src={img} alt={product?.productName || "Product"} />
      <div className="pcard-body">
        <div className="name">{product?.productName}</div>
        <div className="price">LKR {Number(product?.basePrice || 0).toFixed(2)}</div>
        <div className="meta">{product?.category} • {product?.type}</div>
        <div className="mt-16 flex">
          {onAdd && <button className="gn-btn primary" onClick={onAdd}>Add to Cart</button>}
          {onView && <button className="gn-btn" onClick={onView}>View</button>}
        </div>
      </div>
    </div>
  );
}
