import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthProvider from "./auth/AuthProvider";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

import RequireAuth from "./routes/guards/RequireAuth";
import RequireRole from "./routes/guards/RequireRole";

import Home from "./pages/public/Home";

import Admin from "./pages/dashboards/Admin";
import HR from "./pages/dashboards/HR";
import Finance from "./pages/dashboards/Finance";
import Inventory from "./pages/dashboards/Inventory";
import Product from "./pages/dashboards/Product";
import Farmer from "./pages/dashboards/Farmer";


import AddSchedule from "./Components/harvestManagement/AddHarvestSchedule/AddSchedule";

import CustomerProfile from "./pages/profile/CustomerProfile";
import EditProfile from "./pages/profile/EditCustomerProfile/EditProfile";
import BookVisit from "./Components/customers/BookVisit/BookVisit";
import BookVisitSuccess from "./Components/customers/BookVisit/BookVisitSuccess";
import CustomerDashboard from "./Components/customers/CustomerDashboard/CustomerDashboard"

import PestDetectDisplay from './Components/pestControl/PestDetectDisplay/PestDetectDisplay';
import PestDetectAdd from './Components/pestControl/PestDetectAdd/PestDetectAdd';
import PestDetectDashboard from './Components/pestControl/PestDetectDashboard/PestDetectDashboard';
import CatalogPage from "./Components/productCatalogue/ProductCatalogCustomer";
import AdminProducts from "./Components/productCatalogue/ProductCatalogAdmin";
import ProductCatalogForm from "./Components/productCatalogue/ProductCatalogForm";
import ProductCatalogDashboard from './Components/productCatalogue/ProductCatalogDashboard';

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
            <Route path="/profile/edit" element={<EditProfile />} />

          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<RequireRole roles={["admin"]} />}>
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route element={<RequireRole roles={["hr_manager"]} />}>
              <Route path="/hr" element={<HR />} />
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
            </Route>
          </Route>

      <Route path="/admin" element={<Admin />} />
   
      <Route path="/PestDetectDashboard" element={<PestDetectDashboard />} />
      <Route path="/PestDetectDisplay" element={<PestDetectDisplay />} />
      <Route path="/pests/farmer" element={<PestDetectAdd role="farmer" />} />
      <Route path="/pests/:id/update" element={<PestDetectAdd role="specialist" />} />

      {/* 🛒 Product Catalog (Customer) */}
      <Route path="/catalog" element={<CatalogPage />} />

      {/* 🔐 Product Catalog (Admin) */}
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/products/new" element={<ProductCatalogForm />} />
      <Route path="/admin/products/:id/edit" element={<ProductCatalogForm />} />
       <Route path="/admin/products/dashboard" element={<ProductCatalogDashboard />} />
      
      <Route path="*" element={<div style={{ padding: 16 }}>404: Not found</div>} />

          {/*harvest schedule*/}
          <Route path="/addharvestschedules" element={<AddSchedule />} />
          <Route path="*" element={<Navigate to="/auth/login" replace />} />

          {/*customer and buyer management*/} 
          <Route path="/visit/book" element={<BookVisit />} />
          <Route path="/visit/success" element={<BookVisitSuccess />} />
          <Route path="/visits/bookings" element={<CustomerDashboard />} />

          {/*customer profile*/}
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/profile/edit" element={<EditProfile />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
// frontend/src/App.js
/*import "./App.css";
import { useEffect, useState } from "react";
import { api, API_BASE } from "./api";



import AddSchedule from "./Components/harvestManagement/AddHarvestSchedule/AddSchedule";



function App() {
  return (
    <Routes>
  
      
      <Route path="/addharvestschedules" element={<AddSchedule />} />
      

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;*/
