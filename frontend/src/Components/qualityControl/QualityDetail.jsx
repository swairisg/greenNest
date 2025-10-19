// src/Components/qualityControl/QualityDetail.jsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios"; // for axios.isCancel / ERR_CANCELED checks
import { getQuality } from "./api/qualityApi";
import "./QualityDetail.css";

export default function QualityDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const ctrl = new AbortController();

    (async () => {
      try {
        // Fetch as FARMER (so it hits /api/farmer/quality/:id)
        const rec = await getQuality(id, "farmer", { signal: ctrl.signal });
        if (alive.current) setItem(rec ?? null);
      } catch (e) {
        // Ignore both browser AbortController and Axios cancel errors
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

  // grade fields (object-safe)
  const g = item.grade || {};
  const finalGrade = g.final ?? g.system ?? "-";
  const systemGrade = g.system ?? "-";
  const humanGrade = g.human ?? "-";
  const policy = g.policy ?? "-";
  const decidedBy = g.decidedBy ?? "-";

  // readings pretty print
  const readings =
    item.readings && typeof item.readings === "object"
      ? JSON.stringify(item.readings, null, 2)
      : "-";

  const rows = [
    ["Batch ID", item.batchId],
    ["Product", item.productName],
    ["Variety", item.variety],
    ["Size", item.size || "-"],
    ["Color", item.color || "-"],
    ["Freshness", item.freshness ?? "-"],
    ["Weight (kg)", item.weight ?? "-"],
    ["Final Grade", finalGrade],
    ["System Grade", systemGrade],
    ["Human Grade", humanGrade],
    ["Policy", policy],
    ["Decided By", decidedBy],
    ["Notes", item.notes || "-"],
    ["Record ID", item._id || item.id],
  ];

  return (
    <section className="quality-detail-card">
      <h2 style={{ marginTop: 0 }}>Quality Record</h2>

      <table style={{ marginTop: 12 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 12px",
                  width: 180,
                  color: "#666",
                }}
              >
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

      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: "12px 0 6px" }}>Readings</h3>
        <pre
          style={{
            background: "#f7f7f8",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 12,
            margin: 0,
            overflowX: "auto",
          }}
        >
{readings}
        </pre>
      </div>
    </section>
  );
}