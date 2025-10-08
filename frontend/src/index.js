import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/theme.css";
import "./styles/app.css";   // if this file doesn't exist, remove this line
import App from "./App";
import './index.css'; 
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
