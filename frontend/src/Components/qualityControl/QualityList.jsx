import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { deleteQuality, listQuality } from "./api/qualityApi";
import FarmerQualityTable from "./FarmerQualityTable";

export default function QualityList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const alive = useRef(true);

  async function load({ signal } = {}) {
    setLoading(true);
    try {
      // ✅ correct signature: (role, params, config)
      const data = await listQuality("farmer", {}, { signal });
      const rows = Array.isArray(data) ? data : data?.items || [];
      if (alive.current) setItems(rows);
    } catch (e) {
           // Ignore request cancellations (refresh/nav)
            const canceled = e?.code === "ERR_CANCELED" || e?.message === "canceled";
            if (!canceled) {
              console.error("listQuality failed:", e);
              const msg = e?.response?.data?.error || e?.message || "Failed to fetch records";
              alert(msg);
            }
    } finally {
      if (alive.current) setLoading(false);
    }
  }

  useEffect(() => {
    alive.current = true;
    const ctrl = new AbortController();
    load({ signal: ctrl.signal });
    return () => {
      alive.current = false;
      ctrl.abort();
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((r) => {
      const gradeStr = r?.grade?.system || "-";
      const fields = [r.batchId, r.productName, r.variety, gradeStr].filter(Boolean);
      return fields.some((v) => String(v).toLowerCase().includes(term));
    });
  }, [items, q]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this record?")) return;
    try {
      await deleteQuality(id, "farmer");
      setItems((prev) => prev.filter((x) => (x._id || x.id) !== id));
    } catch (e) {
      console.error("deleteQuality failed:", e);
      const msg = e?.response?.data?.error || e?.message || "Delete failed";
      alert(msg);
    }
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="card" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Search by batch, product, variety, grade…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <Link className="btn" to="/quality/new">+ New Record</Link>
        <button className="btn secondary" onClick={() => load()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="card">Loading…</div>
      ) : filtered.length ? (
        <FarmerQualityTable items={filtered} onDelete={handleDelete} />
      ) : (
        <div className="card">No records found.</div>
      )}
    </section>
  );
}