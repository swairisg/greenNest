// frontend/src/Components/tasksHR/Payroll.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { useHRChrome } from "./HRLayout";
import "./Employees.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

export default function Payroll() {
  const nav = useNavigate();
  const { setRight, clearRight } = useHRChrome();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  useEffect(() => {
    setRight(
      <Link to="/hr" className="hrlist-btn ghost">← Back</Link>
    );
    return clearRight;
  }, [setRight, clearRight]);

  const buildParams = (overrides = {}) => {
    const p = { page, pageSize, ...overrides };
    if (from) p.from = from;
    if (to) p.to = to;
    if (status !== "all") p.status = status;
    return p;
  };

  const fetchList = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/hr/payruns", { params: buildParams() });
      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load payruns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [page, status]);
  const sref = useRef();
  useEffect(() => {
    clearTimeout(sref.current);
    sref.current = setTimeout(() => { setPage(1); fetchList(); }, 300);
    return () => clearTimeout(sref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const createPayrun = async () => {
    const html = `
      <div style="display:grid;gap:10px;text-align:left">
        <label style="display:grid;gap:6px">
          <span style="font-size:12px;color:#374151">Period start</span>
          <input id="p-start" type="date" class="swal2-input" style="margin:0" />
        </label>
        <label style="display:grid;gap:6px">
          <span style="font-size:12px;color:#374151">Period end</span>
          <input id="p-end" type="date" class="swal2-input" style="margin:0" />
        </label>
      </div>`;
    const res = await MySwal.fire({
      title: "New Payrun",
      html, showCancelButton: true, confirmButtonText: "Create",
      preConfirm: () => {
        const ps = document.getElementById("p-start").value;
        const pe = document.getElementById("p-end").value;
        if (!ps || !pe) return MySwal.showValidationMessage("Both dates required");
        if (new Date(ps) >= new Date(pe)) return MySwal.showValidationMessage("End must be after Start");
        return { periodStart: ps, periodEnd: pe };
      }
    });
    if (!res.isConfirmed) return;

    try {
      const out = await api.post("/hr/payruns", res.value);
      const id = out.data?.data?._id || out.data?.data?.id || out.data?.id;
      MySwal.fire({ toast: true, position: "top-end", icon: "success", title: "Payrun created", timer: 1600, showConfirmButton: false });
      if (id) nav(`/hr/payroll/${id}`);
      else fetchList();
    } catch (e) {
      MySwal.fire({ icon: "error", title: "Create failed", text: e?.response?.data?.message || e.message });
    }
  };

  const badge = (s) => <span className={`badge ${s}`}>{s}</span>;

  return (
    <div className="hrlist-wrap">
      <div className="hrlist-card">
        <div className="hrlist-head">
          <h2>Payroll</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="hrlist-btn" onClick={createPayrun}>+ New Payrun</button>
            <button className="hrlist-btn ghost" onClick={fetchList} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
          </div>
        </div>

        {/* Filters */}
        <div className="hrlist-filters">
          <input className="hrlist-input" type="date" value={from} onChange={(e)=>setFrom(e.target.value)} title="From" />
          <input className="hrlist-input" type="date" value={to} onChange={(e)=>setTo(e.target.value)} title="To" />
          <select className="hrlist-select" value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1);}}>
            {["all","draft","computed","approved","paid"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-teal" disabled={loading} onClick={()=>{ setPage(1); fetchList(); }}>
            {loading ? "Loading…" : "Search"}
          </button>
        </div>

        {err && <div className="hrlist-error">{err}</div>}

        <div className="hrlist-tablewrap">
          <table className="hrlist-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Status</th>
                <th>Entries</th>
                <th>Created</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="hrlist-empty">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="hrlist-empty">No payruns</td></tr>
              ) : rows.map(r => (
                <tr key={r._id}>
                  <td className="hrlist-name">
                    {new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}
                  </td>
                  <td>{badge(r.status)}</td>
                  <td>{r.entries?.length ?? 0}</td>
                  <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <button className="hrlist-btn edit small" onClick={()=>nav(`/hr/payroll/${r._id}`)}>Open</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="hrlist-pager">
          <div className="hrlist-pager-info">Page {page} of {totalPages} • {total} total</div>
          <div className="hrlist-pager-btns">
            <button className="hrlist-btn ghost small" disabled={page<=1||loading} onClick={()=>setPage(p=>Math.max(1,p-1))}>← Prev</button>
            <button className="hrlist-btn ghost small" disabled={page>=totalPages||loading} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
