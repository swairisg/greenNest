// frontend/src/Components/tasksHR/PayrunView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { useHRChrome } from "./HRLayout";
import "./Employees.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

export default function PayrunView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { setRight, clearRight } = useHRChrome();

  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`/hr/payruns/${id}`);
      setRun(res.data?.data || res.data);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load payrun");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    setRight(
      <div style={{ display:"flex", gap:8 }}>
        <Link to="/hr/payroll" className="hrlist-btn ghost">← Back</Link>
        <button className="hrlist-btn ghost" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      </div>
    );
    return clearRight;
  }, [setRight, clearRight, loading]);

  const compute = async () => {
    try {
      await api.post(`/hr/payruns/${id}/compute`);
      await load();
      toast("Computed");
    } catch (e) { errorBox(e, "Compute failed"); }
  };
  const approve = async () => {
    try {
      await api.post(`/hr/payruns/${id}/approve`);
      await load();
      toast("Approved");
    } catch (e) { errorBox(e, "Approve failed"); }
  };
  const markPaid = async () => {
    try {
      await api.post(`/hr/payruns/${id}/mark-paid`);
      await load();
      toast("Marked paid");
    } catch (e) { errorBox(e, "Mark paid failed"); }
  };

  const canCompute = run && run.status === "draft";
  const canApprove = run && run.status === "computed";
  const canPay = run && run.status === "approved";

  const totalGross = useMemo(
    () => (run?.entries || []).reduce((s,e)=>s+(e.gross||0),0), [run]
  );
  const totalNet = useMemo(
    () => (run?.entries || []).reduce((s,e)=>s+(e.net||0),0), [run]
  );

  const mmToHhmm = (m) => {
    const h = Math.floor((m||0)/60);
    const rem = (m||0) - h*60;
    return `${String(h).padStart(2,"0")}:${String(rem).padStart(2,"0")}`;
    };

  /* ---------------- Payslip (print to PDF) ---------------- */
  const printPayslip = async (entry) => {
    try {
      // get consolidated payload (in case backend enriches more)
      const res = await api.get(`/hr/payruns/${id}/payslips/${entry.employee}`);
      const payload = res.data?.data || res.data;

      const pr = payload.payrun || { periodStart: run.periodStart, periodEnd: run.periodEnd };
      const e = payload.entry || entry;

      const html = `
        <html>
          <head>
            <title>Payslip - ${e.employeeName || ""}</title>
            <style>
              body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 24px; color:#111827; }
              h1 { margin: 0 0 4px; font-size: 18px; color:#065f46; }
              .sub { color:#6b7280; margin-bottom:16px; }
              .card { border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
              table { width:100%; border-collapse: collapse; margin-top: 10px; }
              th, td { text-align:left; padding:8px; border-bottom:1px solid #f3f4f6; font-size: 13px; }
              .right { text-align:right; }
              .totals td { font-weight:700; }
              .muted { color:#6b7280; }
              .grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
              @media print { .noprint { display:none; } }
            </style>
          </head>
          <body>
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div>
                <h1>Payslip</h1>
                <div class="sub">${new Date(pr.periodStart).toLocaleDateString()} – ${new Date(pr.periodEnd).toLocaleDateString()}</div>
              </div>
              <button class="noprint" onclick="window.print()" style="padding:8px 12px;border-radius:10px;border:1px solid #065f46;background:#10b981;color:#fff;cursor:pointer">
                Print / Save PDF
              </button>
            </div>

            <div class="card">
              <div class="grid">
                <div>
                  <div><strong>Employee:</strong> ${e.employeeName || "-"}</div>
                  <div class="muted">${e.department || "-"}</div>
                </div>
                <div class="right">
                  <div><strong>Pay type:</strong> ${e.payType}</div>
                  <div class="muted">Worked: ${mmToHhmm(e.workedMinutes || 0)} · OT: ${mmToHhmm(e.overtimeMinutes || 0)}</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Component</th>
                    <th class="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Base pay</td><td class="right">${(e.basePay||0).toFixed(2)}</td></tr>
                  <tr><td>Overtime</td><td class="right">${(e.overtimePay||0).toFixed(2)}</td></tr>
                  ${(e.allowances||[]).map(a=>`<tr><td>Allowance — ${a.name}</td><td class="right">${(a.amount||0).toFixed(2)}</td></tr>`).join("")}
                  ${(e.deductions||[]).map(d=>`<tr><td>Deduction — ${d.name}</td><td class="right">-${(d.amount||0).toFixed(2)}</td></tr>`).join("")}
                  <tr class="totals"><td>Gross</td><td class="right">${(e.gross||0).toFixed(2)}</td></tr>
                  <tr class="totals"><td>Net</td><td class="right">${(e.net||0).toFixed(2)}</td></tr>
                </tbody>
              </table>
            </div>
          </body>
        </html>
      `;

      const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=800");
      if (!w) {
        return MySwal.fire({ icon: "error", title: "Popup blocked", text: "Allow popups to print/save the payslip." });
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {
      errorBox(e, "Payslip failed");
    }
  };

  const toast = (title) =>
    MySwal.fire({ toast: true, position: "top-end", icon: "success", title, showConfirmButton: false, timer: 1600 });

  const errorBox = (e, title="Error") =>
    MySwal.fire({ icon: "error", title, text: e?.response?.data?.message || e.message || "Something failed" });

  return (
    <div className="hrlist-wrap">
      <div className="hrlist-card">
        <div className="hrlist-head">
          <h2>Payrun</h2>
          <div style={{ display:"flex", gap:8 }}>
            {canCompute && <button className="hrlist-btn" onClick={compute}>Compute</button>}
            {canApprove && <button className="hrlist-btn" onClick={approve}>Approve</button>}
            {canPay && <button className="hrlist-btn" onClick={markPaid}>Mark Paid</button>}
          </div>
        </div>

        {err && <div className="hrlist-error">{err}</div>}

        {!run ? (
          <div className="hrlist-empty" style={{ padding: 24 }}>{loading ? "Loading…" : "Payrun not found"}</div>
        ) : (
          <>
            <div style={{ padding: "8px 12px", color:"#065f46" }}>
              <strong>Period:</strong> {new Date(run.periodStart).toLocaleDateString()} – {new Date(run.periodEnd).toLocaleDateString()} &nbsp;•&nbsp;
              <strong>Status:</strong> <span className={`badge ${run.status}`}>{run.status}</span> &nbsp;•&nbsp;
              <strong>Entries:</strong> {run.entries?.length ?? 0}
            </div>

            <div className="hrlist-tablewrap">
              <table className="hrlist-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Dept</th>
                    <th>Worked</th>
                    <th>OT</th>
                    <th>Gross</th>
                    <th>Net</th>
                    <th style={{ width: 140 }}>Payslip</th>
                  </tr>
                </thead>
                <tbody>
                  {(run.entries || []).length === 0 ? (
                    <tr><td colSpan={7} className="hrlist-empty">{run.status === "draft" ? "Not computed yet" : "No entries"}</td></tr>
                  ) : (
                    run.entries.map(e => (
                      <tr key={e.employee}>
                        <td className="hrlist-name">{e.employeeName}</td>
                        <td>{e.department || "-"}</td>
                        <td>{mmToHhmm(e.workedMinutes)}</td>
                        <td>{mmToHhmm(e.overtimeMinutes)}</td>
                        <td>{(e.gross || 0).toFixed(2)}</td>
                        <td>{(e.net || 0).toFixed(2)}</td>
                        <td>
                          <button className="hrlist-btn edit small" onClick={()=>printPayslip(e)}>Print / PDF</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {(run.entries || []).length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign:"right", fontWeight:700 }}>Totals</td>
                      <td style={{ fontWeight:700 }}>{totalGross.toFixed(2)}</td>
                      <td style={{ fontWeight:700 }}>{totalNet.toFixed(2)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
