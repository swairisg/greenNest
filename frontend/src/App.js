// frontend/src/App.js
import "./App.css";
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

export default App;
