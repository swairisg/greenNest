import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { getQuality } from "./api/qualityApi";

export default function AdminQualityDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const ctrl = new AbortController();

    (async () => {
      try {
        const rec = await getQuality(id, "admin", { signal: ctrl.signal });
        if (alive.current) setItem(rec ?? null);
      } catch (e) {
        const isAbort =
          e?.name === "AbortError" ||
          e?.name === "CanceledError" ||
          e?.code === "ERR_CANCELED" ||
          (typeof axios.isCancel === "function" && axios.isCancel(e));

        if (!isAbort) {
          console.error("getQuality (admin detail) failed:", e);
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

  const g = item.grade || {};
  const finalGrade = g.final ?? g.system ?? "-";
  const rows = [
    ["Batch ID", item.batchId],
    ["Product", item.productName],
    ["Variety", item.variety],
    ["Size", item.size || "-"],
    ["Color", item.color || "-"],
    ["Freshness", item.freshness ?? "-"],
    ["Weight (kg)", item.weight ?? "-"],
    ["System Grade", g.system ?? "-"],
    ["Human Grade", g.human ?? "-"],
    ["Final Grade", finalGrade],
    ["Policy", g.policy ?? "-"],
    ["Decided By", g.decidedBy ?? "-"],
    ["Notes", item.notes || "-"],
    ["Record ID", item._id || item.id],
    ["Owner", item.owner?.email || "-"],
  ];

  return (
    <section className="card" style={{ display: "grid", gap: 16 }}>
      <h2 style={{ marginTop: 0 }}>Quality Record (Admin)</h2>

      <table style={{ marginTop: 12 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th style={{ textAlign: "left", padding: "6px 12px", width: 200, color: "#666" }}>
                {k}
              </th>
              <td style={{ padding: "6px 12px" }}>
                {k.includes("Grade") && v && v !== "-" ? (
                  <span className={`badge grade-${String(v).toUpperCase()}`}>{v}</span>
                ) : (
                  String(v ?? "-")
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link to="/admin/quality" className="btn secondary">Back</Link>
        <Link to={`/admin/quality/${item._id}/edit`} className="btn">Edit / Grade</Link>
      </div>
    </section>
  );
}