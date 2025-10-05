import React, { useEffect, useState } from "react";
import api from "../../api";
import "./pc.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);



/* ======= suggestions (edit as you like) ======= */
const CROPS = [
  "Strawberry","Tomato","Cucumber","Lettuce","Bell Pepper",
  "Spinach","Broccoli","Cauliflower","Carrot","Cabbage",
  "Rose","Gerbera","Chrysanthemum"
];
const SUPPLIERS = [
  "AgriSeeds Ltd","GreenLeaf Seeds","Highland Agro",
  "Ceylon Growers","HydroFresh Supplies"
];

const UNITS = ["seeds","trays","packets"];

export default function SeedsPage() {
  const [rows, setRows] = useState([]);

  // filters
  const [q, setQ] = useState("");
  const [fCrop, setFCrop] = useState("");
  const [fSupplier, setFSupplier] = useState("");
  const [fUnit, setFUnit] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // create/edit
  const [editingId, setEditingId] = useState(null);
  const [useOtherCrop, setUseOtherCrop] = useState(false);
  const [useOtherSupplier, setUseOtherSupplier] = useState(false);

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
  const [errors, setErrors] = useState({});

  const load = async () => {
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (fCrop) params.crop = fCrop;
    if (fSupplier) params.supplier = fSupplier;
 
    if (fSupplier) params.supplier = fSupplier;
    if (fUnit) params.unit = fUnit;
    if (from) params.from = from;
    if (to) params.to = to;

    const { data } = await api.get("/plant-cultivation/seeds", { params });
    setRows(data?.data || []);
  };

  useEffect(() => { load(); }, []); // initial

  /* ===== client-side validations ===== */
  const validate = (b) => {
    const e = {};
    if (!b.seedCode) e.seedCode = "Seed code is required";
    if (!b.cropType) e.cropType = "Crop type is required";
    if (b.quantity == null || Number(b.quantity) <= 0) e.quantity = "Quantity must be > 0";
    if (!b.procuredDate) e.procuredDate = "Procured date is required";

    const only = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const pd = b.procuredDate ? new Date(b.procuredDate) : null;
const ed = b.expiryDate ? new Date(b.expiryDate) : null;

const today = only(new Date());
const pdOnly = pd ? only(pd) : null;
const edOnly = ed ? only(ed) : null;

if (pdOnly && pdOnly > today) e.procuredDate = "Procured date cannot be in the future";
if (pdOnly && edOnly && edOnly < pdOnly) e.expiryDate = "Expiry cannot be before procured date";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

const onSubmit = async (e) => {
  e.preventDefault();
  if (!validate(form)) {
    MySwal.fire({ icon: "error", title: "Check the form", text: "Please fix the highlighted fields." });
    return;
  }

  try {
    if (editingId) {
      await api.patch(`/plant-cultivation/seeds/${editingId}`, form);
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Seed batch updated",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });
    } else {
      await api.post("/plant-cultivation/seeds", form);
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Seed batch added",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });
    }
    cancelEdit();
    await load();
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Failed to save";
    MySwal.fire({ icon: "error", title: "Save failed", text: msg });
  }
};


  const del = async (row) => {
  const result = await MySwal.fire({
    icon: "warning",
    title: "Delete this seed batch?",
    text: `This will remove ${row.seedCode}.`,
    showCancelButton: true,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#ef4444",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    await api.delete(`/plant-cultivation/seeds/${row._id}`);
    await load();
    MySwal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Seed batch deleted",
      showConfirmButton: false,
      timer: 1600,
      timerProgressBar: true,
    });
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Delete failed";
    MySwal.fire({ icon: "error", title: "Delete failed", text: msg });
  }
};


  const startEdit = (row) => {
    setEditingId(row._id);
    setUseOtherCrop(!CROPS.includes(row.cropType));
    setUseOtherSupplier(row.supplier ? !SUPPLIERS.includes(row.supplier) : false);

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
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });

     MySwal.fire({
    toast: true,
    position: "top-end",
    icon: "info",
    title: `Editing ${row.seedCode}`,
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
  });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setUseOtherCrop(false);
    setUseOtherSupplier(false);
    setForm(empty());
    setErrors({});
  };


