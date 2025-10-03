import React from "react";
import moment from "moment-timezone";

function ClimateDataDisplay({ data, onDelete }) {
  const { 
    _id, 
    temperature, 
    humidity, 
    soilMoisture, 
    timestamp, 
    timezone, 
    location,
    sensorId 
  } = data;

  const localTime = timestamp
    ? moment
        .utc(timestamp)
        .tz(timezone || "Asia/Colombo")
        .format("YYYY-MM-DD HH:mm:ss")
    : "N/A";

  //determine status colors based on values
  const getTemperatureColor = (temp) => {
    if (temp > 30) return "text-red-400";
    if (temp < 15) return "text-blue-400";
    return "text-orange-400";
  };

  const getHumidityColor = (hum) => {
    if (hum > 80) return "text-blue-400";
    if (hum < 30) return "text-yellow-400";
    return "text-green-400";
  };

  const getSoilMoistureColor = (moisture) => {
    if (moisture > 70) return "text-blue-400";
    if (moisture < 30) return "text-red-400";
    return "text-green-400";
  };

  return (
    <div className="mb-4 p-4 bg-white rounded-lg text-gray-800 border-2 border-green-400 hover:border-red-500/50 ">
      <div className="flex flex-col space-y-3">
        {/* Header with time and location */}
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-gray-600">
              <strong>Time:</strong> {localTime}
            </p>
            <p className="text-sm text-gray-500">
              <strong>Location:</strong> {location || "N/A"}
              {sensorId && ` • Sensor: ${sensorId}`}
            </p>
          </div>
          <button
            onClick={() => onDelete(_id)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
          >
            Delete
          </button>
        </div>

        {/* Climate Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Temperature */}
          <div className="bg-white p-3 rounded text-center">
            <h3 className="font-medium text-gray-600 mb-1">Temperature</h3>
            <p className={`text-xl font-bold ${getTemperatureColor(temperature)}`}>
              {temperature} °C
            </p>
            <div className="w-full bg-gray-500 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  temperature > 30 ? "bg-red-400" : 
                  temperature < 15 ? "bg-blue-400" : "bg-orange-400"
                }`}
                style={{ 
                  width: `${Math.min(100, Math.max(0, ((temperature - 10) / 30) * 100))}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-white p-3 rounded text-center">
            <h3 className="font-medium text-gray-600 mb-1">Humidity</h3>
            <p className={`text-xl font-bold ${getHumidityColor(humidity)}`}>
              {humidity} %
            </p>
            <div className="w-full bg-gray-500 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  humidity > 80 ? "bg-blue-400" : 
                  humidity < 30 ? "bg-yellow-400" : "bg-green-400"
                }`}
                style={{ width: `${humidity}%` }}
              ></div>
            </div>
          </div>

          {/* Soil Moisture */}
          <div className="bg-white p-3 rounded text-center">
            <h3 className="font-medium text-gray-600 mb-1">Soil Moisture</h3>
            <p className={`text-xl font-bold ${getSoilMoistureColor(soilMoisture)}`}>
              {soilMoisture} %
            </p>
            <div className="w-full bg-gray-500 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  soilMoisture > 70 ? "bg-blue-400" : 
                  soilMoisture < 30 ? "bg-red-400" : "bg-green-400"
                }`}
                style={{ width: `${soilMoisture}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-2 mt-2">
          {temperature > 30 && (
            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
              🔥 High Temperature
            </span>
          )}
          {temperature < 15 && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
              ❄️ Low Temperature
            </span>
          )}
          {humidity > 80 && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
              💧 High Humidity
            </span>
          )}
          {humidity < 30 && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
              🏜️ Low Humidity
            </span>
          )}
          {soilMoisture > 70 && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
              🌊 High Soil Moisture
            </span>
          )}
          {soilMoisture < 30 && (
            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
              🌵 Low Soil Moisture
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClimateDataDisplay;