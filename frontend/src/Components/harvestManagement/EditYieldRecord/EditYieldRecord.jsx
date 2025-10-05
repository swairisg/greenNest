import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../../../api";
import "./EditYieldRecord.css";

const toYMD = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return "";
  return dt.toISOString().slice(0, 10); // YYYY-MM-DD
};

export default function EditYieldRecord() {
  const { id } = useParams();              // :id from /yieldrecords/edit/:id
  const navigate = useNavigate();

  const [form, setForm] = useState({
    harvestdate: "",
    greenhouseSection: "",
    cropType: "",
    PlantedDate: "",        // note: capital P to match your model/controller
    quantity: "",
    treesPicked: "",
    storageLocation: "",
  });

  const [loading, setLoading] = useState(true);

  const todayStr = useMemo(()=> new Date().toISOString().slice(0, 10), []);
  // Load the record to edit
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get(`${API_BASE}/yieldrecords/${encodeURIComponent(id)}`)
      .then((res) => {
        const r = res.data;
        if (!mounted || !r) return;

        setForm({
          harvestdate: toYMD(r.harvestdate),
          greenhouseSection: r.greenhouseSection || "",
          cropType: r.cropType || "",
          PlantedDate: toYMD(r.PlantedDate),            
          quantity: r.quantity ?? "",
          treesPicked: r.treesPicked ?? "",
          storageLocation: r.storageLocation || "",
        });
      })
      .catch((err) => {
        console.error("Failed to load yield record:", err);
        Swal.fire({
        icon: "error",
        title: "Failed to load yield record",
        text: err?.response?.data?.message || err?.message || "Please try again."
       });
      })
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validateForm = ()=>{
    const errs = [];

    if(!form.harvestdate){
   errs.push("harvest date is required.");
  }else if(form.harvestdate > todayStr){
    errs.push("harvest date cannot be in the future");
  }

  const qty = Number(form.quantity);
    if(form.quantity === "" || Number.isNaN(qty)){
      errs.push("Quantity is required.");
  }else if(qty <= 0){
    errs.push("Quantity must be greater than 0.");
  }

  const trees = Number(form.treesPicked);
  if (form.treesPicked === "" || Number.isNaN(trees)) {
  errs.push("Trees picked must be a valid number.");
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
    if(!validateForm()) return;

    try {
      // Controller requires all these fields (including PlantedDate)
      await axios.put(`${API_BASE}/yieldrecords/${encodeURIComponent(id)}`, {
        harvestdate: form.harvestdate,                
        greenhouseSection: form.greenhouseSection,
        cropType: form.cropType,
        PlantedDate: form.PlantedDate,               
        quantity: Number(form.quantity),
        treesPicked: Number(form.treesPicked),
        storageLocation: form.storageLocation,
      });

      await Swal.fire({ icon: "success", title: "Yield Record updated successfully.", timer: 1400, showConfirmButton: false });
      navigate("/ViewYieldRecords");
    } catch (err) {
      console.error("Failed to update yield record:", err);
      Swal.fire("Error",
        err?.response?.data?.errors?.join?.("\n") ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update yield record. Please try again.",
        "error"
      );
    }
  };

  if (loading) return <p className="yieldup_loading">Loading...</p>;



  return (
    <form onSubmit={onSubmit} className="yieldup_form">
      <h2>Edit Yield Record</h2>

      <div className="yieldup_grid">
        <div className ="yieldup_grid_item">
        <label className = "yieldup_label">Harvest Date</label>
        <input
          className="yieldup_inputdate" 
          type="date"
          name="harvestdate"
          value={form.harvestdate}
          onChange={onChange}
          max={todayStr}
          required
        readOnly  
        />
      </div>

      <div className="yieldup_grid_item">
        <label className = "yieldup_label">Planted Date</label>
        <input
          className="yieldup_inputdate"
          type="date"
          name="PlantedDate"          
          value={form.PlantedDate}
          onChange={onChange}
          required
          readOnly  
        />
      </div>

      <div className="yieldup_grid_item">
        <label className = "yieldup_label">Greenhouse Section</label>
        <input
          className="yieldup_input"
          name="greenhouseSection"
          value={form.greenhouseSection}
          onChange={onChange}
          required
        />
      </div>

      <div className="yieldup_grid_item">
        <label className = "yieldup_label">Crop Type</label>
        <input
          className="yieldup_input"
          name="cropType"
          value={form.cropType}
          onChange={onChange}
          required
        />
      </div>

      <div className="yieldup_grid_item">
        <label className = "yieldup_label">Quantity</label>
        <input
          className="yieldup_inputnumber"
          type="number"
          step="0.01"
          min="0.01"
          name="quantity"
          value={form.quantity}
          onChange={onChange}
          required
        />
      </div>

      <div className="yieldup_grid_item">
        <label className = "yieldup_label">Trees Picked</label>
        <input
          className="yieldup_inputnumber"
          type="number"
          name="treesPicked"
          min="1"
          step="1"
          value={form.treesPicked}
          onChange={onChange}
          inputMode="numeric"
          required
        />
      </div>

      <div className="yieldup_grid_item">
        <label className = "yieldup_label">Storage Location</label>
        <input
          className="yieldup_input"
          name="storageLocation"
          value={form.storageLocation}
          onChange={onChange}
          required
        />
      </div>
      </div>

      <div className="yieldup_actions">
      <button type="submit" className="yieldup_button">Update</button>
      </div>
    </form>
  );
}
