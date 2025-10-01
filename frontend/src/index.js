import React from "react";
import ReactDOM from "react-dom/client"; // <-- change here
//import './index.css';
import "./styles/theme.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </BrowserRouter>
);

// ...existing code...
reportWebVitals();
