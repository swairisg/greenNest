// frontend/src/Components/tasksHR/HRLayout.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "./HRLayout.css";

const ChromeCtx = createContext({ setRight: () => {}, clearRight: () => {} });
export const useHRChrome = () => useContext(ChromeCtx);

export default function HRLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rightSlot, setRightSlot] = useState(null);

  const canHR =
    !!user &&
    (user.primaryRole === "hr_manager" ||
      user.roles?.includes("hr_manager") ||
      user.roles?.includes("admin"));

  const api = useMemo(
    () => ({
      setRight: (node) => setRightSlot(() => node),
      clearRight: () => setRightSlot(null),
    }),
    []
  );

  if (!canHR) {
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
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <ChromeCtx.Provider value={api}>
      <div className="hr-shell">
        {/* Sidebar */}
        <aside className="hr-side">
          <div className="hr-brand">GreenNest • HR & Task Manager</div>

          <nav className="hr-nav">
            {/* Employees is the default (/hr) */}
            

            {/* Overview now lives at /hr/overview */}
            <NavLink
              to="/hr/overview"
              className={({ isActive }) => `hr-navlink ${isActive ? "active" : ""}`}
            >
              Overview
            </NavLink>

            <NavLink
              to="/hr"
              end
              className={({ isActive }) => `hr-navlink ${isActive ? "active" : ""}`}
            >
              Employees
            </NavLink>

            <NavLink
              to="/hr/tasks"
              className={({ isActive }) => `hr-navlink ${isActive ? "active" : ""}`}
            >
              Tasks
            </NavLink>

            <NavLink
              to="/hr/attendance"
              className={({ isActive }) => `hr-navlink ${isActive ? "active" : ""}`}
            >
              Attendance & Shifts
            </NavLink>

            <NavLink
              to="/hr/payroll"
              className={({ isActive }) => `hr-navlink ${isActive ? "active" : ""}`}
            >
              Payroll
            </NavLink>

            <NavLink
              to="/hr/performance"
              className={({ isActive }) => `hr-navlink ${isActive ? "active" : ""}`}
            >
              Performance
            </NavLink>

            <NavLink
              to="/hr/reports"
              className={({ isActive }) => `hr-navlink ${isActive ? "active" : ""}`}
            >
              Reports & Exports
            </NavLink>

            <NavLink
              to="/hr/settings"
              className={({ isActive }) => `hr-navlink ${isActive ? "active" : ""}`}
            >
              Settings
            </NavLink>
          </nav>

          <div className="hr-quick">
            <h4>Quick create</h4>
            <Link to="/hr/employees/new">+ New Employee</Link>
            <Link to="/hr/tasks/new">+ New Task</Link>
            {/* If you don't have /hr/payroll/new yet, you can link to /hr/payroll */}
            <Link to="/hr/payroll">+ New Payrun</Link>
          </div>
        </aside>

        {/* Main area */}
        <main className="hr-main">
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div /> {/* spacer */}
            {rightSlot ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {rightSlot}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                    {String(user?.name || user?.email || "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <span
                    style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}
                  >
                    {user?.name || user?.email}
                  </span>
                </div>
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
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          <Outlet />
        </main>
      </div>
    </ChromeCtx.Provider>
  );
}
