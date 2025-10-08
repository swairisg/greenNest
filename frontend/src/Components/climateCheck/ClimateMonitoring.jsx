import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment-timezone";
import { Trash2, Edit2, Settings } from "lucide-react";
import ClimateCharts from "./ClimateCharts";

function ClimateDataDisplay({ data, onDelete }) {
  const {
    _id,
    temperature,
    humidity,
    soilMoisture,
    timestamp,
    timezone,
    location,
    sensorId,
  } = data;

  const localTime = timestamp
    ? moment
        .utc(timestamp)
        .tz(timezone || "Asia/Colombo")
        .format("YYYY-MM-DD HH:mm:ss")
    : "N/A";

  const getTemperatureColor = (temp) => {
    if (temp > 30) return "text-red-600";
    if (temp < 15) return "text-blue-600";
    return "text-orange-600";
  };

  const getHumidityColor = (hum) => {
    if (hum > 80) return "text-blue-600";
    if (hum < 30) return "text-yellow-600";
    return "text-green-600";
  };

  const getSoilMoistureColor = (moisture) => {
    if (moisture > 70) return "text-blue-600";
    if (moisture < 30) return "text-red-600";
    return "text-green-600";
  };

  return (
    <div className="mb-4 p-4 bg-white rounded-lg border border-gray-300 hover:border-red-300 hover:border-2 transition-colors">
      <div className="flex flex-col space-y-5">
        <div className="flex justify-between">
          <div>
            <p className="font-medium text-gray-700">
              <strong>Time:</strong> {localTime}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Location:</strong> {location || "N/A"}
              {sensorId && ` • Sensor: ${sensorId}`}
            </p>
          </div>
          <div className="ml-12 "><button
            onClick={() => onDelete(_id)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
          >
            Delete
          </button></div>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 pt-3 ml-2 text-center max-w-sm mx-auto">
            <h3 className="font-medium text-gray-600 mb-1">Temperature</h3>
            <p
              className={`text-xl font-bold ${getTemperatureColor(
                temperature
              )}`}
            >
              {temperature} °C
            </p>
            <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  temperature > 30
                    ? "bg-red-500"
                    : temperature < 15
                    ? "bg-blue-500"
                    : "bg-orange-500"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(15, ((temperature - 10) / 30) * 100)
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded text-center">
            <h3 className="font-medium text-gray-600 mb-1">Humidity</h3>
            <p className={`text-xl font-bold ${getHumidityColor(humidity)}`}>
              {humidity} %
            </p>
            <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  humidity > 80
                    ? "bg-blue-500"
                    : humidity < 30
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.max(15, humidity)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded text-center">
            <h3 className="font-medium text-gray-600 mb-1">Soil Moisture</h3>
            <p
              className={`text-xl font-bold ${getSoilMoistureColor(
                soilMoisture
              )}`}
            >
              {soilMoisture} %
            </p>
            <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  soilMoisture > 70
                    ? "bg-blue-500"
                    : soilMoisture < 30
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.max(15,soilMoisture)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {temperature > 30 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
              🔥 High Temperature
            </span>
          )}
          {temperature < 15 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              ❄️ Low Temperature
            </span>
          )}
          {humidity > 80 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              💧 High Humidity
            </span>
          )}
          {humidity < 30 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
              🏜️ Low Humidity
            </span>
          )}
          {soilMoisture > 70 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              🌊 High Soil Moisture
            </span>
          )}
          {soilMoisture < 30 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
              🌵 Low Soil Moisture
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const CLIMATE_URL = "http://localhost:5001/api/climate";
const ALERTS_URL = "http://localhost:5001/api/climate-alerts";
const AUTOMATION_URL = "http://localhost:5001/api/automation";

function ClimateMonitoring() {
  const [latestRecord, setLatestRecord] = useState(null);
  const [pastRecords, setPastRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertConfigs, setAlertConfigs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [activeTab, setActiveTab] = useState("data");
  const [editingId, setEditingId] = useState(null);
  const [newValues, setNewValues] = useState({ minValue: "", maxValue: "" });
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [newAlertConfig, setNewAlertConfig] = useState({
    parameter: "temperature",
    minThreshold: 15,
    maxThreshold: 30,
    severity: "medium",
    notificationMethods: ["in_app"],
    recipients: [],
    cooldownMinutes: 30,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const latestRes = await axios.get(`${CLIMATE_URL}/latest`);
        if (latestRes.data.success) {
          setLatestRecord(latestRes.data.data);
        }

        const allRes = await axios.get(`${CLIMATE_URL}?limit=6`);
        if (allRes.data.success) {
          const records = allRes.data.records || [];
          setPastRecords(records.length > 1 ? records.slice(1) : []);
console.log("Past records:", records);
        }
        console.log("Latest:", latestRes.data.data);
        
      } catch (err) {
        console.error("API Error:", err.response?.data || err.message);
      }
    };

    const fetchAlerts = async () => {
      try {
        setLoadingAlerts(true);
        const response = await axios.get(
          `${ALERTS_URL}/history?resolved=false&days=1`
        );
        if (response.data.alerts) {
          setAlerts(response.data.alerts);
        }
      } catch (err) {
        console.error("Error fetching alerts:", err);
        setAlerts([]); //emp arr
      } finally {
        setLoadingAlerts(false);
      }
    };

    const fetchAlertConfigs = async () => {
      try {
        const response = await axios.get(`${ALERTS_URL}/configs`);
        if (response.data.alertConfigs) {
          setAlertConfigs(response.data.alertConfigs);
        }
      } catch (err) {
        console.error("Error fetching alert configs:", err);
        setAlertConfigs([]);
      }
    };

    const fetchTasks = async () => {
      try {
        const res = await axios.get(AUTOMATION_URL);
        setTasks(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    fetchAlerts();
    fetchAlertConfigs();
    fetchTasks();

    const interval = setInterval(() => {
      fetchData();
      fetchAlerts();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleDeleteAlert = async (alertId) => {
    try {
      await axios.delete(`${ALERTS_URL}/configs/${alertId}`);
      setAlerts((prev) => prev.filter((alert) => alert._id !== alertId));
    } catch (err) {
      console.error("Error deleting alert:", err);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await axios.put(`${ALERTS_URL}/history/${alertId}/resolve`);
      setAlerts((prev) => prev.filter((alert) => alert._id !== alertId));
    } catch (err) {
      console.error("Error resolving alert:", err);
    }
  };
  //stts
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  const handleCreateAlertConfig = async () => {
    try {
      setLoadingConfigs(true);
      const response = await axios.post(
        `${ALERTS_URL}/configs`,
        newAlertConfig
      );

      if (response.data.success) {
        setAlertConfigs((prev) => [...prev, response.data.alertConfig]);
        setNewAlertConfig({
          parameter: "temperature",
          minThreshold: 15,
          maxThreshold: 30,
          severity: "medium",
          notificationMethods: ["in_app"],
          recipients: [],
          cooldownMinutes: 30,
        });
        alert("Alert rule Created Successfully!");
      }
    } catch (err) {
      console.error("Error creating alert config:", err);
      alert("error creating alert rule.");
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleUpdateAlertConfig = async (configId, updates) => {
    try {
      const response = await axios.put(
        `${ALERTS_URL}/configs/${configId}`,
        updates
      );
      if (response.data.success) {
        setAlertConfigs((prev) =>
          prev.map((config) =>
            config._id === configId ? response.data.alertConfig : config
          )
        );
      }
    } catch (err) {
      console.error("Error updating alert config:", err);
    }
  };

  const handleDeleteAlertConfig = async (configId) => {
    try {
      await axios.delete(`${ALERTS_URL}/configs/${configId}`);
      setAlertConfigs((prev) =>
        prev.filter((config) => config._id !== configId)
      );
    } catch (err) {
      console.error("Error deleting alert config:", err);
    }
  };

  const testAlertTrigger = async () => {
    try {
      if (!latestRecord) return;

      const response = await axios.post(`${ALERTS_URL}/test`, {
        parameter: "humidity",
        value: latestRecord.humidity,
      });

      if (response.data.success) {
        const alertsResponse = await axios.get(
          `${ALERTS_URL}/history?resolved=false&days=1`
        );
        setAlerts(alertsResponse.data.alerts || []);
      }
    } catch (err) {
      console.error("Error testing alert:", err);
    }
  };

  const toggleTask = async (task) => {
    try {
      await axios.put(`${AUTOMATION_URL}/${task._id}`, {
        isActive: !task.isActive,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, isActive: !t.isActive } : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (task) => {
    setEditingId(task._id);
    setNewValues({ minValue: task.minValue, maxValue: task.maxValue });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewValues({ minValue: "", maxValue: "" });
  };

  const saveChanges = async (taskId) => {
    try {
      await axios.put(`${AUTOMATION_URL}/${taskId}`, {
        minValue: Number(newValues.minValue),
        maxValue: Number(newValues.maxValue),
      });
      setEditingId(null);
      const res = await axios.get(AUTOMATION_URL);
      setTasks(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${AUTOMATION_URL}/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "temperature_high":
        return "🔥";
      case "temperature_low":
        return "❄️";
      case "humidity_high":
        return "💧";
      case "humidity_low":
        return "🏜️";
      case "soil_moisture_low":
        return "🌵";
      case "soil_moisture_high":
        return "🌊";
      default:
        return "⚠️";
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case "high":
        return "border-red-500 bg-red-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      case "low":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  const getAlertSeverityText = (severity) => {
    switch (severity) {
      case "high":
        return "Critical";
      case "medium":
        return "Warning";
      case "low":
        return "Info";
      default:
        return "Unknown";
    }
  };

  const getParameterName = (parameter) => {
    const names = {
      temperature: "Temperature",
      humidity: "Humidity",
      soilMoisture: "Soil Moisture",
    };
    return names[parameter] || parameter;
  };

  if (!latestRecord) {
    return (
      <div className="min-h-screen bg-white p-6 text-gray-900">
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
      await axios.delete(`${CLIMATE_URL}/${id}`);
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

        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-300">
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "data"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("data")}
            >
              Climate Data
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "alerts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("alerts")}
            >
              Alerts{" "}
              {alerts.length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {alerts.length}
                </span>
              )}
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "automation"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("automation")}
            >
              Automated Processes
            </button>
          </div>
        </div>

        {activeTab === "data" && (
          <>
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-300">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                Overall Latest Measurements
              </h2>
              <p className="text-gray-600 mb-4">Last updated: {localTime}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded text-center border border-red-300">
                  <h3 className="font-medium text-gray-600">Temperature</h3>
                  <p className="text-2xl text-red-600">
                    {latestRecord.temperature} °C
                  </p>
                </div>
                <div className="bg-white p-4 rounded text-center border border-blue-300">
                  <h3 className="font-medium text-gray-600">Humidity</h3>
                  <p className="text-2xl text-blue-600">
                    {latestRecord.humidity} %
                  </p>
                </div>
                <div className="bg-white p-4 rounded text-center border-2 border-green-300">
                  <h3 className="font-medium text-gray-600">Soil Moisture</h3>
                  <p className="text-2xl text-green-600">
                    {latestRecord.soilMoisture} %
                  </p>
                </div>
              </div>
            </div>

            {/*chrt */}
            <div className="mb-6">
              <ClimateCharts
                climateData={[latestRecord, ...pastRecords].slice(0, 10)}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
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
        )}

        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  Alert Configuration
                </h2>
                <button
                  onClick={() => setShowAlertSettings(!showAlertSettings)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Settings size={16} />
                  <span>{showAlertSettings ? "Hide" : "Configure Alerts"}</span>
                </button>
              </div>

              {showAlertSettings && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    Create New Alert Rule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parameter
                      </label>
                      <select
                        value={newAlertConfig.parameter}
                        onChange={(e) =>
                          setNewAlertConfig({
                            ...newAlertConfig,
                            parameter: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="temperature">Temperature</option>
                        <option value="humidity">Humidity</option>
                        <option value="soilMoisture">Soil Moisture</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Severity
                      </label>
                      <select
                        value={newAlertConfig.severity}
                        onChange={(e) =>
                          setNewAlertConfig({
                            ...newAlertConfig,
                            severity: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Threshold
                      </label>
                      <input
                        type="number"
                        value={newAlertConfig.minThreshold}
                        onChange={(e) =>
                          setNewAlertConfig({
                            ...newAlertConfig,
                            minThreshold: Number(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Threshold
                      </label>
                      <input
                        type="number"
                        value={newAlertConfig.maxThreshold}
                        onChange={(e) =>
                          setNewAlertConfig({
                            ...newAlertConfig,
                            maxThreshold: Number(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateAlertConfig}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                  >
                    Create Alert Rule
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">
                  Active Alert Rules
                </h4>
                {alertConfigs.map((config) => (
                  <div
                    key={config._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-800">
                          {getParameterName(config.parameter)}
                        </span>
                        <span className="text-sm text-gray-600">
                          Min: {config.minThreshold} | Max:{" "}
                          {config.maxThreshold}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            config.severity === "high"
                              ? "bg-red-100 text-red-800"
                              : config.severity === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {config.severity}
                        </span>
                        <span
                          className={`text-xs ${
                            config.isActive ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {config.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleUpdateAlertConfig(config._id, {
                            isActive: !config.isActive,
                          })
                        }
                        className={`px-3 py-1 text-sm rounded ${
                          config.isActive
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        {config.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteAlertConfig(config._id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  Active Climate Alerts
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {alerts.length} active alert{alerts.length !== 1 ? "s" : ""}
                  </div>
                  <button
                    onClick={testAlertTrigger}
                    className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded"
                  >
                    Test Alerts
                  </button>
                </div>
              </div>

              {loadingAlerts ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading alerts...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-gray-700 text-lg">No active alerts</p>
                  <p className="text-gray-500 text-sm">
                    All climate parameters are within normal ranges
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert._id}
                      className={`border-l-4 rounded-r-lg p-4 ${getAlertColor(
                        alert.severity
                      )}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">
                            {getAlertIcon(
                              alert.parameter +
                                (alert.thresholdType === "min"
                                  ? "_low"
                                  : "_high")
                            )}
                          </span>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  alert.severity === "high"
                                    ? "bg-red-100 text-red-800"
                                    : alert.severity === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {getAlertSeverityText(alert.severity)}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">
                              {getParameterName(alert.parameter)} —{" "}
                              {alert.message}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleResolveAlert(alert._id)}
                          className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "automation" && (
          <div className="bg-white rounded-lg p-6 border border-gray-300">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Automated Processes
            </h2>

            {tasks.length === 0 ? (
              <p className="text-gray-600">No automation tasks available</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex flex-col md:flex-row items-center justify-between bg-gray-50 p-4 rounded-lg mb-3 border border-gray-300"
                >
                  <div className="flex-1 flex flex-col md:flex-row md:items-center md:space-x-6 mb-2 md:mb-0">
                    <span className="text-gray-900 font-semibold text-lg mb-1 md:mb-0">
                      {task.parameter}
                    </span>

                    {editingId === task._id ? (
                      <div className="flex items-center space-x-2">
                        <label className="text-gray-700 text-sm">Min:</label>
                        <input
                          type="number"
                          value={newValues.minValue}
                          onChange={(e) =>
                            setNewValues({
                              ...newValues,
                              minValue: e.target.value,
                            })
                          }
                          className="w-20 p-2 rounded bg-white text-gray-900 border border-gray-300"
                        />
                        <label className="text-gray-700 text-sm">Max:</label>
                        <input
                          type="number"
                          value={newValues.maxValue}
                          onChange={(e) =>
                            setNewValues({
                              ...newValues,
                              maxValue: e.target.value,
                            })
                          }
                          className="w-20 p-2 rounded bg-white text-gray-900 border border-gray-300"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-600">
                        Min: {task.minValue} | Max: {task.maxValue}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {editingId === task._id ? (
                      <>
                        <button
                          onClick={() => saveChanges(task._id)}
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleTask(task)}
                          className={`px-3 py-2 text-sm rounded-lg text-white transition-colors ${
                            task.isActive
                              ? "bg-green-600 hover:bg-green-700 font-bold"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {task.isActive ? "Active" : "Inactive"}
                        </button>
                        <button
                          onClick={() => startEditing(task)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClimateMonitoring;
