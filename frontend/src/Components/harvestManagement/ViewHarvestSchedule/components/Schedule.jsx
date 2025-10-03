import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../api"; 


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

function formatDateLike(d) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

//---planted date to due date ---
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

// ---- Display schedules  ----
function Schedule(props) {
  const { _id, cropType, greenhouseSection, plantedDate, status, notes } =
    props.harvestschedule;

  //--- compute expected date ---
  const { date: expected, days } = getExpectedHarvestDate(
    cropType,
    plantedDate,
    { seasonFactor: 1, fertilizerBoost: 0, base: 25, extra: 0 }
  );

  const navigate = useNavigate();

  // FIXED: Use the correct function name 'derivedStatus' instead of 'calculateDerivedStatus'
  const derivedStatusValue = derivedStatus(expected, status);

  // --- Adding changed status to db ---
  useEffect(() => {
    if (!_id) return;
    if (derivedStatusValue === status) return; 
    if(status === "harvested" ) return;

   api
    .put(`/harvestSchedules/${_id}`, { status: derivedStatusValue })
    .catch((err) => {
      console.error(
        "Status auto-update failed:",
        err?.response?.data || err?.message || err
      );
    });
    }, [_id, derivedStatusValue, status]);

  // --- Handle Harvest action ---
  const handleHarvest = async (e) => {
    e.preventDefault(); // Prevent default link behavior
    
    if (!window.confirm("Mark this schedule as harvested and proceed to add yield record?")) return;
    
    try {
      // First update the status to harvested
      await api.put(`/harvestSchedules/${_id}`, { status: "harvested" });

      
      // Then navigate to AddYieldRecord page
      navigate(`/AddYieldRecord/${_id}`, {
        state: {
          scheduleId: _id,
          cropType,
          greenhouseSection,
          plantedDate
        }
      });
      
    } catch (err) {
      console.error("Harvest update failed:", err);
      alert(`Harvest update failed: ${err?.response?.data?.message || err?.message || "Unknown error"}`);
    }
  };

  //--- delete schedules ---
  const deleteHandler = async () => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await api.delete(`/harvestSchedules/${_id}`);
      navigate("/viewharvestschedules");
    } catch (err) {
      console.error(err);
      alert(
        `Delete failed: ${
          err?.response?.data?.message || err?.message || "Unknown error"
        }`
      );
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