import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import HarvestCalculator from "./components/harvestCalculator/HarvestCalculator"
import "./HarvestDashboard.css";
import "./components/harvestCalculator/HarvestCalculator.css"
import { API_BASE } from "../../../api";

export default function HarvestDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    setLoading(true);
    axios
      .get(`${API_BASE}/yieldrecords`)
      .then((res) => {
        setRecords(res.data?.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch yield records:", err);
        setRecords([]);
        setLoading(false);
      });
  };

  // Calculate current month and last month
  const getCurrentAndLastMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    return {
      current: { month: currentMonth, year: currentYear },
      last: { month: lastMonth, year: lastMonthYear }
    };
  };

  // Process data for crop quantity cards
  const cropData = useMemo(() => {
    if (!records.length) return [];
    
    const months = getCurrentAndLastMonth();
    const cropMap = {};
    
    records.forEach(record => {
      if (!record.cropType || !record.quantity) return;
      
      const harvestDate = new Date(record.harvestdate);
      const harvestMonth = harvestDate.getMonth();
      const harvestYear = harvestDate.getFullYear();
      
      // Initialize crop if not exists
      if (!cropMap[record.cropType]) {
        cropMap[record.cropType] = {
          name: record.cropType,
          totalQuantity: 0,
          lastMonthQuantity: 0,
          currentMonthQuantity: 0
        };
      }
      
      // Add to total quantity
      cropMap[record.cropType].totalQuantity += record.quantity;
      
      // Check if this record is from last month
      if (harvestMonth === months.last.month && harvestYear === months.last.year) {
        cropMap[record.cropType].lastMonthQuantity += record.quantity;
      }
      
      // Check if this record is from current month
      if (harvestMonth === months.current.month && harvestYear === months.current.year) {
        cropMap[record.cropType].currentMonthQuantity += record.quantity;
      }
    });
    
    return Object.values(cropMap);
  }, [records]);

  // Process data for monthly yield bar chart
  const monthlyYieldData = useMemo(() => {
    if (!records.length) return [];
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Filter records based on time range
    let filteredRecords = records;
    if (timeRange !== "all") {
      const cutoffDate = new Date();
      switch (timeRange) {
        case "year":
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
          break;
        case "6months":
          cutoffDate.setMonth(cutoffDate.getMonth() - 6);
          break;
        case "3months":
          cutoffDate.setMonth(cutoffDate.getMonth() - 3);
          break;
        default:
          break;
      }
      filteredRecords = records.filter(record => 
        new Date(record.harvestdate) >= cutoffDate
      );
    }
    
    // Group by month and crop
    filteredRecords.forEach(record => {
      if (!record.harvestdate || !record.cropType || !record.quantity) return;
      
      const harvestDate = new Date(record.harvestdate);
      const monthKey = `${harvestDate.getFullYear()}-${harvestDate.getMonth()}`;
      const displayLabel = `${monthNames[harvestDate.getMonth()]} ${harvestDate.getFullYear()}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          name: displayLabel,
          timestamp: harvestDate,
          ...cropData.reduce((acc, crop) => {
            acc[crop.name] = 0;
            return acc;
          }, {})
        };
      }
      
      if (monthlyData[monthKey][record.cropType] !== undefined) {
        monthlyData[monthKey][record.cropType] += record.quantity;
      }
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyData)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ timestamp, ...rest }) => rest);
  }, [records, cropData, timeRange]);

  // Calculate total statistics
  const totalStats = useMemo(() => {
    const totalQuantity = cropData.reduce((sum, crop) => sum + crop.totalQuantity, 0);
    const totalLastMonth = cropData.reduce((sum, crop) => sum + crop.lastMonthQuantity, 0);
    const totalCurrentMonth = cropData.reduce((sum, crop) => sum + crop.currentMonthQuantity, 0);
    
    return {
      totalQuantity,
      totalLastMonth,
      totalCurrentMonth,
      monthOverMonthChange: totalLastMonth > 0 
        ? ((totalCurrentMonth - totalLastMonth) / totalLastMonth * 100).toFixed(1)
        : totalCurrentMonth > 0 ? "+100" : "0"
    };
  }, [cropData]);

  if (loading) {
    return (
      <div className="harvestdash-loading">
        <div className="harvestdash-loading-spinner"></div>
        <p className="harvestdash-loading-text">Loading harvest data...</p>
      </div>
    );
  }

  return (

    <div className="harvestdash-layout">
  
    <main className="harvestdash-main">  
    <div className="harvestdash-container">
      {/* Tab Navigation */}
      <div className="harvestdash-tabs">
        <button 
          className={`harvestdash-tab-button ${activeTab === "overview" ? "harvestdash-tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Dashboard Overview
        </button>
        <button 
          className={`harvestdash-tab-button ${activeTab === "calculator" ? "harvestdash-tab-active" : ""}`}
          onClick={() => setActiveTab("calculator")}
        >
          Harvest Calculator
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Dashboard Header */}
          <div className="harvestdash-header">
            <h1 className="harvestdash-title">Harvest Management Dashboard</h1>
            <div className="harvestdash-actions">
              <button 
                className="harvestdash-refresh-btn"
                onClick={loadRecords}
              >
                Refresh Data
              </button>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="harvestdash-time-select"
              >
                <option value="all">All Time</option>
                <option value="year">Last Year</option>
                <option value="6months">Last 6 Months</option>
                <option value="3months">Last 3 Months</option>
              </select>
            </div>
          </div>
          

          <div className="harvestdash-summary-cards">
            <div className="harvestdash-summary-card harvestdash-card-total">
              <h3 className="harvestdash-card-title">Total Harvest Quantity</h3>
              <div className="harvestdash-card-quantity">{totalStats.totalQuantity.toLocaleString()} kg</div>
              <div className="harvestdash-card-trend">
                <span className={`harvestdash-change ${parseFloat(totalStats.monthOverMonthChange) >= 0 ? 'harvestdash-change-positive' : 'harvestdash-change-negative'}`}>
                  {parseFloat(totalStats.monthOverMonthChange) >= 0 ? '↑' : '↓'} 
                  {Math.abs(parseFloat(totalStats.monthOverMonthChange))}%
                </span>
                <span className="harvestdash-trend-label">vs last month</span>
              </div>
            </div>
            
            <div className="harvestdash-summary-card harvestdash-card-current">
              <h3 className="harvestdash-card-title">This Month</h3>
              <div className="harvestdash-card-quantity">{totalStats.totalCurrentMonth.toLocaleString()} kg</div>
              <div className="harvestdash-card-trend">
                Current month yield
              </div>
            </div>
            
            <div className="harvestdash-summary-card harvestdash-card-last">
              <h3 className="harvestdash-card-title">Last Month</h3>
              <div className="harvestdash-card-quantity">{totalStats.totalLastMonth.toLocaleString()} kg</div>
              <div className="harvestdash-card-trend">
                Previous month yield
              </div>
            </div>
          </div>

          {/* Crop-specific Cards */}
          <div className="harvestdash-crops-section">
            <h2 className="harvestdash-section-title">Crop Quantities</h2>
            <div className="harvestdash-crop-cards">
              {cropData.map((crop) => (
                <div key={crop.name} className="harvestdash-crop-card">
                  <h3 className="harvestdash-crop-name">{crop.name}</h3>
                  <div className="harvestdash-crop-quantities">
                    <div className="harvestdash-quantity-main">
                      <span className="harvestdash-quantity-label">Total:</span>
                      <span className="harvestdash-quantity-value">{crop.totalQuantity.toLocaleString()} kg</span>
                    </div>
                    <div className="harvestdash-quantity-comparison">
                      <div className="harvestdash-month-quantity">
                        <span className="harvestdash-month-label">This Month:</span>
                        <span className="harvestdash-month-value">{crop.currentMonthQuantity.toLocaleString()} kg</span>
                      </div>
                      <div className="harvestdash-month-quantity">
                        <span className="harvestdash-month-label">Last Month:</span>
                        <span className="harvestdash-month-value">{crop.lastMonthQuantity.toLocaleString()} kg</span>
                      </div>
                    </div>
                    {crop.lastMonthQuantity > 0 && (
                      <div className="harvestdash-growth-indicator">
                        <span className={`harvestdash-indicator ${crop.currentMonthQuantity >= crop.lastMonthQuantity ? 'harvestdash-indicator-positive' : 'harvestdash-indicator-negative'}`}>
                          {crop.currentMonthQuantity >= crop.lastMonthQuantity ? '↗' : '↘'} 
                          {Math.abs(((crop.currentMonthQuantity - crop.lastMonthQuantity) / crop.lastMonthQuantity * 100)).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Yield Bar Chart */}
          <div className="harvestdash-chart-section">
            <div className="harvestdash-chart-header">
              <h2 className="harvestdash-chart-title">Monthly Yield Records</h2>
              <div className="harvestdash-chart-legend">
                {cropData.map((crop, index) => (
                  <div key={crop.name} className="harvestdash-legend-item">
                    <div 
                      className="harvestdash-legend-color" 
                      style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                    ></div>
                    <span className="harvestdash-legend-text">{crop.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="harvestdash-chart-container">
              {monthlyYieldData.length > 0 ? (
             <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={monthlyYieldData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Quantity (kg)', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: -10
                      }} 
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} kg`, 'Quantity']}
                    />
                    <Legend />
                    {cropData.map((crop, index) => (
                      <Bar
                        key={crop.name}
                        dataKey={crop.name}
                        fill={`hsl(${index * 60}, 70%, 50%)`}
                        name={crop.name}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="harvestdash-no-data">
                  <p className="harvestdash-no-data-text">No yield data available for the selected time range.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      </div>
      {activeTab === "calculator" && (
        <HarvestCalculator records={records} />
      )}
      </main>
    </div>
  );
}