import React, { useEffect, useState } from "react";
import api from "../../api";
import "./pc.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const TYPES = ["soil-test","clearing","bed-prep","amendment","irrigation-setup","fumigation","other"];
const SECTIONS = [
  "GH-1 / Bed A","GH-1 / Bed B","GH-1 / Bed C",
  "GH-2 / Bed A","GH-2 / Bed B","GH-2 / Bed C",
  "GH-3 / North","GH-3 / South",
  "Nursery-1","Nursery-2","Hydro-Channel-1","Hydro-Channel-2"
];

export default function LandPrepPage() {
  const [rows, setRows] = useState([]);

  // filters
  const [q, setQ] = useState("");
  const [fSection, setFSection] = useState("");
  const [fType, setFType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // form/edit
  const [editingId, setEditingId] = useState(null);
  const [useOtherSection, setUseOtherSection] = useState(false);

  const empty = () => ({
    section: "",
    activityType: "soil-test",
    date: new Date().toISOString().slice(0,10),
    details: "",
    cost: "",
    performedBy: "",
    files: [],
  });
  const [form, setForm] = useState(empty());
  const [errors, setErrors] = useState({});

  const load = async () => {
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (fSection) params.section = fSection;
    if (fType) params.type = fType;
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get("/plant-cultivation/land-prep", { params });
    setRows(data?.data || []);
  };

  useEffect(() => { load(); }, []);

  const validate = (b) => {
    const e = {};
    if (!b.section) e.section = "Section is required";
    if (!b.activityType) e.activityType = "Activity is required";
    if (!b.date) e.date = "Date is required";
    const only = (d)=> new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const d = b.date ? new Date(b.date) : null;
    const today = only(new Date());
    const dOnly = d ? only(d) : null;
    if (dOnly && dOnly > today) e.date = "Date cannot be in the future";
    if (b.cost !== "" && Number(b.cost) < 0) e.cost = "Cost cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate(form)) {
      MySwal.fire({ icon:"error", title:"Check the form", text:"Please fix the highlighted fields." });
      return;
    }
    try {
      const payload = { ...form, cost: form.cost === "" ? undefined : Number(form.cost) };
      if (editingId) {
        await api.patch(`/plant-cultivation/land-prep/${editingId}`, payload);
        MySwal.fire({ toast:true, position:"top-end", icon:"success", title:"Record updated", timer:1500, showConfirmButton:false });
      } else {
        await api.post("/plant-cultivation/land-prep", payload);
        MySwal.fire({ toast:true, position:"top-end", icon:"success", title:"Record added", timer:1500, showConfirmButton:false });
      }
      cancelEdit();
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Save failed";
      MySwal.fire({ icon:"error", title:"Save failed", text: msg });
    }
  };

  const del = async (row) => {
    const ask = await MySwal.fire({
      icon:"warning", title:"Delete this record?", text:`${row.activityType} • ${row.section}`,
      showCancelButton:true, confirmButtonText:"Delete", cancelButtonText:"Cancel",
      confirmButtonColor:"#ef4444", reverseButtons:true
    });
    if (!ask.isConfirmed) return;
    try {
      await api.delete(`/plant-cultivation/land-prep/${row._id}`);
      await load();
      MySwal.fire({ toast:true, position:"top-end", icon:"success", title:"Record deleted", timer:1400, showConfirmButton:false });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Delete failed";
      MySwal.fire({ icon:"error", title:"Delete failed", text: msg });
    }
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setUseOtherSection(SECTIONS.includes(r.section) ? false : true);
    setForm({
      section: r.section || "",
      activityType: r.activityType || "soil-test",
      date: r.date ? new Date(r.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
      details: r.details || "",
      cost: r.cost ?? "",
      performedBy: r.performedBy || "",
      files: r.files || [],
    });
    MySwal.fire({ toast:true, position:"top-end", icon:"info", title:"Editing record", timer:1000, showConfirmButton:false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setUseOtherSection(false);
    setForm(empty());
    setErrors({});
  };

//pdf
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const money = (v) => (v == null || v === "" ? "—" : Number(v).toLocaleString());

const exportLandPrepPDF = () => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

  // Title
  doc.setFontSize(16);
  doc.text("Land Preparation Records", 40, 40);

  // Filters summary
  const filters = [
    q ? `q: "${q}"` : null,
    fSection ? `section: ${fSection}` : null,
    fType ? `activity: ${fType}` : null,
    from ? `from: ${from}` : null,
    to ? `to: ${to}` : null,
  ].filter(Boolean).join("   •   ");

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(filters || "No filters (all records)", 40, 58);
  doc.setTextColor(0);

  // Table rows
  const body = rows.map((r) => [
    fmt(r.date),
    r.section || "—",
    r.activityType || "—",
    r.performedBy || "—",
    money(r.cost),
    r.details || "—",
  ]);

  autoTable(doc, {
    startY: 78,
    head: [["Date","Section","Activity","Performed By","Cost (LKR)","Details"]],
    body,
    styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
    headStyles: { fillColor: [30, 64, 175] }, // indigo (same vibe as plans/land)
    columnStyles: {
      0: { cellWidth: 90 },   // Date
      1: { cellWidth: 150 },  // Section
      2: { cellWidth: 140 },  // Activity
      3: { cellWidth: 140 },  // Performed By
      4: { cellWidth: 90, halign: "right" },  // Cost
      5: { cellWidth: 360 },  // Details
    },
    margin: { left: 40, right: 40 },
    didDrawPage() {
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      const gen = new Date().toLocaleString();
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Generated: ${gen}`, 40, h - 20);
      const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
      doc.text(pageStr, w - 40 - doc.getTextWidth(pageStr), h - 20);
      doc.setTextColor(0);
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`land_prep_${stamp}.pdf`);
};


  return (
    <div className="pc-page" data-module="plans">
      <div className="pc-header">
        <div>
          <h2 className="pc-title">Land Preparation</h2>
          <p className="pc-sub">Log soil tests, clearing, amendments, irrigation setup and more.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="pc-card">
        <form className="pc-search pc-search-rows" onSubmit={(e)=>{e.preventDefault(); load();}}>
          <div className="pc-row">
            <input className="pc-input grow" placeholder="Search section / activity / details / person…" value={q} onChange={(e)=>setQ(e.target.value)}/>
            <button className="pc-btn primary" type="submit">Search</button>
            <button className="pc-btn ghost" type="button" onClick={()=>{ setQ(""); setFSection(""); setFType(""); setFrom(""); setTo(""); load(); }}>
              Clear
            </button>
            <button
  className="pc-btn"
  type="button"
  onClick={exportLandPrepPDF}
  title="Export current table to PDF"
>
  Export PDF
</button>

          </div>
          <div className="pc-row gap">
            <select className="pc-input" value={fSection} onChange={(e)=>setFSection(e.target.value)}>
              <option value="">All sections</option>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="pc-input" value={fType} onChange={(e)=>setFType(e.target.value)}>
              <option value="">All activities</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input className="pc-input" type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
            <input className="pc-input" type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
          </div>
        </form>
      </div>

      {/* Form */}
      <div className="pc-card">
        <h3 className="pc-card-title">{editingId ? "Edit Record" : "Add Record"}</h3>
        <form className="pc-form-grid" onSubmit={onSubmit}>
          <div className="pc-field">
            <label>Section *</label>
            {!useOtherSection ? (
              <div className="pc-input-group">
                <select
                  className={`pc-input ${errors.section ? "error" : ""}`}
                  value={form.section}
                  onChange={(e)=>{
                    if (e.target.value === "__other") { setUseOtherSection(true); setForm({ ...form, section: "" }); }
                    else setForm({ ...form, section: e.target.value });
                  }}
                >
                  <option value="">Choose section…</option>
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="__other">Other…</option>
                </select>
                <button type="button" className="pc-btn tiny ghost" onClick={()=>{ setUseOtherSection(true); setForm({ ...form, section: "" }); }}>
                  Custom
                </button>
              </div>
            ) : (
              <div className="pc-input-group">
                <input className={`pc-input ${errors.section ? "error" : ""}`} placeholder="Type section…"
                       value={form.section} onChange={(e)=>setForm({ ...form, section: e.target.value })}/>
                <button type="button" className="pc-btn tiny ghost" onClick={()=>setUseOtherSection(false)}>List</button>
              </div>
            )}
            {errors.section && <div className="pc-hint error">{errors.section}</div>}
          </div>

          <div className="pc-field">
            <label>Activity *</label>
            <select className={`pc-input ${errors.activityType ? "error" : ""}`} value={form.activityType} onChange={(e)=>setForm({ ...form, activityType: e.target.value })}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.activityType && <div className="pc-hint error">{errors.activityType}</div>}
          </div>

          <div className="pc-field">
            <label>Date *</label>
            <input className={`pc-input ${errors.date ? "error" : ""}`} type="date" value={form.date} onChange={(e)=>setForm({ ...form, date: e.target.value })} />
            {errors.date && <div className="pc-hint error">{errors.date}</div>}
          </div>

          <div className="pc-field">
            <label>Cost (LKR)</label>
            <input className={`pc-input ${errors.cost ? "error" : ""}`} type="number" min="0" value={form.cost}
                   onChange={(e)=>setForm({ ...form, cost: e.target.value === "" ? "" : Number(e.target.value) })}/>
            {errors.cost && <div className="pc-hint error">{errors.cost}</div>}
          </div>

          <div className="pc-field">
            <label>Performed By</label>
            <input className="pc-input" value={form.performedBy} onChange={(e)=>setForm({ ...form, performedBy: e.target.value })} placeholder="Name / team"/>
          </div>

          <div className="pc-field pc-field-col2">
            <label>Details</label>
            <input className="pc-input" value={form.details} onChange={(e)=>setForm({ ...form, details: e.target.value })} placeholder="Soil pH, amendments used, notes…"/>
          </div>

          <div className="pc-form-actions">
            <button className="pc-btn success" type="submit">{editingId ? "Update" : "Add"}</button>
            {editingId && <button className="pc-btn ghost" type="button" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="pc-card">
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead>
              <tr>
                <th>Date</th><th>Section</th><th>Activity</th><th>Performed By</th><th>Cost</th><th>Details</th><th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="pc-empty">
                      <div className="pc-empty-title">No records</div>
                      <div className="pc-empty-text">Try adjusting filters or add a new record above.</div>
                    </div>
                  </td>
                </tr>
              ) : rows.map(r => (
                <tr key={r._id}>
                  <td>{fmt(r.date)}</td>
                  <td>{r.section}</td>
                  <td><span className="badge">{r.activityType}</span></td>
                  <td>{r.performedBy || "—"}</td>
                  <td>{r.cost != null ? Number(r.cost).toLocaleString() : "—"}</td>
                  <td title={r.details || ""}>{(r.details || "—").length > 60 ? (r.details || "—").slice(0,60)+"…" : (r.details || "—")}</td>
                  <td className="right">
                    <div className="pc-row-actions">
                      <button className="pc-btn tiny" onClick={()=>startEdit(r)}>Edit</button>
                      <button className="pc-btn tiny danger" onClick={()=>del(r)}>Delete</button>
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
