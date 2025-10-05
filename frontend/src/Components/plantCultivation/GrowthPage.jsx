import React, { useEffect, useState } from "react";
import api from "../../api";
import "./pc.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const STAGES = ["germination","seedling","vegetative","flowering","fruiting","harvest-ready","other"];
const ISSUES = ["pest","disease","nutrient","water","other"];

export default function GrowthPage() {
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState("");       // selected plan
  const [rows, setRows] = useState([]);

  // filters
  const [fStage, setFStage] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // form/edit
  const [editingId, setEditingId] = useState(null);
  const empty = () => ({
    date: new Date().toISOString().slice(0,10),
    stage: "germination",
    heightCm: "",
    issues: [],
    notes: ""
  });
  const [form, setForm] = useState(empty());
  const [errors, setErrors] = useState({});

  // load plans then first plan logs
  useEffect(() => {
    (async () => {
      const p = await api.get("/plant-cultivation/plans");
      const list = p.data?.data || [];
      setPlans(list);
      if (list[0]?._id) {
        setPlanId(list[0]._id);
      }
    })();
  }, []);

  useEffect(() => {
    if (!planId) return;
    load();
  }, [planId]);

  const load = async () => {
    if (!planId) return;
    const params = {};
    if (fStage) params.stage = fStage;
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get(`/plant-cultivation/plans/${planId}/logs`, { params });
    setRows(data?.data || []);
  };

  // validation
  const validate = (b) => {
    const e = {};
    if (!b.date) e.date = "Date is required";
    if (!b.stage) e.stage = "Stage is required";
    const only = (d)=> new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const d = b.date ? new Date(b.date) : null;
    const today = only(new Date());
    const dOnly = d ? only(d) : null;
    if (dOnly && dOnly > today) e.date = "Date cannot be in the future";
    if (b.heightCm !== "" && Number(b.heightCm) < 0) e.heightCm = "Height cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!planId) {
      MySwal.fire({ icon:"error", title:"Select a plan", text:"Choose a plan before adding logs." });
      return;
    }
    if (!validate(form)) {
      MySwal.fire({ icon:"error", title:"Check the form", text:"Please fix the highlighted fields." });
      return;
    }
    try {
      if (editingId) {
        await api.patch(`/plant-cultivation/plans/${planId}/logs/${editingId}`, form);
        MySwal.fire({ toast:true, position:"top-end", icon:"success", title:"Log updated", timer:1500, showConfirmButton:false });
      } else {
        await api.post(`/plant-cultivation/plans/${planId}/logs`, form);
        MySwal.fire({ toast:true, position:"top-end", icon:"success", title:"Log added", timer:1500, showConfirmButton:false });
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
      icon:"warning", title:"Delete this log?", text:`${row.stage} on ${new Date(row.date).toLocaleDateString()}`,
      showCancelButton:true, confirmButtonText:"Delete", cancelButtonText:"Cancel",
      confirmButtonColor:"#ef4444", reverseButtons:true
    });
    if (!ask.isConfirmed) return;
    try {
      await api.delete(`/plant-cultivation/plans/${planId}/logs/${row._id}`);
      await load();
      MySwal.fire({ toast:true, position:"top-end", icon:"success", title:"Log deleted", timer:1400, showConfirmButton:false });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Delete failed";
      MySwal.fire({ icon:"error", title:"Delete failed", text: msg });
    }
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setForm({
      date: r.date ? new Date(r.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
      stage: r.stage || "germination",
      heightCm: r.heightCm ?? "",
      issues: Array.isArray(r.issues) ? r.issues : [],
      notes: r.notes || "",
    });
    MySwal.fire({ toast:true, position:"top-end", icon:"info", title:"Editing log", timer:1000, showConfirmButton:false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty());
    setErrors({});
  };

  //pdf
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const exportGrowthPDF = () => {
  if (!planId) return;

  const plan = plans.find(p => p._id === planId);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

  // Title + plan meta
  doc.setFontSize(16);
  doc.text("Growth Monitoring Logs", 40, 40);
  doc.setFontSize(11);
  doc.setTextColor(60);
  doc.text(
    `Plan: ${plan?.planCode || "—"}   •   Crop: ${plan?.cropType || "—"}   •   Section: ${plan?.section || "—"}`,
    40, 60
  );

  // Filters summary
  const filters = [
    fStage ? `stage: ${fStage}` : null,
    from ? `from: ${from}` : null,
    to ? `to: ${to}` : null,
  ].filter(Boolean).join("   •   ");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(filters || "No filters (all records)", 40, 78);
  doc.setTextColor(0);

  // Table data
  const body = rows.map(r => [
    fmt(r.date),
    r.stage,
    r.heightCm == null ? "—" : String(r.heightCm),
    (r.issues && r.issues.length ? r.issues.join(", ") : "—"),
    r.notes || "—",
  ]);

  autoTable(doc, {
    startY: 98,
    head: [["Date","Stage","Height (cm)","Issues","Notes"]],
    body,
    styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
    headStyles: { fillColor: [154, 52, 18] }, // amber/brown to match growth accent
    columnStyles: {
      0: { cellWidth: 90 },   // Date
      1: { cellWidth: 130 },  // Stage
      2: { cellWidth: 90, halign: "right" }, // Height
      3: { cellWidth: 180 },  // Issues
      4: { cellWidth: 380 },  // Notes
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
  doc.save(`growth_logs_${plan?.planCode || "plan"}_${stamp}.pdf`);
};


  return (
   <div className="pc-page" data-module="growth">
      <div className="pc-header">
        <div>
          <h2 className="pc-title">Growth Monitoring</h2>
          <p className="pc-sub">Log plant growth stages per plan.</p>
        </div>
      </div>

      {/* Plan selector + filters */}
      <div className="pc-card">
        <div className="pc-search pc-search-rows">
          <div className="pc-row gap">
            <select className="pc-input" value={planId} onChange={(e)=>setPlanId(e.target.value)}>
              <option value="">Select plan…</option>
              {plans.map(p => (
                <option key={p._id} value={p._id}>
                  {p.planCode} — {p.cropType} ({p.section})
                </option>
              ))}
            </select>
            <select className="pc-input" value={fStage} onChange={(e)=>setFStage(e.target.value)}>
              <option value="">All stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="pc-input" type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
            <input className="pc-input" type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
            <button className="pc-btn primary" onClick={load} disabled={!planId}>Filter</button>
            <button className="pc-btn ghost" onClick={()=>{ setFStage(""); setFrom(""); setTo(""); load(); }} disabled={!planId}>Clear</button>
            <button
  className="pc-btn"
  type="button"
  onClick={exportGrowthPDF}
  disabled={!planId}
  title="Export current logs to PDF"
>
  Export PDF
</button>

          </div>
        </div>
      </div>

      {/* Form */}
      <div className="pc-card">
        <h3 className="pc-card-title">{editingId ? "Edit Log" : "Add Log"}</h3>
        <form className="pc-form-grid" onSubmit={onSubmit}>
          <div className="pc-field">
            <label>Date *</label>
            <input className={`pc-input ${errors.date ? "error" : ""}`} type="date" value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})}/>
            {errors.date && <div className="pc-hint error">{errors.date}</div>}
          </div>

          <div className="pc-field">
            <label>Stage *</label>
            <select className={`pc-input ${errors.stage ? "error" : ""}`} value={form.stage} onChange={(e)=>setForm({...form, stage:e.target.value})}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.stage && <div className="pc-hint error">{errors.stage}</div>}
          </div>

          <div className="pc-field">
            <label>Height (cm)</label>
            <input className={`pc-input ${errors.heightCm ? "error" : ""}`} type="number" min="0" value={form.heightCm}
                   onChange={(e)=>setForm({...form, heightCm: e.target.value === "" ? "" : Number(e.target.value)})}/>
            {errors.heightCm && <div className="pc-hint error">{errors.heightCm}</div>}
          </div>

          <div className="pc-field pc-field-col2">
            <label>Issues</label>
            <div className="pc-input-group">
              {ISSUES.map(x => (
                <label key={x} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <input
                    type="checkbox"
                    checked={form.issues.includes(x)}
                    onChange={(e)=>{
                      const chk = e.target.checked;
                      setForm((prev)=>{
                        const set = new Set(prev.issues);
                        if (chk) set.add(x); else set.delete(x);
                        return { ...prev, issues: Array.from(set) };
                      });
                    }}
                  />
                  {x}
                </label>
              ))}
            </div>
          </div>

          <div className="pc-field pc-field-col2">
            <label>Notes</label>
            <input className="pc-input" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} placeholder="Observations, actions taken, etc."/>
          </div>

          <div className="pc-form-actions">
            <button className="pc-btn success" type="submit" disabled={!planId}>{editingId ? "Update Log" : "Add Log"}</button>
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
                <th>Date</th><th>Stage</th><th>Height (cm)</th><th>Issues</th><th>Notes</th><th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!planId || rows.length === 0) ? (
                <tr>
                  <td colSpan={6}>
                    <div className="pc-empty">
                      <div className="pc-empty-title">{planId ? "No logs" : "Select a plan"}</div>
                      <div className="pc-empty-text">
                        {planId ? "Add the first log using the form above." : "Choose a plan to view and add logs."}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : rows.map(r => (
                <tr key={r._id}>
                  <td>{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                  <td><span className={`badge ${r.stage}`}>{r.stage}</span></td>
                  <td>{r.heightCm ?? "—"}</td>
                  <td>{(r.issues && r.issues.length) ? r.issues.join(", ") : "—"}</td>
                  <td title={r.notes || ""}>{(r.notes || "—").length > 60 ? (r.notes || "—").slice(0,60)+"…" : (r.notes || "—")}</td>
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
