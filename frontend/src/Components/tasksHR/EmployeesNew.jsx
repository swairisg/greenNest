import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useHRChrome } from "./HRLayout";
import api from "../../api";
import "./EmployeesNew.css";

// SweetAlert2
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const isPhone = (v = "") => /^[+()\-.\s\d]{7,20}$/.test(v);
const isEmail = (v = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isStrong = (pwd = "") =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(pwd));

// Dropdown data
const DEPARTMENTS = [
  "Administration",
  "People Ops",
  "Operations",
  "Finance",
  "Product",
  "Greenhouse",
];

const DESIGNATIONS_BY_DEPT = {
  Administration: ["Admin", "Office Assistant", "Coordinator"],
  "People Ops": ["HR Manager", "HR Executive", "Recruiter"],
  Operations: ["Inventory Manager", "Logistics Coordinator", "Shift Supervisor"],
  Finance: ["Finance Manager", "Accountant", "Analyst"],
  Product: ["Product Manager", "QA Engineer", "UX Designer"],
  Greenhouse: ["Farmer", "Agronomist", "Specialist", "Technician"],
};

const ROLE_OPTIONS = [
  "admin",
  "hr_manager",
  "inventory_manager",
  "finance_manager",
  "product_manager",
  "farmer",
  "specialist",
];

