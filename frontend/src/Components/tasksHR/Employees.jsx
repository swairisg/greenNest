// frontend/src/Components/tasksHR/Employees.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useHRChrome } from "./HRLayout";

export default function HREmployees() {
  const { setRight, clearRight } = useHRChrome();

  useEffect(() => {
    setRight(
      <Link to="/hr/employees/new"
            style={{ padding: "8px 12px", borderRadius: 12, background: "#065f46",
                     color: "#fff", textDecoration: "none" }}>
        + Add Employee
      </Link>
    );
    return clearRight;
  }, [setRight, clearRight]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0, color: "#065f46" }}>Employees</h1>
      <p style={{ color: "#6b7280" }}>Table + filters will go here.</p>
    </div>
  );
}
