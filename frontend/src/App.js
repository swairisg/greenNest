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
import ViewSchedule from "./Components/harvestManagement/ViewHarvestSchedule/ViewSchedule";
import UpdateSchedule from "./Components/harvestManagement/UpdateHarvestSchedule/UpdateSchedule";

import AddYieldRecord from "./Components/harvestManagement/AddYieldRecord/AddYieldRecord";
import ViewYield from "./Components/harvestManagement/ViewYieldRecord/ViewYield";
import EditYieldRecord from "./Components/harvestManagement/EditYieldRecord/EditYieldRecord";





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

          <Route path="/addharvestschedules" element={<AddSchedule />} />
          <Route path="/viewharvestschedules" element={<ViewSchedule/>}/>
          <Route path="/viewharvestschedules/:id" element={<UpdateSchedule />} />

          <Route path="/AddYieldRecord/:id" element={<AddYieldRecord />} />
          <Route path="/ViewYieldRecords" element={<ViewYield />} />
          <Route path="/yieldrecords/edit/:id" element={<EditYieldRecord />} />







          <Route path="*" element={<Navigate to="/auth/login" replace />} />
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
