import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listQuality, deleteQuality } from "./api/qualityApi";
import AdminQualityTable from "./AdminQualityTable";
import "./AdminQualityList.css";

export default function AdminQualityList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const alive = useRef(true);

  async function load(signal) {
    setLoading(true);
    try {
      const data = await listQuality("admin", { signal });
      const rows = Array.isArray(data) ? data : data?.items || [];
      setItems(rows);
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("Failed to fetch admin quality records:", e);
        alert("Failed to fetch records.");
      }
    } finally {
      if (alive.current) setLoading(false);
    }
  }

  useEffect(() => {
    alive.current = true;
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => {
      alive.current = false;
      ctrl.abort();
    };
  }, []);

  const filtered = items.filter((r) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const gradeStr = r?.grade?.final || r?.grade?.system || "";
    const fields = [r.batchId, r.productName, r.variety, gradeStr].filter(Boolean);
    return fields.some((v) => String(v).toLowerCase().includes(term));
  });

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteQuality(id, "admin");
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
    }
  }

  return (
    <section data-gn-admin>
      <div className="gn-admin-card gn-admin-toolbar">
        <input
          className="gn-admin-input"
          placeholder="Search by batch, product, variety, or grade…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="gn-admin-actions">
          <Link className="gn-admin-btn" to="/quality/new">+ Add New</Link>
          <button
            className="gn-admin-btn ghost"
            onClick={() => load()}
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="gn-admin-card">Loading…</div>
      ) : filtered.length ? (
        <div className="gn-admin-card gn-admin-tablewrap">
          <AdminQualityTable items={filtered} onDelete={handleDelete} />
        </div>
      ) : (
        <div className="gn-admin-card">No records found.</div>
      )}
    </section>
  );
}