const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const exportSeedsPDF = () => {
  // 1) Create doc (landscape for wider table)
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

  // 2) Title
  doc.setFontSize(16);
  doc.text("Seed Inventory", 40, 40);

  // 3) Filters summary (small, gray)
  const filters = [
    q ? `q: "${q}"` : null,
    fCrop ? `crop: ${fCrop}` : null,
    fSupplier ? `supplier: ${fSupplier}` : null,
    fUnit ? `unit: ${fUnit}` : null,
    from ? `from: ${from}` : null,
    to ? `to: ${to}` : null,
  ].filter(Boolean).join("   •   ");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(filters || "No filters (all records)", 40, 58);

  // 4) Table data
  const body = rows.map((r) => [
    r.seedCode,
    r.cropType,
    r.supplier || "—",
    String(r.quantity),
    r.unit,
    fmt(r.procuredDate),
    fmt(r.expiryDate),
    r.notes || "—",
  ]);

  // 5) Table
  autoTable(doc, {
    startY: 78,
    head: [["Code", "Crop", "Supplier", "Qty", "Unit", "Procured", "Expiry", "Notes"]],
    body,
    styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
    headStyles: { fillColor: [6, 95, 70] }, // deep green
    columnStyles: {
      0: { cellWidth: 110 }, // code
      1: { cellWidth: 120 }, // crop
      2: { cellWidth: 140 }, // supplier
      3: { cellWidth: 50, halign: "right" }, // qty
      4: { cellWidth: 60 }, // unit
      5: { cellWidth: 90 }, // procured
      6: { cellWidth: 90 }, // expiry
      7: { cellWidth: 260 }, // notes (flexible)
    },
    didDrawPage(data) {
      // Footer with page X of Y + timestamp
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.getWidth();
      const pageHeight = pageSize.getHeight();
      const gen = new Date().toLocaleString();
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Generated: ${gen}`, 40, pageHeight - 20);
      const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
      doc.text(pageStr, pageWidth - 40 - doc.getTextWidth(pageStr), pageHeight - 20);
      // Reset color
      doc.setTextColor(0);
    },
    margin: { left: 40, right: 40 },
  });

  // 6) Save
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`seeds_${stamp}.pdf`);
};




  return (
    <div className="pc-page">
      {/* Header */}
      <div className="pc-header">
        <div>
          <h2 className="pc-title">Seed Inventory</h2>
          <p className="pc-sub">Track seed batches, suppliers and quantities.</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="pc-card">
        <form
          className="pc-search pc-search-rows"
          onSubmit={(e) => { e.preventDefault(); load(); }}
        >
          <div className="pc-row">
            <input
              className="pc-input grow"
              placeholder="Free text: code / crop / supplier…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="pc-btn primary" type="submit">Search</button>
            <button
              className="pc-btn ghost"
              type="button"
              onClick={() => { setQ(""); setFCrop(""); setFSupplier(""); setFUnit(""); setFrom(""); setTo(""); load(); }}
            >
              Clear
            </button>
            <button
  className="pc-btn"
  type="button"
  onClick={exportSeedsPDF}
  title="Export current table to PDF"
>
  Export PDF
</button>

          </div>

          <div className="pc-row gap">
            <select className="pc-input" value={fCrop} onChange={(e)=>setFCrop(e.target.value)}>
              <option value="">All crops</option>
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="pc-input" value={fSupplier} onChange={(e)=>setFSupplier(e.target.value)}>
              <option value="">All suppliers</option>
              {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="pc-input" value={fUnit} onChange={(e)=>setFUnit(e.target.value)}>
              <option value="">All units</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input className="pc-input" type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
            <input className="pc-input" type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
          </div>

          {/* NOTE: Report button deferred to cultivation dashboard as you requested */}
        </form>
      </div>

      {/* Form Card */}
      <div className="pc-card">
        <h3 className="pc-card-title">{editingId ? "Edit Seed Batch" : "Add Seed Batch"}</h3>

        <form className="pc-form-grid" onSubmit={onSubmit}>
          <div className="pc-field">
            <label>Seed Code *</label>
            <input
              className={`pc-input ${errors.seedCode ? "error" : ""}`}
              required
              value={form.seedCode}
              onChange={(e) => setForm({ ...form, seedCode: e.target.value })}
              placeholder="e.g., STRAWB-25-A01"
            />
            {errors.seedCode && <div className="pc-hint error">{errors.seedCode}</div>}
          </div>

          <div className="pc-field">
            <label>Crop Type *</label>
            {!useOtherCrop ? (
              <div className="pc-input-group">
                <select
                  className={`pc-input ${errors.cropType ? "error" : ""}`}
                  value={form.cropType}
                  onChange={(e) => setForm({ ...form, cropType: e.target.value })}
                >
                  <option value="">Choose crop…</option>
                  {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__other">Other…</option>
                </select>
                <button
                  type="button"
                  className="pc-btn tiny ghost"
                  onClick={() => { setUseOtherCrop(true); setForm({ ...form, cropType: "" }); }}
                >
                  Custom
                </button>
              </div>
            ) : (
              <div className="pc-input-group">
                <input
                  className={`pc-input ${errors.cropType ? "error" : ""}`}
                  placeholder="Type crop…"
                  value={form.cropType}
                  onChange={(e) => setForm({ ...form, cropType: e.target.value })}
                />
                <button type="button" className="pc-btn tiny ghost" onClick={() => setUseOtherCrop(false)}>List</button>
              </div>
            )}
            {errors.cropType && <div className="pc-hint error">{errors.cropType}</div>}
          </div>

          <div className="pc-field">
            <label>Supplier</label>
            {!useOtherSupplier ? (
              <div className="pc-input-group">
                <select
                  className="pc-input"
                  value={form.supplier}
                  onChange={(e) => {
                    if (e.target.value === "__other") {
                      setUseOtherSupplier(true);
                      setForm({ ...form, supplier: "" });
                    } else {
                      setForm({ ...form, supplier: e.target.value });
                    }
                  }}
                >
                  <option value="">Choose supplier…</option>
                  {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="__other">Other…</option>
                </select>
                <button type="button" className="pc-btn tiny ghost" onClick={() => { setUseOtherSupplier(true); setForm({ ...form, supplier: "" }); }}>Custom</button>
              </div>
            ) : (
              <div className="pc-input-group">
                <input
                  className="pc-input"
                  placeholder="Type supplier…"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                />
                <button type="button" className="pc-btn tiny ghost" onClick={() => setUseOtherSupplier(false)}>List</button>
              </div>
            )}
          </div>

          <div className="pc-field">
            <label>Quantity *</label>
            <input
              className={`pc-input ${errors.quantity ? "error" : ""}`}
              type="number" min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
            {errors.quantity && <div className="pc-hint error">{errors.quantity}</div>}
          </div>

          <div className="pc-field">
            <label>Unit</label>
            <select
              className="pc-input"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="pc-field">
            <label>Procured Date *</label>
            <input
              className={`pc-input ${errors.procuredDate ? "error" : ""}`}
              type="date"
              value={form.procuredDate}
              onChange={(e) => setForm({ ...form, procuredDate: e.target.value })}
            />
            {errors.procuredDate && <div className="pc-hint error">{errors.procuredDate}</div>}
          </div>

          <div className="pc-field">
            <label>Expiry Date</label>
            <input
              className={`pc-input ${errors.expiryDate ? "error" : ""}`}
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
            {errors.expiryDate && <div className="pc-hint error">{errors.expiryDate}</div>}
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
            <button className="pc-btn success" type="submit">{editingId ? "Update Batch" : "Add Batch"}</button>
            {editingId && (
              <button className="pc-btn ghost" type="button" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="pc-card">
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead>
              <tr>
                <th>Code</th><th>Crop</th><th>Supplier</th><th>Qty</th>
                <th>Unit</th><th>Procured</th><th>Expiry</th><th>Notes</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="pc-empty">
                      <div className="pc-empty-title">No seeds found</div>
                      <div className="pc-empty-text">Try broadening filters or add a batch above.</div>
                    </div>
                  </td>
                </tr>
              ) : rows.map(r => (
                <tr key={r._id}>
                  <td className="mono">{r.seedCode}</td>
                  <td>{r.cropType}</td>
                  <td>{r.supplier || "—"}</td>
                  <td>{r.quantity}</td>
                  <td>{r.unit}</td>
                  <td>{r.procuredDate ? new Date(r.procuredDate).toLocaleDateString() : "—"}</td>
                  <td>{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "—"}</td>
                  <td title={r.notes || ""}>{(r.notes || "—").length > 40 ? (r.notes || "—").slice(0, 40) + "…" : (r.notes || "—")}</td>
                  <td className="right">
                    <div className="pc-row-actions">
                      <button className="pc-btn tiny" onClick={() => startEdit(r)}>Edit</button>
                     <button className="pc-btn tiny danger" onClick={() => del(r)}>Delete</button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
