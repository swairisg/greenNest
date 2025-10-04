// frontend/src/Components/plantCultivation/SeedsPage.jsx
import React, { useEffect, useState } from "react";
import api from "../../api";
import "./pc.css";

export default function SeedsPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState(null);

  const empty = () => ({
    seedCode: "",
    cropType: "",
    supplier: "",
    quantity: 0,
    unit: "seeds",
    procuredDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    notes: "",
  });
  const [form, setForm] = useState(empty());

  const buildQuery = (query = "") =>
    `/plant-cultivation/seeds${query ? `?q=${encodeURIComponent(query)}` : ""}`;

  const load = async (query = "") => {
    const { data } = await api.get(buildQuery(query));
    setRows(data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.patch(`/plant-cultivation/seeds/${editingId}`, form);
    } else {
      await api.post("/plant-cultivation/seeds", form);
    }
    cancelEdit();
    load(q);
  };

  const del = async (id) => {
    await api.delete(`/plant-cultivation/seeds/${id}`);
    if (editingId === id) cancelEdit();
    load(q);
  };

  const startEdit = (row) => {
    setEditingId(row._id);
    setForm({
      seedCode: row.seedCode ?? "",
      cropType: row.cropType ?? "",
      supplier: row.supplier ?? "",
      quantity: row.quantity ?? 0,
      unit: row.unit ?? "seeds",
      procuredDate: row.procuredDate
        ? new Date(row.procuredDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      expiryDate: row.expiryDate
        ? new Date(row.expiryDate).toISOString().slice(0, 10)
        : "",
      notes: row.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty());
  };

  return (
    <div className="pc-page">
      {/* Header */}
      <div className="pc-header">
        <div>
          <h2 className="pc-title">Seed Inventory</h2>
          <p className="pc-sub">Track seed batches, suppliers and quantities.</p>
        </div>
        <div className="pc-actions">
          {/* reserved for export or help later */}
        </div>
      </div>

      {/* Search Card */}
      <div className="pc-card">
        <form
          className="pc-search"
          onSubmit={(e) => {
            e.preventDefault();
            load(q);
          }}
        >
          <div className="pc-input-wrap grow">
            <input
              className="pc-input"
              placeholder="Search by code, crop, or supplier…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="pc-btn primary" type="submit">
            Search
          </button>
          <button
            className="pc-btn ghost"
            type="button"
            onClick={() => {
              setQ("");
              load("");
            }}
          >
            Clear
          </button>
        </form>
      </div>

      {/* Form Card */}
      <div className="pc-card">
        <h3 className="pc-card-title">
          {editingId ? "Edit Seed Batch" : "Add Seed Batch"}
        </h3>

        <form className="pc-form-grid" onSubmit={onSubmit}>
          <div className="pc-field">
            <label>Seed Code *</label>
            <input
              className="pc-input"
              required
              value={form.seedCode}
              onChange={(e) => setForm({ ...form, seedCode: e.target.value })}
              placeholder="e.g., STRAWB-25-A01"
            />
          </div>

          <div className="pc-field">
            <label>Crop Type *</label>
            <input
              className="pc-input"
              required
              value={form.cropType}
              onChange={(e) => setForm({ ...form, cropType: e.target.value })}
              placeholder="Strawberry"
            />
          </div>

          <div className="pc-field">
            <label>Supplier</label>
            <input
              className="pc-input"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              placeholder="AgriSeeds Ltd"
            />
          </div>

          <div className="pc-field">
            <label>Quantity *</label>
            <input
              className="pc-input"
              type="number"
              min="0"
              required
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: Number(e.target.value) })
              }
            />
          </div>

          <div className="pc-field">
            <label>Unit</label>
            <select
              className="pc-input"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              <option>seeds</option>
              <option>trays</option>
              <option>packets</option>
            </select>
          </div>

          <div className="pc-field">
            <label>Procured Date *</label>
            <input
              className="pc-input"
              type="date"
              required
              value={form.procuredDate}
              onChange={(e) =>
                setForm({ ...form, procuredDate: e.target.value })
              }
            />
          </div>

          <div className="pc-field">
            <label>Expiry Date</label>
            <input
              className="pc-input"
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm({ ...form, expiryDate: e.target.value })
              }
            />
          </div>

          <div className="pc-field pc-field-col2">
            <label>Notes</label>
            <input
              className="pc-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Variety, lot info, or storage notes"
            />
          </div>

          <div className="pc-form-actions">
            <button className="pc-btn success" type="submit">
              {editingId ? "Update Batch" : "Add Batch"}
            </button>
            {editingId && (
              <button className="pc-btn ghost" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="pc-card">
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Crop</th>
                <th>Supplier</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Procured</th>
                <th>Expiry</th>
                <th>Notes</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="pc-empty">
                      <div className="pc-empty-title">No seeds found</div>
                      <div className="pc-empty-text">
                        Add your first batch using the form above.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id}>
                    <td className="mono">{r.seedCode}</td>
                    <td>{r.cropType}</td>
                    <td>{r.supplier || "—"}</td>
                    <td>{r.quantity}</td>
                    <td>{r.unit}</td>
                    <td>
                      {r.procuredDate
                        ? new Date(r.procuredDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {r.expiryDate
                        ? new Date(r.expiryDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td title={r.notes || ""}>
                      {(r.notes || "—").length > 40
                        ? (r.notes || "—").slice(0, 40) + "…"
                        : r.notes || "—"}
                    </td>
                    <td className="right">
                      <div className="pc-row-actions">
                        <button className="pc-btn tiny" onClick={() => startEdit(r)}>
                          Edit
                        </button>
                        <button className="pc-btn tiny danger" onClick={() => del(r._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
