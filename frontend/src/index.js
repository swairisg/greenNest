import React from "react";
import ReactDOM from "react-dom/client";
//import "./styles/theme.css";
//import "./styles/app.css"; // if this file doesn't exist, remove this line
import App from "./App";
import reportWebVitals from "./reportWebVitals";
//qualitycontrol
//import { createRoot } from 'react-dom/client';
import "./index.css";
import "sweetalert2/dist/sweetalert2.min.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
