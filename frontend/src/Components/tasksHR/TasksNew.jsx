// frontend/src/Components/tasksHR/TasksNew.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { useHRChrome } from "./HRLayout";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "./Tasks.css";
const MySwal = withReactContent(Swal);

const PRIORITIES = ["low", "normal", "high"];

const DEPARTMENTS = [
  "Administration",
  "People Ops",
  "Operations",
  "Finance",
  "Product",
  "Greenhouse",
];

export default function HRTasksNew() {
  const nav = useNavigate();
  const { setRight, clearRight } = useHRChrome();
  const formRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [department, setDepartment] = useState("");
  const [assignees, setAssignees] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "normal",
    dueDate: "",
    assignee: "",              // <-- keep as "assignee"
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const loadAssignees = async (dept) => {
    if (!dept) {
      setAssignees([]);
      setForm((p) => ({ ...p, assignee: "" }));   // clear selection
      return;
    }
    try {
      const res = await api.get("/hr/employees", {
        params: { status: "active", department: dept, page: 1, pageSize: 1000 },
      });
      setAssignees(res.data?.data || []);
      setForm((p) => ({ ...p, assignee: "" }));
    } catch (e) {
      console.error("assignees load error:", e);
    }
  };

  const validate = () => {
    const errs = [];
    if (!form.title.trim()) errs.push("Title is required");
    if (!department) errs.push("Department is required");
    return errs;
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
      await api.post("/hr/tasks", {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        department,                          // keep department
        assignee: form.assignee || undefined // <-- send "assignee"
      });

      const res = await MySwal.fire({
        icon: "success",
        title: "Task created",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Go to tasks",
        denyButtonText: "Create another",
        cancelButtonText: "Stay here",
        reverseButtons: true,
      });

      if (res.isConfirmed) nav("/hr/tasks");
      else if (res.isDenied) {
        setForm({
          title: "",
          description: "",
          priority: "normal",
          dueDate: "",
          assignee: "",
        });
        setDepartment("");
        setAssignees([]);
      }
    } catch (e2) {
      console.error(e2);
      MySwal.fire({
        icon: "error",
        title: "Create failed",
        text: e2?.response?.data?.message || e2.message,
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setRight(
      <div style={{ display: "flex", gap: 8 }}>
        <Link to="/hr/tasks" className="hrlist-btn ghost">
          ← Back to List
        </Link>
        <button
          className="hrlist-btn"
          disabled={saving}
          onClick={() => formRef.current?.requestSubmit()}
        >
          {saving ? "Saving…" : "Create Task"}
        </button>
      </div>
    );
    return clearRight;
  }, [setRight, clearRight, saving]);

  return (
    <div className="task-wrap">
      <form ref={formRef} className="task-card" onSubmit={handleSubmit} noValidate>
        <div className="task-head">
          <h2>Create Task</h2>
        </div>

        {err && <div className="task-error">{err}</div>}

        <section className="task-section">
          <div className="task-grid">
            <label className="span2">
              Title
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="Short actionable title…"
              />
            </label>

            <label>
              Priority
              <select name="priority" value={form.priority} onChange={onChange}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Due date
              <input type="date" name="dueDate" value={form.dueDate} onChange={onChange} />
            </label>

            <label>
              Department
              <select
                name="department"
                value={department}
                onChange={(e) => {
                  const v = e.target.value;
                  setDepartment(v);
                  loadAssignees(v);
                }}
              >
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Assignee (active in department)
              <select
                name="assignee"               // <-- keep as "assignee"
                value={form.assignee}
                onChange={onChange}
                disabled={!department || assignees.length === 0}
                title={!department ? "Select a department first" : undefined}
              >
                <option value="">— Unassigned —</option>
                {assignees.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.fullName} · {a.designation || a.department}
                  </option>
                ))}
              </select>
            </label>

            <label className="span2">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                className="task-textarea"
                placeholder="Details, steps, links…"
              />
            </label>
          </div>
        </section>
      </form>
    </div>
  );
}
