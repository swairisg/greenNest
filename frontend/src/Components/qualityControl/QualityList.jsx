import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteQuality, listQuality } from "./api/qualityApi";
import QualityTable from "./QualityTable";

export default function QualityList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await listQuality();
      setItems(data);
    } catch (e) {
      console.error(e);
      alert("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((r) =>
      [r.batchId, r.productName, r.variety, r.grade]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [items, q]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this record?")) return;
    try {
      await deleteQuality(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      console.error(e);
      alert("Delete failed");
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
        <button className="btn secondary" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {loading ? <div className="card">Loading…</div> :
        <QualityTable items={filtered} onDelete={handleDelete} />
      }
    </section>
  );
}