export default function EmployeesNew() {
  const nav = useNavigate();
  const { token } = useAuth(); // ok if unused; your AuthProvider may set api default header
  const chrome = useHRChrome();
  const formRef = useRef(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Mode: create a brand-new staff user (default) OR link to existing userId
  const [linkExisting, setLinkExisting] = useState(false);

  const [form, setForm] = useState({
    // when linkExisting === true
    userId: "",

    // when linkExisting === false (create new user)
    email: "",
    password: "",
    primaryRole: "farmer",

    // Profile
    fullName: "",
    phone: "",
    address: "",
    department: "",
    designation: "",
    joinDate: todayStr,
    currentStatus: "active",

    // Compensation
    salary: "",
    bank_accountNo: "",
    bank_bankName: "",
    bank_branch: "",
  });

  const designationOptions = useMemo(() => {
    return form.department ? DESIGNATIONS_BY_DEPT[form.department] || [] : [];
  }, [form.department]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => {
      if (name === "department") {
        const nextDesignationList = DESIGNATIONS_BY_DEPT[value] || [];
        const nextDesignation = nextDesignationList.includes(p.designation)
          ? p.designation
          : "";
        return { ...p, department: value, designation: nextDesignation };
      }
      return { ...p, [name]: value };
    });
  };

  const validate = () => {
    const errs = [];

    // two creation modes:
    if (linkExisting) {
      if (!form.userId.trim()) errs.push("User (userId) is required");
    } else {
      if (!form.email.trim()) errs.push("Email is required");
      if (!isEmail(form.email)) errs.push("Email is invalid");
      if (!form.password) errs.push("Temporary password is required");
      else if (!isStrong(form.password))
        errs.push("Weak password (use 8+ chars with upper, lower, number)");
      if (!form.primaryRole) errs.push("Primary role is required");
    }

    // common profile validations
    if (!form.fullName.trim()) errs.push("Full name is required");
    if (!form.department.trim()) errs.push("Department is required");
    if (!form.designation.trim()) errs.push("Designation is required");
    if (!form.joinDate) errs.push("Join date is required");
    if (form.phone && !isPhone(form.phone)) errs.push("Phone is invalid");
    if (form.salary && Number(form.salary) < 0)
      errs.push("Salary cannot be negative");

    return errs;
  };

  const buildPayload = () => {
    // create-new-user mode
    if (!linkExisting) {
      return {
        email: form.email.trim(),
        password: form.password,
        primaryRole: form.primaryRole, // server will set roles = [primaryRole]
        // profile
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        department: form.department.trim(),
        designation: form.designation.trim(),
        joinDate: form.joinDate,
        currentStatus: form.currentStatus,
        salary: form.salary ? Number(form.salary) : 0,
        bank: {
          accountNo: form.bank_accountNo || undefined,
          bankName: form.bank_bankName || undefined,
          branch: form.bank_branch || undefined,
        },
      };
    }

    // link-existing-user mode
    return {
      userId: form.userId.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim() || undefined, // optional hint for profile
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      department: form.department.trim(),
      designation: form.designation.trim(),
      joinDate: form.joinDate,
      currentStatus: form.currentStatus,
      salary: form.salary ? Number(form.salary) : 0,
      bank: {
        accountNo: form.bank_accountNo || undefined,
        bankName: form.bank_bankName || undefined,
        branch: form.bank_branch || undefined,
      },
    };
  };

  // === Sweet helper: clear the form when user chooses "Add another" ===
  const resetForm = () => {
    setForm((p) => ({
      ...p,
      userId: "",
      email: "",
      password: "",
      fullName: "",
      phone: "",
      address: "",
      department: "",
      designation: "",
      joinDate: todayStr,
      currentStatus: "active",
      salary: "",
      bank_accountNo: "",
      bank_bankName: "",
      bank_branch: "",
    }));
    setErr("");
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setErr("");
    const errs = validate();
    if (errs.length) {
      setErr(errs.join(", "));
      return;
    }
    try {
      setSaving(true);
      const resp = await api.post("/hr/employees", buildPayload());
      const newId = resp?.data?.data?._id;

      // Fancy success modal with actions
      MySwal.fire({
        icon: "success",
        title: "Employee created",
        text: "The new staff account and profile were created successfully.",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Go to list",
        denyButtonText: "Add another",
        cancelButtonText: "View profile",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          nav("/hr/employees");
        } else if (result.isDenied) {
          resetForm();
        } else if (result.isDismissed && newId) {
          nav(`/hr/employees/${newId}`);
        }
      });
    } catch (e2) {
      console.error(e2);
      const msg = e2?.response?.data?.message || e2.message || "Create failed";
      setErr(msg);
      MySwal.fire({
        icon: "error",
        title: "Failed to create employee",
        text: msg,
        confirmButtonText: "OK",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    chrome.setRight(
      <>
        <button className="hrbtn ghost" onClick={() => nav(-1)}>
          Back
        </button>
        <button
          className="hrbtn"
          disabled={saving}
          onClick={() => formRef.current?.requestSubmit()}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </>
    );
    return () => chrome.clearRight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, chrome]);

  return (
    <div className="hrnew-wrap">
      <form ref={formRef} className="hrnew-card" onSubmit={handleSubmit} noValidate>
        <div className="hrnew-head">
          <h2>Add Employee</h2>
          <div className="hrnew-actions">
            <button type="button" className="hrbtn ghost" onClick={() => nav(-1)}>Back</button>
            <button type="submit" className="hrbtn" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {err && <div className="hrnew-error">{err}</div>}

        {/* Mode Switch */}
        <div className="hrnew-mode">
          <label className="switch">
            <input
              type="checkbox"
              checked={linkExisting}
              onChange={(e) => setLinkExisting(e.target.checked)}
            />
            <span />
          </label>
          <span className="hrnew-mode-text">
            {linkExisting ? "Link to existing user (by userId)" : "Create new staff account (email + temp password)"}
          </span>
        </div>

        {/* Create new staff account */}
        {!linkExisting && (
          <section className="hrnew-section">
            <h3>New Staff Account</h3>
            <div className="hrgrid">
              <label>
                Work Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="name@greennest.local"
                />
              </label>
              <label>
                Temporary Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="Temp password"
                />
              </label>
              <label>
                Primary Role
                <select
                  name="primaryRole"
                  value={form.primaryRole}
                  onChange={onChange}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        )}

        {/* Link existing user */}
        {linkExisting && (
          <section className="hrnew-section">
            <h3>Link to User</h3>
            <div className="hrgrid">
              <label className="span2">
                User ID (paste an existing users._id)
                <input
                  name="userId"
                  value={form.userId}
                  onChange={onChange}
                  placeholder="68dce5e2ae..."
                />
              </label>
            </div>
          </section>
        )}

        <section className="hrnew-section">
          <h3>Profile</h3>
          <div className="hrgrid">
            <label>
              Full Name
              <input name="fullName" value={form.fullName} onChange={onChange} />
            </label>
            <label>
              Phone
              <input name="phone" value={form.phone} onChange={onChange} />
            </label>
            <label className="span2">
              Address
              <input name="address" value={form.address} onChange={onChange} />
            </label>
          </div>
        </section>

        <section className="hrnew-section">
          <h3>Job</h3>
          <div className="hrgrid">
            <label>
              Department
              <select name="department" value={form.department} onChange={onChange}>
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            <label>
              Designation
              <select
                name="designation"
                value={form.designation}
                onChange={onChange}
                disabled={!form.department}
              >
                <option value="">{form.department ? "Select designation…" : "Select a department first"}</option>
                {designationOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label>
              Join Date
              <input type="date" name="joinDate" value={form.joinDate} onChange={onChange} />
            </label>

            <label>
              Status
              <select name="currentStatus" value={form.currentStatus} onChange={onChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </label>
          </div>
        </section>

        <section className="hrnew-section">
          <h3>Compensation</h3>
          <div className="hrgrid">
            <label>
              Base Salary (LKR)
              <input type="number" min="0" step="1" name="salary" value={form.salary} onChange={onChange} />
            </label>
            <label>
              Bank Account No.
              <input name="bank_accountNo" value={form.bank_accountNo} onChange={onChange} />
            </label>
            <label>
              Bank
              <input name="bank_bankName" value={form.bank_bankName} onChange={onChange} />
            </label>
            <label>
              Branch
              <input name="bank_branch" value={form.bank_branch} onChange={onChange} />
            </label>
          </div>
        </section>
      </form>
    </div>
  );
}
