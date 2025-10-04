import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProductsAPI } from "../../api";
import "./ProductCatalogDashboard.css"; 

export default function ProductCatalogDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ProductsAPI.adminAll();
      setRows(res?.products || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // --- quick, client-side stats ---
  const stats = useMemo(() => {
    const total = rows.length;
    const visible = rows.filter(p => p.isVisible).length;
    const hidden = total - visible;
    const inStock = rows.filter(p => Number(p.stockQuantity) > 0).length;
    const lowStock = rows.filter(p => Number(p.stockQuantity) > 0 && Number(p.stockQuantity) < 10).length;

    const revenueMin = rows.reduce((s, p) => s + Number(p.basePrice || 0), 0);
    return { total, visible, hidden, inStock, lowStock, revenueMin };
  }, [rows]);

  const recent = useMemo(() => {
    // If backend has createdAt, sort by it; otherwise fallback by _id
    const copy = [...rows];
    copy.sort((a, b) => {
      const da = new Date(a.createdAt || a._id?.toString().slice(-8) * 1000);
      const db = new Date(b.createdAt || b._id?.toString().slice(-8) * 1000);
      return db - da;
    });
    return copy.slice(0, 6);
  }, [rows]);

  return (
    <div className="gn-container">
      {/* Header */}
      <div className="gn-toolbar">
        <div>
          <div className="gn-title">Admin • Catalog Dashboard</div>
          <div className="gn-sub">Overview of products, visibility, and quick actions</div>
        </div>
        <Link to="/admin/products/new" className="gn-btn primary">+ New Product</Link>
      </div>

      {/* KPI cards */}
      <div className="gn-kpi-grid">
        <KPI label="Total Products" value={stats.total} />
        <KPI label="Visible" value={stats.visible} />
        <KPI label="Hidden" value={stats.hidden} />
        <KPI label="In Stock" value={stats.inStock} />
        <KPI label="Low Stock (&lt;10)" value={stats.lowStock} />
        <KPI label="Sum of Base Prices" value={`LKR ${stats.revenueMin.toFixed(2)}`} />
      </div>

      {/* Quick actions */}
      <div className="gn-card gn-quick">
        <div className="gn-quick-title">Quick Actions</div>
        <div className="gn-quick-row">
          <Link to="/admin/products" className="gn-btn">Manage Products</Link>
          <Link to="/admin/products/new" className="gn-btn primary">Add Product</Link>
          <Link to="/catalog" className="gn-btn">View Storefront</Link>
        </div>
      </div>

      {/* Recent products */}
      <div className="gn-card gn-card--scroll" style={{ marginTop: 16 }}>
        <table className="gn-table">
          <thead>
            <tr>
              <th style={{width:76}}>Photo</th>
              <th>Name</th>
              <th>Type</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Visible</th>
              <th style={{width:120}}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{padding:18}}>Loading…</td></tr>
            ) : recent.length ? recent.map(r => {
              const img = r?.images?.[0] || "https://via.placeholder.com/96x96.png?text=No+Image";
              return (
                <tr key={r._id}>
                  <td>
                    <div className="gn-thumb"><img src={img} alt={r.productName || "product"} /></div>
                  </td>
                  <td className="gn-cell-strong">{r.productName}</td>
                  <td>{r.type}</td>
                  <td>{r.category}</td>
                  <td>LKR {Number(r.basePrice || 0).toFixed(2)}</td>
                  <td>{r.stockQuantity}</td>
                  <td>{r.isVisible ? "Yes" : "No"}</td>
                  <td className="gn-row-actions">
                    <Link to={`/admin/products/${r._id}/edit`} className="gn-btn">Edit</Link>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={8} className="gn-empty">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="gn-card gn-kpi">
      <div className="gn-kpi-value">{value}</div>
      <div className="gn-kpi-label">{label}</div>
    </div>
  );
}
