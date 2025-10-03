// frontend/src/App.js
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<Login />} />

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

function App() {
  const [msg, setMsg] = useState("loading...");

  useEffect(() => {
    api
      .get("/") // backend root returns "Hello from backend"
      .then((r) => setMsg(r.data))
      .catch(() => setMsg(`Cannot reach API at ${API_BASE}`));
  }, []);

  return (
    <div className="App">
      <h1>GreenNest Frontend</h1>
      <p>API status: {msg}</p>
    </div>
  );
}

export default App;*/
