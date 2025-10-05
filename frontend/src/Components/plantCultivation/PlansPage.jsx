import React, { useEffect, useState } from "react";
import api from "../../api";
import "./pc.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);



const STATUSES = ["planned","active","completed","cancelled"];
const UNITS = ["seedlings","trays","beds","plants"];

const SECTIONS = [
  "GH-1 / Bed A","GH-1 / Bed B","GH-1 / Bed C",
  "GH-2 / Bed A","GH-2 / Bed B","GH-2 / Bed C",
  "GH-3 / North","GH-3 / South",
  "Nursery-1","Nursery-2","Hydro-Channel-1","Hydro-Channel-2"
];


export default function PlansPage() {
  const [rows, setRows] = useState([]);
  const [seedBatches, setSeedBatches] = useState([]);

  // filters
  const [q, setQ] = useState("");
  const [fCrop, setFCrop] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fSection, setFSection] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // form / edit
  const [editingId, setEditingId] = useState(null);
  const empty = () => ({
    planCode: "",
    cropType: "",
    seedBatchId: "",
    section: "",
    startDate: new Date().toISOString().slice(0,10),
    expectedHarvestStart: "",
    expectedHarvestEnd: "",
    quantityPlanned: 1,
    unit: "seedlings",
    status: "planned",
    instructions: ""
  });
  const [form, setForm] = useState(empty());
  const [errors, setErrors] = useState({});
  const [useOtherSection, setUseOtherSection] = useState(false);


  // load seed batches (for dropdown) + plans
  useEffect(() => {
    (async () => {
      const sb = await api.get("/plant-cultivation/seeds");
      setSeedBatches(sb.data?.data || []);
      const pl = await api.get("/plant-cultivation/plans");
      setRows(pl.data?.data || []);
    })();
  }, []);
  

  const load = async () => {
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (fCrop) params.crop = fCrop;
    if (fStatus) params.status = fStatus;
    if (fSection) params.section = fSection;
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get("/plant-cultivation/plans", { params });
    setRows(data?.data || []);
  };

  /* validation */
  const validate = (b) => {
    const e = {};
    if (!b.planCode) e.planCode = "Plan code is required";
    if (!b.cropType) e.cropType = "Crop is required";
    if (!b.seedBatchId) e.seedBatchId = "Seed batch is required";
    if (!b.section) e.section = "Section is required";
    if (!b.startDate) e.startDate = "Start date is required";
    if (b.quantityPlanned == null || Number(b.quantityPlanned) <= 0) e.quantityPlanned = "Must be > 0";

    const only = (d)=> new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const sd = b.startDate ? new Date(b.startDate) : null;
    const hs = b.expectedHarvestStart ? new Date(b.expectedHarvestStart) : null;
    const he = b.expectedHarvestEnd ? new Date(b.expectedHarvestEnd) : null;
    const sdOnly = sd ? only(sd) : null;
    const hsOnly = hs ? only(hs) : null;
    const heOnly = he ? only(he) : null;
    if (hsOnly && sdOnly && hsOnly < sdOnly) e.expectedHarvestStart = "Cannot be before start date";
    if (heOnly && sdOnly && heOnly < sdOnly) e.expectedHarvestEnd = "Cannot be before start date";
    if (heOnly && hsOnly && heOnly < hsOnly) e.expectedHarvestEnd = "Cannot be before harvest start";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* submit */
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate(form)) {
      MySwal.fire({ icon: "error", title: "Check the form", text: "Please fix the highlighted fields." });
      return;
    }
    try {
      if (editingId) {
        await api.patch(`/plant-cultivation/plans/${editingId}`, form);
        MySwal.fire({ toast:true, position:"top-end", icon:"success", title:"Plan updated", timer:1600, showConfirmButton:false });
      } else {
        await api.post("/plant-cultivation/plans", form);
        MySwal.fire({ toast:true, position:"top-end", icon:"success", title:"Plan created", timer:1600, showConfirmButton:false });
      }
      cancelEdit();
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Save failed";
      MySwal.fire({ icon: "error", title: "Save failed", text: msg });
    }
  };

  /* delete */
  const del = async (row) => {
    const ask = await MySwal.fire({
      icon:"warning", title:"Delete this plan?", text:`This will remove ${row.planCode}.`,
      showCancelButton:true, confirmButtonText:"Delete", cancelButtonText:"Cancel", confirmButtonColor:"#ef4444", reverseButtons:true
    });
    if (!ask.isConfirmed) return;
    try {
      await api.delete(`/plant-cultivation/plans/${row._id}`);
      await load();
      MySwal.fire({ toast:true, position:"top-end", icon:"success", title:"Plan deleted", timer:1500, showConfirmButton:false });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Delete failed";
      MySwal.fire({ icon:"error", title:"Delete failed", text: msg });
    }
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setForm({
      planCode: r.planCode || "",
      cropType: r.cropType || "",
      seedBatchId: r.seedBatchId?._id || r.seedBatchId || "",
      section: r.section || "",
      startDate: r.startDate ? new Date(r.startDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
      expectedHarvestStart: r.expectedHarvestStart ? new Date(r.expectedHarvestStart).toISOString().slice(0,10) : "",
      expectedHarvestEnd: r.expectedHarvestEnd ? new Date(r.expectedHarvestEnd).toISOString().slice(0,10) : "",
      quantityPlanned: r.quantityPlanned ?? 1,
      unit: r.unit || "seedlings",
      status: r.status || "planned",
      instructions: r.instructions || "",
    });
    MySwal.fire({ toast:true, position:"top-end", icon:"info", title:`Editing ${r.planCode}`, timer:1200, showConfirmButton:false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty());
    setErrors({});
  };

//PDF export
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const exportPlansPDF = () => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

  // Title
  doc.setFontSize(16);
  doc.text("Planting Plans", 40, 40);

  // Filters summary
  const filters = [
    q ? `q: "${q}"` : null,
    fCrop ? `crop: ${fCrop}` : null,
    fStatus ? `status: ${fStatus}` : null,
    fSection ? `section: ${fSection}` : null,
    from ? `from: ${from}` : null,
    to ? `to: ${to}` : null,
  ].filter(Boolean).join("   •   ");

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(filters || "No filters (all records)", 40, 58);
  doc.setTextColor(0);

  // Table data
  const body = rows.map((r) => [
    r.planCode,
    r.cropType,
    r.seedBatchId?.seedCode || "—",
    r.section,
    fmt(r.startDate),
    `${fmt(r.expectedHarvestStart)} – ${fmt(r.expectedHarvestEnd)}`,
    String(r.quantityPlanned ?? ""),
    r.unit || "—",
    r.status || "—",
    r.instructions || "—",
  ]);

  autoTable(doc, {
    startY: 78,
    head: [[
      "Plan","Crop","Seed Batch","Section","Start","Harvest Window",
      "Qty","Unit","Status","Instructions"
    ]],
    body,
    styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
    headStyles: { fillColor: [6, 95, 70] }, // deep green
    columnStyles: {
      0:{cellWidth:110}, 1:{cellWidth:120}, 2:{cellWidth:120}, 3:{cellWidth:110},
      4:{cellWidth:80},  5:{cellWidth:150}, 6:{cellWidth:50, halign:"right"},
      7:{cellWidth:70},  8:{cellWidth:90},  9:{cellWidth:240},
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
  doc.save(`planting_plans_${stamp}.pdf`);
};

  
  return (
    <div className="pc-page">
      <div className="pc-header">
        <div>
          <h2 className="pc-title">Planting Plans</h2>
          <p className="pc-sub">Schedule crops into sections, linked to seed batches.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="pc-card">
        <form className="pc-search pc-search-rows" onSubmit={(e)=>{e.preventDefault(); load();}}>
          <div className="pc-row">
            <input className="pc-input grow" placeholder="Search plan code / crop / section / notes…" value={q} onChange={(e)=>setQ(e.target.value)}/>
            <button className="pc-btn primary" type="submit">Search</button>
            <button className="pc-btn ghost" type="button" onClick={()=>{ setQ(""); setFCrop(""); setFStatus(""); setFSection(""); setFrom(""); setTo(""); load(); }}>
              Clear
            </button>
            <button
  className="pc-btn"
  type="button"
  onClick={exportPlansPDF}
  title="Export current list as PDF"
>
  Export PDF
</button>

          </div>
          <div className="pc-row gap">
            <input className="pc-input" placeholder="Crop…" value={fCrop} onChange={(e)=>setFCrop(e.target.value)} />
            <select className="pc-input" value={fStatus} onChange={(e)=>setFStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
           
           <select className="pc-input" value={fSection} onChange={(e)=>setFSection(e.target.value)}>
  <option value="">All sections</option>
  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
</select>

            <input className="pc-input" type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
            <input className="pc-input" type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
          </div>
        </form>
      </div>

      {/* Form */}
      <div className="pc-card">
        <h3 className="pc-card-title">{editingId ? "Edit Plan" : "Create Plan"}</h3>
        <form className="pc-form-grid" onSubmit={onSubmit}>
          <div className="pc-field">
            <label>Plan Code *</label>
            <input className={`pc-input ${errors.planCode ? "error" : ""}`} value={form.planCode} onChange={(e)=>setForm({...form, planCode:e.target.value})}/>
            {errors.planCode && <div className="pc-hint error">{errors.planCode}</div>}
          </div>

          <div className="pc-field">
            <label>Crop *</label>
            <input className={`pc-input ${errors.cropType ? "error" : ""}`} value={form.cropType} onChange={(e)=>setForm({...form, cropType:e.target.value})}/>
            {errors.cropType && <div className="pc-hint error">{errors.cropType}</div>}
          </div>

          <div className="pc-field">
            <label>Seed Batch *</label>
            <select className={`pc-input ${errors.seedBatchId ? "error" : ""}`} value={form.seedBatchId} onChange={(e)=>setForm({...form, seedBatchId:e.target.value})}>
              <option value="">Choose batch…</option>
              {seedBatches.map(b => (
                <option key={b._id} value={b._id}>
                  {b.seedCode} — {b.cropType}
                </option>
              ))}
            </select>
            {errors.seedBatchId && <div className="pc-hint error">{errors.seedBatchId}</div>}
          </div>

         <div className="pc-field">
  <label>Section *</label>

  {!useOtherSection ? (
    <div className="pc-input-group">
      <select
        className={`pc-input ${errors.section ? "error" : ""}`}
        value={form.section}
        onChange={(e) => {
          if (e.target.value === "__other") {
            setUseOtherSection(true);
            setForm({ ...form, section: "" });
          } else {
            setForm({ ...form, section: e.target.value });
          }
        }}
      >
        <option value="">Choose section…</option>
        {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        <option value="__other">Other…</option>
      </select>
      <button
        type="button"
        className="pc-btn tiny ghost"
        onClick={() => { setUseOtherSection(true); setForm({ ...form, section: "" }); }}
      >
        Custom
      </button>
    </div>
  ) : (
    <div className="pc-input-group">
      <input
        className={`pc-input ${errors.section ? "error" : ""}`}
        placeholder="Type section… (e.g., GH-4 / Bed A)"
        value={form.section}
        onChange={(e) => setForm({ ...form, section: e.target.value })}
      />
      <button
        type="button"
        className="pc-btn tiny ghost"
        onClick={() => setUseOtherSection(false)}
      >
        List
      </button>
    </div>
  )}

  {errors.section && <div className="pc-hint error">{errors.section}</div>}
</div>


          <div className="pc-field">
            <label>Start Date *</label>
            <input className={`pc-input ${errors.startDate ? "error" : ""}`} type="date" value={form.startDate} onChange={(e)=>setForm({...form, startDate:e.target.value})}/>
            {errors.startDate && <div className="pc-hint error">{errors.startDate}</div>}
          </div>

          <div className="pc-field">
            <label>Harvest Start</label>
            <input className={`pc-input ${errors.expectedHarvestStart ? "error" : ""}`} type="date" value={form.expectedHarvestStart} onChange={(e)=>setForm({...form, expectedHarvestStart:e.target.value})}/>
            {errors.expectedHarvestStart && <div className="pc-hint error">{errors.expectedHarvestStart}</div>}
          </div>

          <div className="pc-field">
            <label>Harvest End</label>
            <input className={`pc-input ${errors.expectedHarvestEnd ? "error" : ""}`} type="date" value={form.expectedHarvestEnd} onChange={(e)=>setForm({...form, expectedHarvestEnd:e.target.value})}/>
            {errors.expectedHarvestEnd && <div className="pc-hint error">{errors.expectedHarvestEnd}</div>}
          </div>

          <div className="pc-field">
            <label>Quantity *</label>
            <input className={`pc-input ${errors.quantityPlanned ? "error" : ""}`} type="number" min="1" value={form.quantityPlanned} onChange={(e)=>setForm({...form, quantityPlanned:Number(e.target.value)})}/>
            {errors.quantityPlanned && <div className="pc-hint error">{errors.quantityPlanned}</div>}
          </div>

          <div className="pc-field">
            <label>Unit</label>
            <select className="pc-input" value={form.unit} onChange={(e)=>setForm({...form, unit:e.target.value})}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="pc-field">
            <label>Status</label>
            <select className="pc-input" value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="pc-field pc-field-col2">
            <label>Instructions</label>
            <input className="pc-input" value={form.instructions} onChange={(e)=>setForm({...form, instructions:e.target.value})} placeholder="Any notes, spacing, fertigation schedule etc."/>
          </div>

          <div className="pc-form-actions">
            <button className="pc-btn success" type="submit">{editingId ? "Update Plan" : "Create Plan"}</button>
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
                <th>Plan</th><th>Crop</th><th>Batch</th><th>Section</th>
                <th>Start</th><th>Harvest</th><th>Qty</th><th>Unit</th><th>Status</th><th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="pc-empty">
                      <div className="pc-empty-title">No plans found</div>
                      <div className="pc-empty-text">Create your first plan using the form above.</div>
                    </div>
                  </td>
                </tr>
              ) : rows.map(r => (
                <tr key={r._id}>
                  <td className="mono">{r.planCode}</td>
                  <td>{r.cropType}</td>
                  <td>{r.seedBatchId?.seedCode || "—"}</td>
                  <td>{r.section}</td>
                  <td>{r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"}</td>
                  <td>
                    {r.expectedHarvestStart ? new Date(r.expectedHarvestStart).toLocaleDateString() : "—"}
                    {" – "}
                    {r.expectedHarvestEnd ? new Date(r.expectedHarvestEnd).toLocaleDateString() : "—"}
                  </td>
                  <td>{r.quantityPlanned}</td>
                  <td>{r.unit}</td>
                  <td><span className={`badge ${r.status}`}>{r.status}</span></td>
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
