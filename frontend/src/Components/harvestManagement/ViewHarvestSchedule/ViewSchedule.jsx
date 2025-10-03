import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ViewSchedule.css";
import Schedule from "./components/Schedule";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { API_BASE } from "../../../api"; 



const URL = `${API_BASE}/harvestSchedules`;



/* --- helpers (same logic as in row) --- */
function formatDateLike(d) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

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

const DUE_SOON_DAYS = 7;
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function deriveStatus(expectedDate, currentStatus) {
  if (!expectedDate) return currentStatus;
  const today = startOfDay(new Date());
  const exp = startOfDay(expectedDate);
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "over-due";
  if (diffDays <= DUE_SOON_DAYS) return "due-soon";
  return currentStatus;
}

function ViewSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("upcoming"); 

  const load = () => {
    axios
      .get(URL)
      .then((res) => {
        setSchedules(res.data?.harvestSchedules || res.data?.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch  harvest schedules:", err);
        setSchedules([]);
      });
  };

  useEffect(() => {
    load();
  }, []);

  

  // client-side filtering for both search and status
  const filtered = useMemo(() => {
    let result = schedules;

    // First apply status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => {
        const { date: expected } = getExpectedHarvestDate(s.cropType, s.plantedDate, {
          seasonFactor: 1,
          fertilizerBoost: 0,
          base: 25,
          extra: 0,
        });
        const derivedStatus = deriveStatus(expected, s.status);
        
        switch (statusFilter) {
          case "upcoming":
            return derivedStatus === "due-soon" || s.status === "upcoming" || s.status === "planted";
          case "overdue":
            return derivedStatus === "over-due" || s.status === "overdue";
          case "harvested":
            return s.status === "harvested";
          
          
          default:
            return true;
        }
      });
    }

    // Then apply search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((s) => {
        const { _id, cropType, greenhouseSection, plantedDate, status, notes } = s;
        const { date: expected } = getExpectedHarvestDate(cropType, plantedDate, {
          seasonFactor: 1,
          fertilizerBoost: 0,
          base: 25,
          extra: 0,
        });
        const derived = deriveStatus(expected, status);

        const haystack = [
          _id,
          cropType,
          greenhouseSection,
          status,
          derived,
          notes,
          formatDateLike(plantedDate),
          formatDateLike(expected),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return result;
  }, [query, schedules, statusFilter]);

  // PDF export of currently filtered rows
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Harvest Schedules", 14, 14);

    const rows = filtered.map((s) => {
      const { _id, cropType, greenhouseSection, plantedDate, status, notes } = s;
      const { date: expected, days } = getExpectedHarvestDate(
        cropType,
        plantedDate,
        { seasonFactor: 1, fertilizerBoost: 0, base: 25, extra: 0 }
      );
      const derived = deriveStatus(expected, status);
      return [
        _id,
        cropType,
        greenhouseSection,
        formatDateLike(plantedDate),
        formatDateLike(expected),
        `${days}d`,
        derived,
        notes || "—",
      ];
    });

    autoTable(doc, {
      head: [["ID", "Crop", "Section", "Planted", "Expected", "Days", "Status", "Notes"]],
      body: rows,
      startY: 20,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 150, 83] },
    });

    doc.save("harvest-schedules.pdf");
  };

  return (
    <div className="harvestView">
      <div className="hv-toolbar">
        <h3 className="hvharvest-title">Upcoming Harvest Schedules</h3>
        <div className="hv-toolbar-right">
          <input
            className="hv-search"
            placeholder="Search by ID, crop, section, status, dates, notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
            <button
              className="hv_btn_refresh"
              onClick={load}
             >
              Refresh
             </button>
              
          <button className="hv-btn" onClick={downloadPDF}>
            Download PDF
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="filter-options">
        <button 
          className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          All
        </button>
        <button 
          className={`filter-btn ${statusFilter === "upcoming" ? "active" : ""}`}
          onClick={() => setStatusFilter("upcoming")}
        >
          Upcoming
        </button>
        <button 
          className={`filter-btn ${statusFilter === "overdue" ? "active" : ""}`}
          onClick={() => setStatusFilter("overdue")}
        >
          Overdue
        </button>
        <button 
          className={`filter-btn ${statusFilter === "harvested" ? "active" : ""}`}
          onClick={() => setStatusFilter("harvested")}
        >
          Harvested
        </button>
        
        
      </div>

      <div className="hv-table-wrap">
        <table className="harvestschedule-table">
          <thead>
            <tr>
              <th>Schedule Id</th>
              <th>Crop</th>
              <th>Section</th>
              <th>Planted</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Expected Harvest Date (days)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center" }}>
                  No schedules found.
                </td>
              </tr>
            ) : (
              filtered.map((schedule, i) => (
                <Schedule
                  key={schedule._id || i}
                  index={i + 1}
                  harvestschedule={schedule}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ViewSchedule;