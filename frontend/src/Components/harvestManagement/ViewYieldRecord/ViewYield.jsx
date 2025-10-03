import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Record from "./components/Record";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import "./ViewYield.css";
import { API_BASE } from "../../../api";


export default function ViewYieldRecord() {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [cropFilter, setCropFilter] = useState("all");
  const [storageFilter, setStorageFilter] = useState("all");

  const load = () => {
    axios
      .get(`${API_BASE}/yieldrecords`)
      .then((res) => {
        setRecords(res.data?.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch yield records:", err);
        setRecords([]);
      });
  };

  useEffect(() => {
    load();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Date calculation helpers
  const getDateRange = (range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (range) {
      case "today":
        return { start: new Date(today), end: new Date(today) };
      case "thisWeek":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek, end: today };
      case "thisMonth":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: startOfMonth, end: today };
      default:
        return null;
    }
  };

  const isDateInRange = (dateString, range) => {
    if (!range) return true;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date >= range.start && date <= range.end;
  };

  // Get unique values for dynamic dropdowns
  const uniqueSections = useMemo(() => {
    const sections = [...new Set(records.map(record => record.greenhouseSection).filter(Boolean))];
    return sections.sort();
  }, [records]);

  const uniqueCrops = useMemo(() => {
    const crops = [...new Set(records.map(record => record.cropType).filter(Boolean))];
    return crops.sort();
  }, [records]);

  const uniqueStorageLocations = useMemo(() => {
    const storage = [...new Set(records.map(record => record.storageLocation).filter(Boolean))];
    return storage.sort();
  }, [records]);

  // Filter records based on search query and filters
  const filteredRecords = useMemo(() => {
    let result = records;

    // Apply search query
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(record => {
        const searchableText = [
          record._id,
          record.cropType,
          record.greenhouseSection,
          record.storageLocation,
          formatDate(record.PlantedDate),
          formatDate(record.harvestdate),
          record.quantity?.toString(),
          record.treesPicked?.toString()
        ].join(' ').toLowerCase();
        
        return searchableText.includes(q);
      });
    }

    // Apply date filter (on harvest date)
    if (dateFilter !== "all") {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        result = result.filter(record => 
          isDateInRange(record.harvestdate, dateRange)
        );
      }
    }

    // Apply section filter
    if (sectionFilter !== "all") {
      result = result.filter(record => 
        record.greenhouseSection === sectionFilter
      );
    }

    // Apply crop filter
    if (cropFilter !== "all") {
      result = result.filter(record => 
        record.cropType === cropFilter
      );
    }

    // Apply storage filter
    if (storageFilter !== "all") {
      result = result.filter(record => 
        record.storageLocation === storageFilter
      );
    }

    return result;
  }, [records, query, dateFilter, sectionFilter, cropFilter, storageFilter]);

  // Clear all filters
  const clearFilters = () => {
    setDateFilter("all");
    setSectionFilter("all");
    setCropFilter("all");
    setStorageFilter("all");
    setQuery("");
  };

  // Download PDF function
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Yield Records Report", 14, 14);

    const tableRows = filteredRecords.map(record => [
      record._id || "—",
      formatDate(record.PlantedDate) || "—",
      formatDate(record.harvestdate) || "—",
      record.greenhouseSection || "—",
      record.cropType || "—",
      record.quantity ? `${record.quantity}` : "—",
      record.treesPicked ? `${record.treesPicked}` : "—",
      record.storageLocation || "—"
    ]);

    autoTable(doc, {
      head: [
        ["Yield ID", "Planted Date", "Harvest Date", "Section", "Crop Type", "Quantity", "Trees Picked", "Storage Location"]
      ],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 150, 83] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 15 },
        8: { cellWidth: 20 }
      }
    });

    doc.save("yield-records.pdf");
  };

  const handleDeleted = (id) => {
    setRecords((prev) => prev.filter((r) => (r._id || r.id) !== id));
  };

  return (
    <div className="viewyield-root">
      <div className="viewyield-header">
        <h2 className="viewyield-title">Yield Records</h2>
        <div className="viewyield-actions">
          <input
            className="viewyield-search"
            placeholder="Search yield records..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="viewyield-btn viewyield-btn--refresh"
            onClick={load}
          >
            Refresh
          </button>
          <button
            className="viewyield-btn viewyield-btn--download"
            onClick={downloadPDF}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Filter Options - Dropdown Version */}
      <div className="filter-options">
        <div className="filter-row">
          {/* Date Filter Dropdown */}
          <div className="filter-group">
            <label className="filter-label">Harvest Date:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
            </select>
          </div>

          {/* Section Filter Dropdown */}
          <div className="filter-group">
            <label className="filter-label">Greenhouse Section:</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Sections</option>
              {uniqueSections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>

          {/* Crop Filter Dropdown */}
          <div className="filter-group">
            <label className="filter-label">Crop Type:</label>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Crops</option>
              {uniqueCrops.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>

          {/* Storage Filter Dropdown */}
          <div className="filter-group">
            <label className="filter-label">Storage Location:</label>
            <select
              value={storageFilter}
              onChange={(e) => setStorageFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Storage</option>
              {uniqueStorageLocations.map(storage => (
                <option key={storage} value={storage}>{storage}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="filter-group">
            <button
              className="viewyield-btn viewyield-btn--clear"
              onClick={clearFilters}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      <div className="viewyield-tablewrap">
        <table className="viewyield-table">
          <thead>
            <tr>
              <th>Yield Record ID</th>
              <th>Planted Date</th>
              <th>Harvest Date</th>
              <th>Greenhouse Section</th>
              <th>Crop Type</th>
              <th>Quantity</th>
              <th>Trees Picked</th>
              <th>Storage Location</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.map((rec) => (
              <Record
                key={rec._id}
                yieldrecord={rec}
                onDelete={handleDeleted}
              />
            ))}

            {filteredRecords.length === 0 && (
              <tr className="viewyield-empty">
                <td colSpan={10}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}