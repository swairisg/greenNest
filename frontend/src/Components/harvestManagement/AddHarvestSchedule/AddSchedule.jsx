import React, {useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./AddSchedule.css";
import { API_BASE } from "../../../api"; 


function AddSchedule() {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({
    cropType: "",
    greenhouseSection: "",
    plantedDate: "",
    status: "planted",
    notes: "",
  });

  const [dateError, setDateError] = useState("");      
  const dateRef = useRef(null);                        

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
    if (name === "plantedDate") {
      setDateError("");                                
    }
  };

  const handleStatusClick = (value) => {
    setInputs((prev) => ({ ...prev, status: value }));
  };

  const validateForm = () => {
    const errs = [];

    // Validate planted date
    const today = new Date(); today.setHours(0,0,0,0);  
    const enteredDate = new Date(inputs.plantedDate); enteredDate.setHours(0,0,0,0);
    
    if (!inputs.plantedDate) {
      errs.push("Planted date is required.");
    } else if (enteredDate > today) {
      errs.push("Planted date can't be in the future.");
    }

    // Validate cropType
    if (!inputs.cropType) {
      errs.push("Crop type is required.");
    }

    // Validate greenhouseSection
    if (!inputs.greenhouseSection) {
      errs.push("Greenhouse section is required.");
    }

    if (errs.length) {
      Swal.fire({
        icon: "warning", 
        title: "Please fix these and submit again",
        html: `<ul style="text-align:left;margin:0;padding-left:18px">${errs.map(e => `<li>${e}</li>`).join("")}</ul>`
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await axios.post(`${API_BASE}/harvestSchedules`, {
        cropType: String(inputs.cropType),
        greenhouseSection: String(inputs.greenhouseSection),
        plantedDate: String(inputs.plantedDate),
        status: String(inputs.status),
        notes: String(inputs.notes),
      });

      await Swal.fire({
        icon: "success",
        title: "Schedule added successfully!",
        timer: 1600,
        showConfirmButton: false
      });

      navigate("/viewharvestschedules");
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || err?.message || "An error occurred. Please try again.",
      });
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="ad_addSchedule">
      <h1 className="ad_addSchedule__title">Add Schedule</h1>

      <form onSubmit={handleSubmit} className="ad_addSchedule__form" noValidate>
       
        {/* cropType */}
        <label htmlFor="ad_cropType" className="ad_form__label">Crop Type</label>
        <select
          id="ad_cropType"
          name="cropType"
          onChange={handleChange}
          value={inputs.cropType}
          required
          className="ad_form__select"
        >
          <option value="" disabled>-- Select a crop --</option>
          <option value="Strawberry">Strawberry</option>
          <option value="Cabbage">Cabbage</option>
          <option value="Tomatoes">Tomatoes</option>
          <option value="Lilly">Lilly</option>
        </select>

        {/* greenhouse section */}
        <label htmlFor="ad_greenhouseSection" className="ad_form__label">Greenhouse Section</label>
        <select
          id="ad_greenhouseSection"
          name="greenhouseSection"
          onChange={handleChange}
          value={inputs.greenhouseSection}
          required
          className="ad_form__input"
        >
          <option value="" disabled>-- Select Section --</option>
          <option value="Section A">Section A</option>
          <option value="Section B">Section B</option>
          <option value="Section C">Section C</option>
          <option value="Section D">Section D</option>
        </select>

        {/* planted date */}
        <label htmlFor="ad_plantedDate" className="ad_form__label">Planted Date</label>
        <input
          id="ad_plantedDate"
          type="date"
          name="plantedDate"
          onChange={handleChange}
          value={inputs.plantedDate}
          required
          max={todayStr}
          ref={dateRef}
          aria-invalid={!!dateError}
          aria-describedby="ad_plantedDate_help"
          className={`ad_form__input ad_form__input--date ${dateError ? "ad_input--invalid" : ""}`}
        />
        {dateError && (
          <div
            id="ad_plantedDate_help"
            className="ad_fieldError"
            role="alert"
            aria-live="polite"
          >
            {dateError}
          </div>
        )}

        {/* status */}
        <span className="ad_form__label">Status</span>
        <div className="ad_statusChips" role="group" aria-label="Status">
          {["planted"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStatusClick(s)}
              aria-pressed={inputs.status === s}
              className={`ad_statusChip ${inputs.status === s ? "ad_statusChip--active" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* notes */}
        <label htmlFor="ad_notes" className="ad_form__label">Notes</label>
        <input
          id="ad_notes"
          type="text"
          name="notes"
          onChange={handleChange}
          value={inputs.notes}
          placeholder="Optional notes…"
          className="ad_form__input"
        />

        <button type="submit" className="ad_btn ad_btn--primary">Submit</button>
      </form>
    </div>
  );
}

export default AddSchedule;