import { Link } from "react-router-dom";
import "./AdminQualityTable.css";

export default function AdminQualityTable({ items, onDelete }) {
  if (!items?.length) return <div className="card empty">No records yet.</div>;

  return (
    <div className="card quality-table-container">
      <table className="quality-table">
        <thead>
          <tr>
            <th>Batch</th>
            <th>Product</th>
            <th>Variety</th>
            <th>Freshness</th>
            <th>Weight (kg)</th>
            <th>Final</th>
            <th>System</th>
            <th>Human</th>
            <th style={{ width: 240 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => {
            const g = r?.grade || {};
            const finalStr = g.final || g.system || "-";
            const sysStr = g.system || "-";
            const humanStr = g.human || "-";
            return (
              <tr key={r._id}>
                <td>{r.batchId}</td>
                <td>{r.productName}</td>
                <td>{r.variety}</td>
                <td>{r.freshness ?? "-"}</td>
                <td>{r.weight ?? "-"}</td>
                <td><span className={`badge grade-${String(finalStr).toUpperCase()}`}>{finalStr}</span></td>
                <td>{sysStr}</td>
                <td>{humanStr}</td>
                <td>
                  <div className="row-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link className="btn secondary" to={`/admin/quality/${r._id}`}>View</Link>
                  <Link className="btn secondary" to={`/admin/quality/${r._id}/edit`}>Edit</Link>
                    <button className="btn danger" onClick={() => onDelete(r._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}