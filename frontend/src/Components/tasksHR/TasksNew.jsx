// frontend/src/Components/tasksHR/TasksNew.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useHRChrome } from "./HRLayout";

export default function HRTasksNew() {
  const { setRight, clearRight } = useHRChrome();

  useEffect(() => {
    setRight(
      <div style={{ display: "flex", gap: 8 }}>
        <Link to="/hr/tasks"
              style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #065f46",
                       color: "#065f46", textDecoration: "none", background: "#fff" }}>
          ← Back to List
        </Link>
        <button
          type="button"
          onClick={() => {/* later: submit task form */}}
          style={{ padding: "8px 12px", borderRadius: 12, background: "#065f46",
                   color: "#fff", border: "none", cursor: "pointer" }}
        >
          Create Task
        </button>
      </div>
    );
    return clearRight;
  }, [setRight, clearRight]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0, color: "#065f46" }}>Create Task</h1>
      <p style={{ color: "#6b7280" }}>Task form will be placed here.</p>
    </div>
  );
}
