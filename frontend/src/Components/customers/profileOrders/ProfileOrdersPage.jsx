// src/pages/customers/ProfileOrdersPage.jsx
// Orders page with product images, Cancel, and Pay Now (marks PAID immediately, then prompts slip upload)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "./ProfileOrdersPage.css";

const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  "http://localhost:5001";

const PRODUCT_PATH    = `${API_BASE}/products`;
const ORDERS_PATH     = (userId) => `${API_BASE}/api/profileorders/user/${userId}`;
const DELETE_PATH     = (orderId) => `${API_BASE}/api/profileorders/${orderId}`;
const SLIP_UPLOAD_B64 = (orderId) => `${API_BASE}/api/profileorders/${orderId}/payment-slip-b64`;
const PAID_PATH       = (orderId) => `${API_BASE}/api/profileorders/${orderId}/paid`; // ← mark as PAID

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "—");
const money = (v) => Number(v || 0).toLocaleString();

const productCache = new Map();
async function getProductById(id) {
  if (!id) return null;
  if (productCache.has(id)) return productCache.get(id);
  try {
    const { data } = await axios.get(`${PRODUCT_PATH}/${id}`, { withCredentials: true });
    const p = data?.product || null;
    productCache.set(id, p);
    return p;
  } catch {
    productCache.set(id, null);
    return null;
  }
}
async function getProductsMany(ids, concurrency = 6) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const results = new Map();
  let i = 0;
  async function worker() {
    while (i < unique.length) {
      const id = unique[i++];
      const p = await getProductById(id);
      results.set(id, p);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker));
  return results;
}
const pickImage = (p) => p?.images?.[0] || "https://via.placeholder.com/72x72.png?text=Item";
const pickTitle = (p) => p?.productName || "Item";

