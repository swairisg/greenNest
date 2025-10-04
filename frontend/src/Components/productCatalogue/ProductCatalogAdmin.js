import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProductsAPI } from "../../api";
import "./ProductCatalogAdmin.css";

export default function AdminProducts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ProductsAPI.adminAll();
      setRows(res.products || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Delete (not archive)
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product permanently?")) return;
    // Prefer a true delete() method if your API has it; otherwise fall back to remove()
    if (typeof ProductsAPI.delete === "function") {
      await ProductsAPI.delete(id);
    } else {
      await ProductsAPI.remove(id);
    }
    load();
  };

  return (
    <div className="gn-container">
      <div className="gn-toolbar">
        <div>
          <div className="gn-title">Admin • Products</div>
          <div className="gn-sub">Create, update, delete</div>
        </div>
        <Link to="/admin/products/new" className="gn-btn primary">
          + New Product
        </Link>
      </div>

      {loading ? (
        <div className="gn-card gn-card--loading">Loading…</div>
      ) : (
        <div className="gn-card gn-card--scroll">
          <table className="gn-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Type</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Visible</th>
                <th>Tags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const img =
                  r?.images?.[0] ||
                  "https://via.placeholder.com/96x96.png?text=No+Image";
                return (
                  <tr key={r._id}>
                    <td>
                      <div className="gn-thumb">
                        <img src={img} alt={r.productName || "product"} />
                      </div>
                    </td>
                    <td className="gn-cell-strong">{r.productName}</td>
                    <td>{r.type}</td>
                    <td>{r.category}</td>
                    <td>LKR {Number(r.basePrice || 0).toFixed(2)}</td>
                    <td>{r.stockQuantity}</td>
                    <td>{r.isVisible ? "Yes" : "No"}</td>
                    <td>{(r.tags || []).join(", ")}</td>
                    <td className="gn-row-actions">
                      <Link
                        to={`/admin/products/${r._id}/edit`}
                        className="gn-btn"
                      >
                        Edit
                      </Link>
                      <button
                        className="gn-btn danger"
                        onClick={() => handleDelete(r._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="gn-empty">
                    No products yet. Click “+ New Product” to add your first item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
