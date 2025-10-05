import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthProvider from "./auth/AuthProvider";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

import RequireAuth from "./routes/guards/RequireAuth";
import RequireRole from "./routes/guards/RequireRole";

import Home from "./pages/public/Home";

import Admin from "./pages/dashboards/Admin";
//import HR from "./pages/dashboards/HR";
import Finance from "./pages/dashboards/Finance";
import Inventory from "./pages/dashboards/Inventory";
import Product from "./pages/dashboards/Product";
import Farmer from "./pages/dashboards/Farmer";

import AddSchedule from "./Components/harvestManagement/AddHarvestSchedule/AddSchedule";
import ViewSchedule from "./Components/harvestManagement/ViewHarvestSchedule/ViewSchedule";
import UpdateSchedule from "./Components/harvestManagement/UpdateHarvestSchedule/UpdateSchedule";

import AddYieldRecord from "./Components/harvestManagement/AddYieldRecord/AddYieldRecord";
import ViewYield from "./Components/harvestManagement/ViewYieldRecord/ViewYield";
import EditYieldRecord from "./Components/harvestManagement/EditYieldRecord/EditYieldRecord";
import HarvestLayout from "./Components/harvestManagement/HarvestLayout";

import HarvestDashboard from "./Components/harvestManagement/harvestdashboard/HarvestDashboard";





import CustomerProfile from "./pages/profile/CustomerProfile";
import EditProfile from "./pages/profile/EditCustomerProfile/EditProfile";
import BookVisit from "./Components/customers/BookVisit/BookVisit";
import BookVisitSuccess from "./Components/customers/BookVisit/BookVisitSuccess";
import CustomerDashboard from "./Components/customers/CustomerDashboard/CustomerDashboard";
import ContactUs from "./Components/customers/ContactUs/ContactUs";
import Viewcontactus from "./Components/customers/ContactUs/ViewContactUs/Viewcontactus";

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

import ProductCatalogDashboard from './Components/productCatalogue/ProductCatalogDashboard';
import Landing from "./pages/public/Landing/Landing";



import SectionHome from "./Components/plantCultivation/SectionHome";
import SeedsPage from "./Components/plantCultivation/SeedsPage";
import LandPrepPage from "./Components/plantCultivation/LandPrepPage";
import PlansPage from "./Components/plantCultivation/PlansPage";
import GrowthPage from "./Components/plantCultivation/GrowthPage";


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/welcome" element={<Landing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />

          <Route element={<RequireRole roles={["customer"]} />}>
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<CustomerProfile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
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
                element={<LandPrepPage />}
              />
              <Route path="/farmer/cultivation/seeds" element={<SeedsPage />} />
              <Route path="/farmer/cultivation/plans" element={<PlansPage />} />
              <Route
                path="/farmer/cultivation/growth"
                element={<GrowthPage />}
              />
            </Route>
          </Route>

       <Route path="/addharvestschedules" element={<AddSchedule />} />
       <Route path="/viewharvestschedules/:id" element={<UpdateSchedule />} />
       <Route path="/AddYieldRecord/:id" element={<AddYieldRecord />} />
       <Route path="/yieldrecords/edit/:id" element={<EditYieldRecord />} />


      <Route element={<HarvestLayout />}>
        <Route path="/harvestdashboard" element={<HarvestDashboard />} />
        <Route path="/viewharvestschedules" element={<ViewSchedule />} />
        <Route path="/ViewYieldRecords" element={<ViewYield />} />
      </Route>

      <Route path="/admin" element={<Admin />} />
   
      <Route path="/PestDetectDashboard" element={<PestDetectDashboard />} />
      <Route path="/PestDetectDisplay" element={<PestDetectDisplay />} />
      <Route path="/pests/farmer" element={<PestDetectAdd role="farmer" />} />
      <Route path="/pests/:id/update" element={<PestDetectAdd role="specialist" />} />

      {/* Product Catalog (Customer) */}
      <Route path="/catalog" element={<CatalogPage />} />

      {/*Product Catalog (Admin) */}
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/products/new" element={<ProductCatalogForm />} />
      <Route path="/admin/products/:id/edit" element={<ProductCatalogForm />} />
       <Route path="/admin/products/dashboard" element={<ProductCatalogDashboard />} />
      
      <Route path="*" element={<div style={{ padding: 16 }}>404: Not found</div>} />

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


          <Route path="*" element={<Navigate to="/auth/login" replace />} />

          {/*customer and buyer management*/}
          <Route path="/visit/book" element={<BookVisit />} />
          <Route path="/visit/success" element={<BookVisitSuccess />} />
          <Route path="/visits/bookings" element={<CustomerDashboard />} />

          {/*customer profile*/}
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/viewcontactus" element={<Viewcontactus />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
