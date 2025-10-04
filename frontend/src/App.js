import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthProvider from "./auth/AuthProvider";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

import RequireAuth from "./routes/guards/RequireAuth";
import RequireRole from "./routes/guards/RequireRole";

import Home from "./pages/public/Home";
import CustomerProfile from "./pages/profile/CustomerProfile";

import Admin from "./pages/dashboards/Admin";
//import HR from "./pages/dashboards/HR";
import Finance from "./pages/dashboards/Finance";
import Inventory from "./pages/dashboards/Inventory";
import Product from "./pages/dashboards/Product";
import Farmer from "./pages/dashboards/Farmer";
import AddSchedule from "./Components/harvestManagement/AddHarvestSchedule/AddSchedule";

import HRLayout from "./Components/tasksHR/HRLayout";
import HROverview from "./Components/tasksHR/Overview";
import HREmployees from "./Components/tasksHR/Employees";
import HREmployeesNew from "./Components/tasksHR/EmployeesNew";
import HRTasks from "./Components/tasksHR/Tasks";
import HRTasksNew from "./Components/tasksHR/TasksNew";
import HRAttendance from "./Components/tasksHR/Attendance";
import HRPayroll from "./Components/tasksHR/Payroll";
import HRPerformance from "./Components/tasksHR/Performance";
import HRReports from "./Components/tasksHR/Reports";
import HRSettings from "./Components/tasksHR/Settings";

import PestDetectDisplay from "./Components/pestControl/PestDetectDisplay/PestDetectDisplay";
import PestDetectAdd from "./Components/pestControl/PestDetectAdd/PestDetectAdd";
import PestDetectDashboard from "./Components/pestControl/PestDetectDashboard/PestDetectDashboard";
import CatalogPage from "./Components/productCatalogue/ProductCatalogCustomer";
import AdminProducts from "./Components/productCatalogue/ProductCatalogAdmin";
import ProductCatalogForm from "./Components/productCatalogue/ProductCatalogForm";
import ProductCatalogDashboard from "./Components/productCatalogue/ProductCatalogDashboard";

import SectionHome from "./Components/plantCultivation/SectionHome";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />

          <Route element={<RequireRole roles={["customer"]} />}>
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<CustomerProfile />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<RequireRole roles={["admin"]} />}>
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route element={<RequireRole roles={["hr_manager", "admin"]} />}>
              <Route path="/hr" element={<HRLayout />}>
                <Route index element={<HROverview />} />
                <Route path="employees" element={<HREmployees />} />
                <Route path="employees/new" element={<HREmployeesNew />} />
                <Route path="tasks" element={<HRTasks />} />
                <Route path="tasks/new" element={<HRTasksNew />} />
                <Route path="attendance" element={<HRAttendance />} />
                <Route path="payroll" element={<HRPayroll />} />
                <Route path="performance" element={<HRPerformance />} />
                <Route path="reports" element={<HRReports />} />
                <Route path="settings" element={<HRSettings />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={["finance_manager"]} />}>
              <Route path="/finance" element={<Finance />} />
            </Route>

            <Route element={<RequireRole roles={["inventory_manager"]} />}>
              <Route path="/inventory" element={<Inventory />} />
            </Route>

            <Route element={<RequireRole roles={["product_manager"]} />}>
              <Route path="/products" element={<Product />} />
            </Route>

            <Route element={<RequireRole roles={["farmer", "specialist"]} />}>
              <Route path="/farmer" element={<Farmer />} />

              <Route path="/farmer/cultivation" element={<SectionHome />} />
              <Route
                path="/farmer/cultivation/land"
                element={
                  <div style={{ padding: 20 }}>Land Prep — coming next</div>
                }
              />
              <Route
                path="/farmer/cultivation/seeds"
                element={
                  <div style={{ padding: 20 }}>
                    Seed Inventory — coming next
                  </div>
                }
              />
              <Route
                path="/farmer/cultivation/plans"
                element={
                  <div style={{ padding: 20 }}>
                    Planting Plans — coming next
                  </div>
                }
              />
              <Route
                path="/farmer/cultivation/growth"
                element={
                  <div style={{ padding: 20 }}>
                    Growth Monitoring — coming next
                  </div>
                }
              />
            </Route>
          </Route>

          <Route path="/admin" element={<Admin />} />

          <Route
            path="/PestDetectDashboard"
            element={<PestDetectDashboard />}
          />
          <Route path="/PestDetectDisplay" element={<PestDetectDisplay />} />
          <Route
            path="/pests/farmer"
            element={<PestDetectAdd role="farmer" />}
          />
          <Route
            path="/pests/:id/update"
            element={<PestDetectAdd role="specialist" />}
          />

          {/* Product Catalog (Customer) */}
          <Route path="/catalog" element={<CatalogPage />} />

          {/*Product Catalog (Admin) */}
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<ProductCatalogForm />} />
          <Route
            path="/admin/products/:id/edit"
            element={<ProductCatalogForm />}
          />
          <Route
            path="/admin/products/dashboard"
            element={<ProductCatalogDashboard />}
          />

          <Route
            path="*"
            element={<div style={{ padding: 16 }}>404: Not found</div>}
          />

          <Route path="/addharvestschedules" element={<AddSchedule />} />
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
