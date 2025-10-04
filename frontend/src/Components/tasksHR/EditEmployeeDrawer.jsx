import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const DESIGNATIONS_BY_DEPT = {
  Administration: ["Admin", "Office Assistant", "Coordinator"],
  "People Ops": ["HR Manager", "HR Executive", "Recruiter"],
  Operations: ["Inventory Manager", "Logistics Coordinator", "Shift Supervisor"],
  Finance: ["Finance Manager", "Accountant", "Analyst"],
  Product: ["Product Manager", "QA Engineer", "UX Designer"],
  Greenhouse: ["Farmer", "Agronomist", "Specialist", "Technician"],
};

export default function EditEmployeeDrawer({ open, row, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    designation: "",
    currentStatus: "active",
    salary: 0,
    bank_accountNo: "",
    bank_bankName: "",
    bank_branch: "",
  });

  useEffect(() => {
    if (!row) return;
    setErr("");
    setForm({
      fullName: row.fullName || "",
      phone: row.phone || "",
      address: row.address || "",
      designation: row.designation || "",
      currentStatus: row.currentStatus || "active",
      salary: Number(row.salary || 0),
      bank_accountNo: row.bank?.accountNo || "",
      bank_bankName: row.bank?.bankName || "",
      bank_branch: row.bank?.branch || "",
    });
  }, [row]);

  const designationOptions = useMemo(() => {
    return row?.department ? DESIGNATIONS_BY_DEPT[row.department] || [] : [];
  }, [row?.department]);

  if (!open || !row) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    setErr("");
    try {
      setSaving(true);
      const patch = {
        // locked elsewhere: department, joinDate, email
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        designation: form.designation.trim(),
        currentStatus: form.currentStatus,
        salary: form.salary ? Number(form.salary) : 0,
        // 👇 Do NOT include bank in PATCH (HR cannot change bank)
        // bank: { ... }  <-- intentionally omitted
      };

      const res = await api.patch(`/hr/employees/${row._id}`, patch);
      const updated = res.data?.data || patch;

      await MySwal.fire({
        icon: "success",
        title: "Employee updated",
        text: "Changes have been saved.",
        confirmButtonText: "OK",
      });

      onSaved?.(updated);
      onClose?.();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e.message || "Update failed";
      setErr(msg);
      MySwal.fire({ icon: "error", title: "Update failed", text: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,.25)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "520px",
          maxWidth: "95vw",
          height: "100%",
          background: "#fff",
          borderLeft: "1px solid #e8efe8",
          boxShadow: "-8px 0 30px rgba(0,0,0,.12)",
          padding: "16px 16px 20px",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h3 style={{ margin: 0, color: "#065f46" }}>Edit Employee</h3>
          <button
            onClick={onClose}
            className="hrlist-btn ghost small"
            style={{ borderRadius: 999 }}
          >
            Close
          </button>
        </div>

        {err && (
          <div className="hrlist-error" style={{ marginBottom: 10 }}>
            {err}
          </div>
        )}

        {/* Locked basics */}
        <div className="hrgrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Email (login)
            <input disabled value={row.email || ""} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Department
            <input disabled value={row.department || ""} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Join Date
            <input disabled value={row.joinDate ? new Date(row.joinDate).toISOString().slice(0,10) : ""} />
          </label>
        </div>

        {/* Editable */}
        <div className="hrgrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Full Name
            <input name="fullName" value={form.fullName} onChange={onChange} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Phone
            <input name="phone" value={form.phone} onChange={onChange} />
          </label>
          <label className="span2" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, gridColumn: "span 2" }}>
            Address
            <input name="address" value={form.address} onChange={onChange} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Status
            <select name="currentStatus" value={form.currentStatus} onChange={onChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Designation
            <select
              name="designation"
              value={form.designation}
              onChange={onChange}
            >
              <option value="">Select…</option>
              {designationOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Base Salary (LKR)
            <input
              type="number"
              min="0"
              step="1"
              name="salary"
              value={form.salary}
              onChange={onChange}
            />
          </label>

          {/* ===== Bank details (READ-ONLY for HR) ===== */}
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Bank Account No. (locked)
            <input name="bank_accountNo" value={form.bank_accountNo} disabled />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Bank (locked)
            <input name="bank_bankName" value={form.bank_bankName} disabled />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            Branch (locked)
            <input name="bank_branch" value={form.bank_branch} disabled />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button className="hrlist-btn ghost" onClick={onClose}>Cancel</button>
          <button className="hrlist-btn edit" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
