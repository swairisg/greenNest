import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getQuality } from "./api/qualityApi";

export default function QualityDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getQuality(id);
        setItem(data);
      } catch (e) {
        console.error(e);
        alert("Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="card">Loading…</div>;
  if (!item) return <div className="card">Not found</div>;

  const rows = [
    ["Batch ID", item.batchId],
    ["Product", item.productName],
    ["Variety", item.variety],
    ["Size", item.size || "-"],
    ["Color", item.color || "-"],
    ["Freshness", item.freshness ?? "-"],
    ["Weight (kg)", item.weight ?? "-"],
    ["Grade", item.grade],
    ["Notes", item.notes || "-"],
    ["_id", item._id],
  ];

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Quality Record</h2>
      <table style={{ marginTop: 12 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th style={{ textAlign: "left", padding: "6px 12px", width: 180, color: "#666" }}>{k}</th>
              <td style={{ padding: "6px 12px" }}>
                {k === "Grade" ? <span className={`badge ${item.grade}`}>{item.grade}</span> : v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Link to={`/quality/${id}/edit`} className="btn secondary">Edit</Link>
        <Link to="/quality" className="btn">Back</Link>
      </div>
    </section>
  );
}