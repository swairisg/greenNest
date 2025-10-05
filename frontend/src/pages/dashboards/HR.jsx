// frontend/src/pages/dashboards/HR.jsx
import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import EmployeesNew from "../../Components/tasksHR/EmployeesNew";

// simple utility for active link styling
const navCls = ({ isActive }) =>
  "block px-3 py-2 rounded-lg transition " +
  (isActive
    ? "bg-emerald-600 text-white shadow"
    : "text-emerald-900 hover:bg-emerald-100");

export default function HRLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const canHR =
    !!user &&
    (user.primaryRole === "hr_manager" ||
      user.roles?.includes("hr_manager") ||
      user.roles?.includes("admin"));

  if (!canHR) {
    // This component is guarded by routes too; this is an extra safety UX.
    return (
      <div style={{ padding: 24 }}>
        <h2>Access denied</h2>
        <p>You don’t have permission to view the HR Dashboard.</p>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: 12,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #065f46",
            color: "#065f46",
            background: "white",
            cursor: "pointer",
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="hr-root" style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "64px 1fr" }}>
      {/* Top Navbar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffffaa",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "#065f46",
              fontWeight: 800,
              letterSpacing: 0.3,
              fontSize: 18,
            }}
            title="Go to Home"
          >
            GreenNest
          </Link>
          <span style={{ color: "#6b7280" }}>•</span>
          <span style={{ color: "#065f46", fontWeight: 600 }}>HR & Task Manager</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Profile button */}
          <div
            title={user?.email}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#059669",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
              }}
            >
              {String(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>
              {user?.name || user?.email}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              logout?.();
              navigate("/auth/login");
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 12,
              border: "1px solid #dc2626",
              color: "#dc2626",
              background: "white",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Body: Sidebar + Main */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr" }}>
        {/* Sidebar */}
        <aside
          style={{
            borderRight: "1px solid #e5e7eb",
            padding: 16,
            background: "#f9fafb",
          }}
        >
          <nav style={{ display: "grid", gap: 8 }}>
            <NavLink to="/hr" end className={navCls}>
              Overview
            </NavLink>
            <NavLink to="/hr/employees" className={navCls}>
              Employees
            </NavLink>
            <NavLink to="/hr/tasks" className={navCls}>
              Tasks
            </NavLink>
            <NavLink to="/hr/attendance" className={navCls}>
              Attendance & Shifts
            </NavLink>
            <NavLink to="/hr/payroll" className={navCls}>
              Payroll
            </NavLink>
            <NavLink to="/hr/performance" className={navCls}>
              Performance
            </NavLink>
            <NavLink to="/hr/reports" className={navCls}>
              Reports & Exports
            </NavLink>
            <NavLink to="/hr/settings" className={navCls}>
              Settings
            </NavLink>
          </nav>

          {/* Quick CTA (example) */}
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 14,
              background: "#ecfdf5",
              border: "1px dashed #10b981",
              color: "#065f46",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Quick create</div>
            <div style={{ display: "grid", gap: 8 }}>
              <Link className="block" to="/hr/employees/new" style={{ color: "#065f46" }}>
                + New Employee
              </Link>
              <Link className="block" to="/hr/tasks/new" style={{ color: "#065f46" }}>
                + New Task
              </Link>
              <Link className="block" to="/hr/payroll/new" style={{ color: "#065f46" }}>
                + New Payrun
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ padding: 16 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
