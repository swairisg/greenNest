import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment-timezone";
import ClimateDataDisplay from "../displayData/ClimateDataDisplay";

const URL = "http://localhost:5000/api/climate";
const ALERTS_URL = "http://localhost:5000/api/alerts";

function ClimateMonitoring() {
  const [latestRecord, setLatestRecord] = useState(null);
  const [pastRecords, setPastRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [activeTab, setActiveTab] = useState("data"); // "data" or "alerts"

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Latest record
        const latestRes = await axios.get(`${URL}/latest`);
        console.log('Latest API Response:', latestRes.data);

        if (latestRes.data.success) {
          setLatestRecord(latestRes.data.data);
        } else {
          console.error('Latest API returned success: false');
        }

        // Past records (last 6)
        const allRes = await axios.get(`${URL}?limit=6`);
        console.log('Records API Response:', allRes.data);

        if (allRes.data.success) {
          const records = allRes.data.records || [];
          // Skip the first record (which is the latest)
          setPastRecords(records.length > 1 ? records.slice(1) : []);
        } else {
          console.error('Records API returned success: false');
        }
      } catch (err) {
        console.error('API Error:', err.response?.data || err.message);
      }
    };

    const fetchAlerts = async () => {
      try {
        setLoadingAlerts(true);
        const response = await axios.get(`${ALERTS_URL}/active`);
        if (response.data.success) {
          setAlerts(response.data.alerts || []);
        }
      } catch (err) {
        console.error('Error fetching alerts:', err.response?.data || err.message);
      } finally {
        setLoadingAlerts(false);
      }
    };

    // Fetch data immediately when component mounts
    fetchData();
    fetchAlerts();
    
    // Set up interval for periodic refresh (every minute)
    const interval = setInterval(() => {
      fetchData();
      fetchAlerts();
    }, 60000); // Refresh every minute
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array - runs only on mount and unmount

  const handleDeleteAlert = async (alertId) => {
    try {
      await axios.delete(`${ALERTS_URL}/${alertId}`);
      setAlerts(prev => prev.filter(alert => alert._id !== alertId));
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await axios.patch(`${ALERTS_URL}/${alertId}/resolve`);
      setAlerts(prev => prev.filter(alert => alert._id !== alertId));
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'temperature_high':
        return '🔥';
      case 'temperature_low':
        return '❄️';
      case 'humidity_high':
        return '💧';
      case 'humidity_low':
        return '🏜️';
      case 'soil_moisture_low':
        return '🌵';
      case 'soil_moisture_high':
        return '🌊';
      default:
        return '⚠️';
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'info':
        return 'border-blue-500 bg-blue-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getAlertSeverityText = (severity) => {
    switch (severity) {
      case 'critical':
        return 'Critical';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      default:
        return 'Unknown';
    }
  };

  if (!latestRecord) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 text-white">
        <p>Loading latest climate data...</p>
      </div>
    );
  }

  const localTime = moment
    .utc(latestRecord.timestamp)
    .tz(latestRecord.timezone || "Asia/Colombo")
    .format("YYYY-MM-DD HH:mm:ss");

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${URL}/${id}`);
      setPastRecords((prev) => prev.filter((record) => record._id !== id));
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Climate Monitoring
        </h1>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "data"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("data")}
            >
              Climate Data
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "alerts"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("alerts")}
            >
              Alerts {alerts.length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {alerts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === "data" ? (
          <>
            {/* Latest Measurements */}
            <div className="bg-gray-100 rounded-lg p-6 mb-6 border-2 border-gray-800 ">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                Overall Latest Measurements
              </h2>
              <p className="text-gray-800 mb-4">Last updated: {localTime}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
                <div className="bg-gray-100 p-4 rounded text-center border-2 border-red-300">
                  <h3 className="font-medium text-gray-600">Temperature</h3>
                  <p className="text-2xl text-red-400">
                    {latestRecord.temperature} °C
                  </p>
                </div>
                <div className="bg-gray-100 p-4 rounded text-center border-2 border-blue-300">
                  <h3 className="font-medium text-gray-600">Humidity</h3>
                  <p className="text-2xl text-blue-400">
                    {latestRecord.humidity} %
                  </p>
                </div>
                <div className="bg-gray-100 p-4 rounded text-center border-2 border-green-300">
                  <h3 className="font-medium text-gray-600">Soil Moisture</h3>
                  <p className="text-2xl text-green-400">
                    {latestRecord.soilMoisture} %
                  </p>
                </div>
              </div>
            </div>

            {/* Past Records */}
            <div className="bg-gray-100 rounded-lg p-6 border-2  border-gray-800">
              <h2 className="text-lg font-semibold mb-3 text-gray-600">
                Past Records
              </h2>
              {pastRecords.length === 0 ? (
                <p className="text-gray-600">No past records available</p>
              ) : (
                pastRecords.map((data) => (
                  <ClimateDataDisplay
                    key={data._id}
                    data={data}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          /* Alerts Tab */
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">
                Active Climate Alerts
              </h2>
              <div className="text-sm text-gray-400">
                {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loadingAlerts ? (
              <div className="text-center py-8">
                <p className="text-gray-300">Loading alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-gray-300 text-lg">No active alerts</p>
                <p className="text-gray-400 text-sm">All climate parameters are within normal ranges</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className={`border-l-4 rounded-r-lg p-4 ${getAlertColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">
                          {getAlertIcon(alert.type)}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              alert.severity === 'critical' ? 'bg-red-500 text-white' :
                              alert.severity === 'warning' ? 'bg-yellow-500 text-black' :
                              'bg-blue-500 text-white'
                            }`}>
                              {getAlertSeverityText(alert.severity)}
                            </span>
                            <span className="text-gray-300 text-sm">
                              {moment(alert.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                            </span>
                          </div>
                          <h3 className="text-white font-medium">
                            {alert.message}
                          </h3>
                          {alert.details && (
                            <p className="text-gray-300 text-sm mt-1">
                              {alert.details}
                            </p>
                          )}
                          {alert.location && (
                            <p className="text-gray-400 text-sm mt-1">
                              Location: {alert.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResolveAlert(alert._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleDeleteAlert(alert._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClimateMonitoring;