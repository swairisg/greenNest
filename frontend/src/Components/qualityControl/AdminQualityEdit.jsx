import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { getQuality } from "./api/qualityApi";
import AdminGradePanel from "./AdminGradePanel";

export default function AdminQualityEdit() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const ctrl = new AbortController();

    (async () => {
      try {
        // fetch admin record
        const rec = await getQuality(id, "admin", { signal: ctrl.signal });
        if (alive.current) setItem(rec ?? null);
      } catch (e) {
        const isAbort =
          e?.name === "AbortError" ||
          e?.name === "CanceledError" ||
          e?.code === "ERR_CANCELED" ||
          (typeof axios.isCancel === "function" && axios.isCancel(e));

        if (!isAbort) {
          console.error("getQuality failed:", e);
          alert(e?.response?.status === 404 ? "Record not found." : "Failed to load the record.");
        }
      } finally {
        if (alive.current) setLoading(false);
      }
    })();

    return () => {
      alive.current = false;
      ctrl.abort();
    };
  }, [id]);

  if (loading) return <div className="card">Loading…</div>;
  if (!item) return <div className="card">Not found</div>;

  function handleUpdated(updated) {
    setItem(updated);
  }

  const g = item.grade || {};
  const finalGrade = g.final ?? g.system ?? "-";

  return (
    <section className="card" style={{ display: "grid", gap: 16 }}>
      <h2 style={{ marginTop: 0 }}>Edit Grading</h2>

      <div className="card" style={{ background: "#f9fafb" }}>
        <table>
          <tbody>
            <tr><th>Batch</th><td>{item.batchId}</td></tr>
            <tr><th>Product</th><td>{item.productName}</td></tr>
            <tr><th>Variety</th><td>{item.variety}</td></tr>
            <tr><th>Freshness</th><td>{item.freshness ?? "-"}</td></tr>
            <tr><th>Weight (kg)</th><td>{item.weight ?? "-"}</td></tr>
            <tr>
              <th>Current Final Grade</th>
              <td><span className={`badge grade-${String(finalGrade).toUpperCase()}`}>{finalGrade}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 👇 the grading form */}
      <AdminGradePanel item={item} onUpdated={handleUpdated} />

      <div>
        <Link to="/admin/quality" className="btn secondary">Back</Link>
      </div>
    </section>
  );
}