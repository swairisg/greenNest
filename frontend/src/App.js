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
import HR from "./pages/dashboards/HR";
import Finance from "./pages/dashboards/Finance";
import Inventory from "./pages/dashboards/Inventory";
import Product from "./pages/dashboards/Product";
import Farmer from "./pages/dashboards/Farmer";
import AddSchedule from "./Components/harvestManagement/AddHarvestSchedule/AddSchedule";


// Quality Control (CRUD) pages
import QualityList from "./Components/qualityControl/QualityList";
import QualityCreate from "./Components/qualityControl/QualityCreate";
import QualityEdit from "./Components/qualityControl/QualityEdit";
import QualityDetail from "./Components/qualityControl/QualityDetail";

//Order

import OrderList from "./Components/finance/Orders/OrderList";
import OrderDetail from "./Components/finance/Orders/OrderDetail";
import OrderForm from "./Components/finance/Orders/OrderForm";

//cart
import Cart from "./Components/cart/cart";

//pest and product catalogue
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

      {/* Product Catalog (Customer) */}
      <Route path="/catalog" element={<CatalogPage />} />

      {/*Product Catalog (Admin) */}
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/products/new" element={<ProductCatalogForm />} />
      <Route path="/admin/products/:id/edit" element={<ProductCatalogForm />} />
       <Route path="/admin/products/dashboard" element={<ProductCatalogDashboard />} />
      
      <Route path="*" element={<div style={{ padding: 16 }}>404: Not found</div>} />

          <Route path="/addharvestschedules" element={<AddSchedule />} />
          <Route path="*" element={<Navigate to="/auth/login" replace />} />

          {/* Quality Control CRUD */}
          <Route path="/quality" element={<QualityList />} />
          <Route path="/quality/new" element={<QualityCreate />} />
          <Route path="/quality/:id" element={<QualityDetail />} />
          <Route path="/quality/:id/edit" element={<QualityEdit />} />

          {/* order crud */}
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/new" element={<OrderForm />} />
          <Route path="/orders/:id" element={<OrderDetail />} />

          {/*cart*/}
          <Route path="/cart" element={<Cart userId="U12345" />} />

        </Routes>

        {/* Simple header/nav 
      <header className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>GreenNest</h2>
        <nav style={{ display: "flex", gap: 12 }}>
          <NavLink to="/quality">Quality</NavLink>
          <NavLink to="/quality/new">Add</NavLink>
        </nav>
      </header>*/}

        {/*<main style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        
        <Routes>
          {/* redirect root to quality list 
          

         
        </Routes>
      </main>*/}
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
