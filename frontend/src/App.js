import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";


import AddSchedule from "./Components/harvestManagement/AddHarvestSchedule/AddSchedule";



function App() {
  return (
    <Routes>
  
      
      <Route path="/addharvestschedules" element={<AddSchedule />} />
      

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