export default function ProfileOrdersPage() {
  const { userId } = useParams();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("shipping"); // shipping | arrived | canceled
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const fileInputsRef = useRef({}); // per-order hidden file input

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const { data } = await axios.get(ORDERS_PATH(userId), { withCredentials: true });
        const rawOrders = data?.orders || [];

        const productIds = rawOrders.flatMap((o) =>
          (o.items || []).map((it) => it.productId).filter(Boolean)
        );
        const map = await getProductsMany(productIds);

        const enriched = rawOrders.map((o) => ({
          ...o,
          items: (o.items || []).map((it) => {
            const p = it.productId ? map.get(it.productId) : null;
            return {
              ...it,
              product: p
                ? { _id: p._id, title: pickTitle(p), imageUrl: pickImage(p) }
                : {
                    title: it.name || it.title || "Item",
                    imageUrl:
                      it.imageUrl || "https://via.placeholder.com/72x72.png?text=Item",
                  },
            };
          }),
        }));

        setOrders(enriched);
      } catch (e) {
        console.error(e);
        setErr("Could not fetch your orders.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const buckets = useMemo(() => {
    const shippingSet = new Set(["PENDING", "CONFIRMED", "FULFILLING", "SHIPPED"]);
    const arrivedSet = new Set(["DELIVERED", "CLOSED"]);
    const canceledSet = new Set(["CANCELLED", "REJECTED"]);
    const shipping = [], arrived = [], canceled = [];
    for (const o of orders) {
      const s = (o.status || "PENDING").toUpperCase();
      if (shippingSet.has(s)) shipping.push(o);
      else if (arrivedSet.has(s)) arrived.push(o);
      else if (canceledSet.has(s)) canceled.push(o);
      else shipping.push(o);
    }
    return { shipping, arrived, canceled };
  }, [orders]);

  const shown = tab === "arrived" ? buckets.arrived : tab === "canceled" ? buckets.canceled : buckets.shipping;

  async function handleCancel(order) {
    const status = (order.status || "PENDING").toUpperCase();
    const isFinal = ["DELIVERED", "CLOSED", "CANCELLED", "REJECTED"].includes(status);
    if (isFinal) return;
    const ok = window.confirm(`Cancel order ${order.orderNo}?`);
    if (!ok) return;
    const prev = orders;
    setOrders((cur) => cur.filter((x) => x._id !== order._id));
    try {
      await axios.delete(DELETE_PATH(order._id), { withCredentials: true });
    } catch (e) {
      console.error(e);
      setOrders(prev);
      alert("Failed to cancel the order. Please try again.");
    }
  }

  function openSlipPicker(orderId) {
    if (!fileInputsRef.current[orderId]) return;
    fileInputsRef.current[orderId].value = "";
    fileInputsRef.current[orderId].click();
  }

  // mark order as PAID in DB first, then open slip picker for upload
  async function handlePayNow(order) {
    try {
      await axios.patch(PAID_PATH(order._id), {}, { withCredentials: true });
      setOrders((cur) =>
        cur.map((o) => (o._id === order._id ? { ...o, paymentStatus: "PAID" } : o))
      );
      openSlipPicker(order._id); 
    } catch (e) {
      console.error(e);
      alert("Failed to mark as PAID. Please try again.");
    }
  }

  async function handleSlipSelected(order, file) {
    if (!file) return;
    const okTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
    if (!okTypes.includes(file.type)) {
      alert("Please upload a PNG, JPG, WEBP image, or a PDF file.");
      return;
    }
    try {
      setOrders((cur) =>
        cur.map((o) => (o._id === order._id ? { ...o, _uploading: true } : o))
      );

      const slipBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("File read failed"));
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const res = await axios.post(
        SLIP_UPLOAD_B64(order._id),
        { slipBase64, originalName: file.name },
        { withCredentials: true }
      );
      if (res.status < 200 || res.status >= 300) throw new Error("Upload failed");

      const url = res.data?.url || null;

      setOrders((cur) =>
        cur.map((o) =>
          o._id === order._id
            ? {
                ...o,
                // paymentStatus already PAID by handlePayNow
                _slipUrl: url,         // local link to view slip
                _uploading: false,
              }
            : o
        )
      );
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to upload slip.";
      alert(`Upload failed: ${msg}`);
      setOrders((cur) =>
        cur.map((o) => (o._id === order._id ? { ...o, _uploading: false } : o))
      );
    }
  }

  return (
    <div className="profileorder-page">
      <div className="profileorder-header">
        <h2 className="profileorder-h2">My Orders</h2>

        <div className="profileorder-tabs">
          <button
            className={`profileorder-tab ${tab === "shipping" ? "is-active" : ""}`}
            onClick={() => setTab("shipping")}
          >
            On Shipping <span className="profileorder-dot" /> {buckets.shipping.length}
          </button>
          <button
            className={`profileorder-tab ${tab === "arrived" ? "is-active" : ""}`}
            onClick={() => setTab("arrived")}
          >
            Arrived {buckets.arrived.length}
          </button>
          <button
            className={`profileorder-tab ${tab === "canceled" ? "is-active" : ""}`}
            onClick={() => setTab("canceled")}
          >
            Canceled {buckets.canceled.length}
          </button>
        </div>

        {/* two links side-by-side on the right */}
        <div className="profileorder-backwrap">
          <Link to="/catalog" className="profileorder-back">← Back to Catalog</Link>
          <Link to="/profile" className="profileorder-back">← Back</Link>
        </div>
      </div>

      {loading && <div className="profileorder-state">Loading…</div>}
      {!loading && err && <div className="profileorder-error">{err}</div>}
      {!loading && !err && shown.length === 0 && (
        <div className="profileorder-state">Nothing here yet.</div>
      )}

      {!loading && !err && shown.length > 0 && (
        <div className="profileorder-list">
          {shown.map((o) => {
            const status = (o.status || "PENDING").toUpperCase();
            const pay = (o.paymentStatus || "UNPAID").toUpperCase();
            const items = Array.isArray(o.items) ? o.items : [];
            const isFinal = ["DELIVERED", "CLOSED", "CANCELLED", "REJECTED"].includes(status);
            const canPay = pay !== "PAID" && !["CANCELLED", "REJECTED"].includes(status);

            return (
              <div key={o._id} className="profileorder-card">
                {/* hidden input per order for file picking */}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  style={{ display: "none" }}
                  ref={(el) => (fileInputsRef.current[o._id] = el)}
                  onChange={(e) => handleSlipSelected(o, e.target.files?.[0])}
                />

                {/* top */}
                <div className="profileorder-card-top">
                  <div className="profileorder-card-left">
                    <span className="profileorder-emoji">🚚</span>
                    <span className="profileorder-orderno">{o.orderNo}</span>
                    <span className={`profileorder-badge ${status.toLowerCase()}`}>
                      {status === "DELIVERED"
                        ? "Delivered"
                        : status === "CLOSED"
                        ? "Closed"
                        : status === "CANCELLED"
                        ? "Canceled"
                        : status === "REJECTED"
                        ? "Rejected"
                        : "On Shipping"}
                    </span>
                  </div>
                  <div className="profileorder-card-right">
                    <span className={`profileorder-chip ${pay === "PAID" ? "paid" : "unpaid"}`}>
                      {o._uploading ? "UPLOADING…" : pay}
                    </span>
                  </div>
                </div>

                {/* items */}
                <div className="profileorder-items">
                  {items.map((it, idx) => (
                    <div key={idx} className="profileorder-item">
                      <img
                        className="profileorder-thumb"
                        src={
                          it.product?.imageUrl ||
                          it.imageUrl ||
                          "https://via.placeholder.com/72x72.png?text=Item"
                        }
                        alt=""
                        loading="lazy"
                      />
                      <div className="profileorder-item-info">
                        <div className="profileorder-item-title">
                          {it.product?.title || it.name || it.title || "Item"}
                        </div>
                        <div className="profileorder-item-meta">
                          Qty {it.qty || 1} · LKR {money(it.unitPrice || it.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* bottom */}
                <div className="profileorder-card-bottom">
                  <div className="profileorder-card-when">
                    <span className="profileorder-dot-alt" />
                    <span className="profileorder-muted">Created</span> {fmtDate(o.createdAt)}
                  </div>
                  <div className="profileorder-footer-right">
                    <div className="profileorder-total">
                      Total:&nbsp;<strong>LKR {money(o?.amounts?.grandTotal)}</strong>
                    </div>

                    <button className="profileorder-details">Details</button>

                    {/* View slip if uploaded in this session */}
                    {o._slipUrl && (
                      <a
                        className="profileorder-sliplink"
                        href={o._slipUrl.startsWith("http") ? o._slipUrl : `${API_BASE}${o._slipUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View uploaded payment slip"
                      >
                        View slip
                      </a>
                    )}

                    {/* Pay Now (marks paid, then opens picker) */}
                    {canPay && (
                      <button
                        className="profileorder-paynow"
                        onClick={() => handlePayNow(o)}
                        disabled={o._uploading}
                        title="Mark paid and upload payment slip"
                      >
                        {o._uploading ? "Uploading…" : "Pay Now"}
                      </button>
                    )}

                    {/* Cancel */}
                    {!isFinal && (
                      <button
                        className="profileorder-cancel"
                        onClick={() => handleCancel(o)}
                        title="Cancel this order"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
