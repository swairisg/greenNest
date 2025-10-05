
import React, { useEffect, useState, useMemo } from "react"; 
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../../../api"
import "./AddYieldRecord.css";

const toYMD = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return "";
  return dt.toISOString().slice(0, 10).replace(/-/g, "/"); // YYYY/MM/DD
};


export default function AddYieldRecord() {
  const { scheduleId: paramId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [prefill, setPrefill] = useState({ cropType: "", greenhouseSection: "", plantedDate: "" });
  const [form, setForm] = useState({
    harvestdate: "",
    quantity: "",
    treesPicked: "",
    storageLocation: ""
  });

  //today string once for inputs/validation
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    if (state?.scheduleId && state?.cropType && state?.greenhouseSection) {
      setPrefill({
        cropType: state.cropType,
        greenhouseSection: state.greenhouseSection,
        plantedDate: state.plantedDate || ""
      });
      return;
    }
    if (paramId) {
      axios.get(`${API_BASE}/harvestSchedules/${encodeURIComponent(paramId)}`)
        .then(r => {
          const s = r.data.harvestschedule || r.data;
          setPrefill({
            cropType: s.cropType,
            greenhouseSection: s.greenhouseSection,
            plantedDate: s.plantedDate || ""
          });
        })
        .catch(() => setPrefill({ cropType: "", greenhouseSection: "", plantedDate: "" }));
    }
  }, [paramId, state]);

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // validation before submit
  const validateForm = () => {
    const errs = [];

    // harvest date required & not in the future
    if (!form.harvestdate) {
      errs.push("Harvest date is required.");
    } else if (form.harvestdate > todayStr) {
      errs.push("Harvest date cannot be in the future.");
    }

    //  required & > 0
    const qty = Number(form.quantity);
    if (form.quantity === "" || Number.isNaN(qty)) {
      errs.push("Quantity is required.");
    } else if (qty <= 0) {
      errs.push("Quantity must be greater than 0.");
    }

    // trees picked: required & > 0
    const trees = Number(form.treesPicked);
    if (form.treesPicked === "" || Number.isNaN(trees)) {
      errs.push("Trees picked is required.");
    } else if (!Number.isInteger(trees) || trees <= 0) {
      errs.push("Trees picked must be a whole number greater than 0.");
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

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const scheduleId = state?.scheduleId || paramId;

      const { data } = await axios.post(`${API_BASE}/yieldrecords`, {
        scheduleId,
        harvestdate: form.harvestdate,
        greenhouseSection: prefill.greenhouseSection,
        cropType: prefill.cropType,
        PlantedDate: prefill.plantedDate,
        quantity: Number(form.quantity),
        treesPicked: Number(form.treesPicked),
        storageLocation: form.storageLocation
      });

      await Swal.fire({
        icon: 'success',
        title: data?.message || 'Yield record created successfully!',
        text: `Record ID: ${data?.data?._id || ""}`,
        timer: 1600,
        showConfirmButton: false
      });

      navigate("/ViewYieldRecords");
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || error?.response?.data?.error || "Failed to add yield record. Please try again"
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="yieldadd-form">
      <div className="yieldadd-form-header">
        <h2>Add Yield Record</h2>
      </div>

      <div>
        <label className="yieldadd_label">Harvest ID</label>
        <input className="yieldadd_input_readonly" value={state?.scheduleId || paramId || ""} readOnly />
      </div>

      <div>
        <label className="yieldadd_label">Crop Type</label>
        <input className="yieldadd_input_readonly" value={prefill.cropType} readOnly />
      </div>

      <div>
        <label className="yieldadd_label">Greenhouse Section</label>
        <input className="yieldadd_input_readonly" value={prefill.greenhouseSection} readOnly />
      </div>

      <div>
      <label className="yieldadd_label">Planted Date</label>
      <input className="yieldadd_input_readonly" value={toYMD(prefill.plantedDate)} readOnly />
      </div>

      <div>
        <label className="yieldadd_label">Harvest Date</label>
        {/*block future dates in the picker itself */}
        <input
          className="yieldadd_input_date"
          type="date"
          name="harvestdate"
          value={form.harvestdate}
          onChange={onChange}
          max={todayStr}
          required
        />
      </div>

      <div>
        <label className="yieldadd_label">Quantity</label>
        {/* must be >0; step allows decimals like kg */}
        <input
          className="yieldadd_input_number"
          type="number"
          step="0.01"
          min="0.01"
          name="quantity"
          value={form.quantity}
          onChange={onChange}
          inputMode="decimal"
          required
        />
      </div>

      <div>
        <label className="yieldadd_label">Trees Picked</label>
        {/* must be integer >0 */}
        <input
          className="yieldadd_input_number"
          type="number"
          min="1"
          step="1"
          name="treesPicked"
          value={form.treesPicked}
          onChange={onChange}
          inputMode="numeric"
          required
        />
      </div>

      <div>
        <label className="yieldadd_label">Storage Location</label>
        <select
          className="yieldadd_input_text"
          name="storageLocation"
          value={form.storageLocation}
          onChange={onChange}
          required
        >
          <option value="" disabled>-- Select Section --</option>
          <option value="Section A">Section A</option>
          <option value="Section B">Section B</option>
          <option value="Section C">Section C</option>
          <option value="Section D">Section D</option>
          
        </select>
      </div>

      <button type="submit" className="yieldadd_submitbtn">Save Yield</button>
    </form>
  );
}
