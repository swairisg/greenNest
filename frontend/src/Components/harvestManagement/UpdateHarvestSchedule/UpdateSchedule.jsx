import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../../api";
import Swal from "sweetalert2";
import "./UpdateSchedule.css";

function UpdateSchedule() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [inputs, setInputs] = useState({
    cropType: "",
    greenhouseSection: "",
    plantedDate: "", 
    status: "planted",
    notes: "",
  });

  const [loading, setLoading] = useState(true);

  // validation state
  const [formNote, setFormNote] = useState("");
  const [dateError, setDateError] = useState("");
  const dateRef = useRef(null);

  // helper: normalize any ISO/string date -> yyyy-mm-dd for input[type=date]
  const toInputDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const fetchOne = async () => {
      try {
        const res = await axios.get(`${API_BASE}/harvestSchedules/${id}`);
        const data = res.data || {};
        const item =
          data.harvestSchedule ||
          data.HarvestSchedule ||
          data.harvestschedule ||
          data.item ||
          data.data ||
          data;

        setInputs((prev) => ({
          ...prev,
          cropType: item?.cropType ?? "",
          greenhouseSection: item?.greenhouseSection ?? "",
          plantedDate: toInputDate(item?.plantedDate),
          status: item?.status ?? "planted",
          notes: item?.notes ?? "",
        }));
      } catch (err) {
        console.error(err);
        setFormNote("Failed to load schedule. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
    if (name === "plantedDate") {
      setDateError("");
      setFormNote("");
    }
  };

  const handleStatusClick = (value) => {
    setInputs((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const entered = new Date(inputs.plantedDate); entered.setHours(0, 0, 0, 0);

    if (!inputs.plantedDate) {
      setDateError("Planted date is required.");
      setFormNote("Fix the errors below.");
      dateRef.current?.focus();
      
      await Swal.fire({
      icon: "warning",
      title: "Please fix these and submit again",
      html: `<ul style="text-align:left;margin:0;padding-left:18px">
               <li>Planted date is required.</li>
             </ul>`
    });    
    return;

    }
    if (entered > today) {
      setDateError("Planted date can’t be in the future.");
      setFormNote("Fix the errors below.");
      dateRef.current?.focus();
      return;
    }

    try {
        await axios.put(`${API_BASE}/harvestSchedules/${id}`, {       cropType: String(inputs.cropType),
        greenhouseSection: String(inputs.greenhouseSection),
        plantedDate: String(inputs.plantedDate), // yyyy-mm-dd
        status: String(inputs.status),
        notes: String(inputs.notes),
      });

       await Swal.fire({
      icon: "success",
      title: "Schedule updated successfully!",
      timer: 1600,
      showConfirmButton: false
    });

      navigate("/viewharvestschedules");
    } catch (err) {
      console.error(err);
      setFormNote("Failed to update schedule. Please try again.");

      Swal.fire({
      icon: "error",
      title: "Error",
      text: err?.response?.data?.message || err?.message || "An error occurred. Please try again.",
    });
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="up_page">
        <p className="up_loader">Loading…</p>
      </div>
    );
  }

  return (
    <div className="up_page">

      <h1 className="up_title">Update Schedule</h1>

      <form className="up_form" onSubmit={handleSubmit} noValidate>
        {formNote && (
          <div className="up_formNote" role="alert" aria-live="polite">
            {formNote}
          </div>
        )}

        {/* cropType */}
        <label htmlFor="up_cropType" className="up_label">Crop Type</label>
        <select
          id="up_cropType"
          name="cropType"
          value={inputs.cropType}
          onChange={handleChange}
          required
          className="up_select"
        >
          <option value="" disabled>-- Select a crop --</option>
          <option value="Strawberry">Strawberry</option>
          <option value="Cabbage">Cabbage</option>
          <option value="Tomatoes">Tomatoes</option>
          <option value="Lilly">Lilly</option>
        </select>

        {/* greenhouseSection */}
        <label htmlFor="up_greenhouseSection" className="up_label">Greenhouse Section</label>
        <select
          id="up_greenhouseSection"
          name="greenhouseSection"
          value={inputs.greenhouseSection}
          onChange={handleChange}
          required
          className="up_select"
        >
          <option value="" disabled>-- Select Section --</option>
          <option value="Section A">Section A</option>
          <option value="Section B">Section B</option>
          <option value="Section C">Section C</option>
          <option value="Section D">Section D</option>
        </select>

        {/* plantedDate */}
        <label htmlFor="up_plantedDate" className="up_label">Planted Date</label>
        <input
          id="up_plantedDate"
          type="date"
          name="plantedDate"
          value={inputs.plantedDate}
          onChange={handleChange}
          required
          max={todayStr}
          ref={dateRef}
          aria-invalid={!!dateError}
          aria-describedby="up_plantedDate_help"
          className={`up_input ${dateError ? "up_input--invalid" : ""}`}
        />
        {dateError && (
          <div id="up_plantedDate_help" className="up_fieldError" role="alert" aria-live="polite">
            {dateError}
          </div>
        )}

        {/* status chips */}
        <span className="up_label">Status</span>
        <div className="up_statusChips" role="group" aria-label="Status">
          {["planted", "dueSoon", "harvested"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStatusClick(s)}
              className={`up_statusChip ${inputs.status === s ? "up_statusChip--active" : ""}`}
              aria-pressed={inputs.status === s}
            >
              {s}
            </button>
          ))}
        </div>

        {/* notes */}
        <label htmlFor="up_notes" className="up_label">Notes</label>
        <input
          id="up_notes"
          type="text"
          name="notes"
          value={inputs.notes}
          onChange={handleChange}
          placeholder="Optional notes…"
          className="up_input"
        />

        <button type="submit" className="up_btn up_btn--primary">Submit</button>
      </form>
    </div>
  );
}

export default UpdateSchedule;
