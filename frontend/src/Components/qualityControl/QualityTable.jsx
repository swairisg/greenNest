import { Link } from "react-router-dom";

export default function QualityTable({ items, onDelete }) {
  if (!items?.length) return <div className="card empty">No records yet.</div>;

  return (
    <div className="card" style={{ overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Batch</th>
            <th>Product</th>
            <th>Variety</th>
            <th>Freshness</th>
            <th>Weight (kg)</th>
            <th>Grade</th>
            <th style={{ width: 220 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r._id}>
              <td>{r.batchId}</td>
              <td>{r.productName}</td>
              <td>{r.variety}</td>
              <td>{r.freshness ?? "-"}</td>
              <td>{r.weight ?? "-"}</td>
              <td>
                <span className={`badge ${r.grade}`}>{r.grade}</span>
              </td>
              <td>
                <div className="row-actions" style={{ display: "flex", gap: 8 }}>
                  <Link className="btn secondary" to={`/quality/${r._id}`}>View</Link>
                  <Link className="btn secondary" to={`/quality/${r._id}/edit`}>Edit</Link>
                  <button className="btn danger" onClick={() => onDelete(r._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}