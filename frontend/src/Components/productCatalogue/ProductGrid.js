import React from "react";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products = [], onAdd }) {
  if (!products.length) {
    return <div className="gn-card center" style={{padding:24}}>No products found.</div>;
  }
  return (
    <div className="gn-grid">
      {products.map(p => <ProductCard key={p._id} product={p} onAdd={onAdd} />)}
    </div>
  );
}
