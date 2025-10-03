import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../../../api";
import Swal from "sweetalert2";


//calculating expected harvest date
function getExpectedHarvestDate(cropType, plantedDate, ctx = {}) {
  const rules = {
    strawberry: ({ dayNeutral = false, tempFactor = 1 } = {}) =>
      (dayNeutral ? 60 : 75) * tempFactor,

    cabbage: ({ varietyDays = 90, fertilizerBoost = 0 } = {}) =>
      Math.max(60, Number(varietyDays) + Number(fertilizerBoost)),

    tomatoes: ({ varietyDays = 70, greenhouseBoost = 0 } = {}) =>
      Math.max(55, Number(varietyDays) - Number(greenhouseBoost)),

    lilly: ({ base = 90, extra = 0 } = {}) => Number(base) + Number(extra),
  };

  const key = String(cropType || "").toLowerCase().trim();
  const daysFn = rules[key] || (() => 10); 
  const days = Math.max(0, Math.floor(Number(daysFn(ctx)) || 0));

  const d = new Date(plantedDate);
  if (isNaN(d.getTime())) return { date: null, days: 0 }; 

  d.setDate(d.getDate() + days);
  return { date: d, days };
}

//Formatting date
function formatDateLike(d) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

//Changing due date status
const DUE_SOON_DAYS = 7; 

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function derivedStatus(expectedDate, currentStatus) {
  if(currentStatus === "harvested" ){
    return currentStatus;
  }

  if (!expectedDate) return currentStatus; 

  const today = startOfDay(new Date());
  const exp = startOfDay(expectedDate);
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "over-due";            
  if (diffDays <= DUE_SOON_DAYS) return "due-soon"; 
  
  return currentStatus;   
}

//Dispay schedules
function Schedule(props) {
  const { _id, cropType, greenhouseSection, plantedDate, status, notes } =
    props.harvestschedule;

  //expected date get
  const { date: expected, days } = getExpectedHarvestDate(
    cropType,
    plantedDate,
    { seasonFactor: 1, fertilizerBoost: 0, base: 25, extra: 0 }
  );

  const navigate = useNavigate();

  
  const derivedStatusValue = derivedStatus(expected, status);

  //adding changed status to db
  useEffect(() => {
    if (!_id) return;
    if (derivedStatusValue === status) return; 
    if(status === "harvested" ) return;

   axios
      .put(`${API_BASE}/harvest-schedules/${_id}`, { status: derivedStatusValue })
      .catch((err) => {
        console.error(
          "Status auto-update failed:",
          err?.response?.data || err?.message || err
        );
      });
  }, [_id, derivedStatusValue, status]);


//marking harvested status
  const handleHarvest = async (e) => {
    e.preventDefault();

    const ask = await Swal.fire({
      icon: "question",
      title: "Mark as harvested?",
      text: "This will mark the schedule as harvested and take you to Add Yield Record.",
      showCancelButton: true,
      confirmButtonText: "Yes, continue",
      cancelButtonText: "Cancel"
    });
    if (!ask.isConfirmed) return;

    try {
      await axios.put(`${API_BASE}/harvestschedules/${_id}`, { status: "harvested" });

      await Swal.fire({
        icon: "success",
        title: "Marked as harvested",
        timer: 1400,
        showConfirmButton: false
      });

      navigate(`/AddYieldRecord/${_id}`, {
        state: { scheduleId: _id, cropType, greenhouseSection, plantedDate }
      });
    } catch (err) {
      console.error("Harvest update failed:", err);
      Swal.fire({
        icon: "error",
        title: "Harvest update failed",
        text: err?.response?.data?.message || err?.message || "Unknown error"
      });
    }
  };

  //Delete handling part
  const deleteHandler = async () => {
    const ask = await Swal.fire({
      icon: "warning",
      title: "Delete this schedule?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel"
    });
    if (!ask.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/harvestschedules/${_id}`);

      await Swal.fire({
        icon: "success",
        title: "Schedule deleted",
        timer: 1400,
        showConfirmButton: false
      });

      navigate("/viewharvestschedules");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err?.response?.data?.message || err?.message || "Unknown error"
      });
    }
  };

  return (
      <tr className="hvschedule-row">
        <td>{_id}</td>
        <td>{cropType}</td>
        <td>{greenhouseSection}</td>
        <td>{formatDateLike(plantedDate)}</td>

        <td>
          <span className={`hvstatus-badge hvstatus--${derivedStatusValue.replace(/ /g, '-').toLowerCase()}`}>
            {derivedStatusValue}
          </span>
        </td>

        <td>{notes || "—"}</td>
        <td>
          {formatDateLike(expected)} <span className="hvmuted">({days}d)</span>
        </td>
        <td>
          <div className="hvrow-actions">
            <Link to={`/viewharvestschedules/${_id}`}>Update</Link>
            <button onClick={deleteHandler} type="button">Delete</button>
            
            {/* Show Harvest button only if not already harvested */}
            {derivedStatusValue !== "harvested" && (
              <button onClick={handleHarvest} type="button" className="harvest-btn">
                Harvest
              </button>
            )}
            
            {/* Show status message if harvested */}
            {derivedStatusValue === "harvested" && (
              <span className="action-complete">
                Harvested
              </span>
            )}
          </div>
        </td>
      </tr>
    );
}

export default Schedule;