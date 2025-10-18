// src/pages/customers/ProfileOrdersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

// === API base kept in THIS file (no separate api base) ===
const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  "http://localhost:5001";

// tiny helpers
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "—");

const StatusBadge = ({ label, palette }) => {
  const color = palette[label] || "#64748b";
  return (
    <span
      className="profileorder-badge"
      style={{
        background: `${color}22`,
        borderColor: `${color}55`,
        color,
      }}
    >
      {label}
    </span>
  );
};

export default function ProfileOrdersPage() {
  const { userId } = useParams();
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("current"); // current | past

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const url = `${API_BASE}/api/profileorders/user/${userId}`;
        const { data } = await axios.get(url, { withCredentials: true });
        setOrders(data.orders || []);
      } catch (e) {
        console.error(e);
        setErr("Could not fetch your orders.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const currentSet = new Set(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"]);
  const pastSet = new Set(["DELIVERED", "CANCELLED", "RETURNED"]);

  const { currentOrders, pastOrders } = useMemo(() => {
    const cur = [];
    const pst = [];
    for (const o of orders) {
      if (currentSet.has(o.status)) cur.push(o);
      else if (pastSet.has(o.status)) pst.push(o);
      else cur.push(o);
    }
    return { currentOrders: cur, pastOrders: pst };
  }, [orders]);

  const shown = tab === "current" ? currentOrders : pastOrders;

  const statusPalette = {
    PENDING: "#eab308",
    CONFIRMED: "#22c55e",
    PROCESSING: "#0ea5e9",
    SHIPPED: "#0284c7",
    DELIVERED: "#16a34a",
    CANCELLED: "#ef4444",
    RETURNED: "#f97316",
  };
  const payPalette = { PAID: "#16a34a", UNPAID: "#ef4444", REFUNDED: "#0ea5e9" };

  return (
    <div className="profileorder-wrap">
      <div className="profileorder-head">
        <div>
          <h2 className="profileorder-title">My Orders</h2>
          <p className="profileorder-sub">Track your current and past purchases</p>
        </div>
        <Link to="/catalog" className="profileorder-back">
          ← Back to Catalog
        </Link>
      </div>

      <div className="profileorder-tabs">
        <button
          className={`profileorder-tab ${tab === "current" ? "is-active" : ""}`}
          onClick={() => setTab("current")}
        >
          Current ({currentOrders.length})
        </button>
        <button
          className={`profileorder-tab ${tab === "past" ? "is-active" : ""}`}
          onClick={() => setTab("past")}
        >
          Past ({pastOrders.length})
        </button>
      </div>

      {loading && <div className="profileorder-state">Loading…</div>}
      {!loading && err && <div className="profileorder-error">{err}</div>}

      {!loading && !err && shown.length === 0 && (
        <div className="profileorder-state">
          {tab === "current" ? "You have no current orders." : "No past orders yet."}
        </div>
      )}

      {!loading && !err && shown.length > 0 && (
        <div className="profileorder-table">
          <div className="profileorder-tr profileorder-tr--head">
            <div>Order No</div>
            <div>Status</div>
            <div>Payment</div>
            <div>Total</div>
            <div>Created</div>
            <div>Items</div>
          </div>

          {shown.map((o) => (
            <div key={o._id} className="profileorder-tr">
              <div className="profileorder-mono">{o.orderNo}</div>
              <div>
                <StatusBadge
                  label={(o.status || "PENDING").toUpperCase()}
                  palette={statusPalette}
                />
              </div>
              <div>
                <StatusBadge
                  label={(o.paymentStatus || "UNPAID").toUpperCase()}
                  palette={payPalette}
                />
              </div>
              <div className="profileorder-mono">
                {(o.amounts?.grandTotal ?? 0).toLocaleString()}{" "}
                {o.amounts?.currency || "LKR"}
              </div>
              <div className="profileorder-soft">{fmtDate(o.createdAt)}</div>
              <div className="profileorder-soft">
                {Array.isArray(o.items) && o.items.length > 0
                  ? o.items
                      .map(
                        (it) =>
                          `${it.title || it.productName || "Item"} × ${it.qty}`
                      )
                      .join(", ")
                  : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
