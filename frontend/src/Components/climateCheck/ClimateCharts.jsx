import React from "react";

const ClimateCharts = ({ climateData }) => {
  if (!climateData || !Array.isArray(climateData) || climateData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-300">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Climate Trends
        </h2>
        <p className="text-gray-600 text-center">No climate data available for charts</p>
      </div>
    );
  }

  // Use the passed climateData
  const chartData = climateData.slice(-6).map(r => ({
    temperature: Number(r.temperature ?? 0),
    humidity: Number(r.humidity ?? 0),
    soilMoisture: Number(r.soilMoisture ?? 0),
    timestamp: r.timestamp
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-300">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Climate Trends
        </h2>
        <p className="text-gray-600 text-center">No valid climate data available</p>
      </div>
    );
  }

  const tempValues = chartData.map(d => d.temperature);
  const humidityValues = chartData.map(d => d.humidity);
  const moistureValues = chartData.map(d => d.soilMoisture);

  const minTemp = Math.min(...tempValues);
  const maxTemp = Math.max(...tempValues);
  const minHumidity = Math.min(...humidityValues);
  const maxHumidity = Math.max(...humidityValues);
  const minMoisture = Math.min(...moistureValues);
  const maxMoisture = Math.max(...moistureValues);

  const avgTemp = tempValues.reduce((sum, val) => sum + val, 0) / tempValues.length;
  const avgHumidity = humidityValues.reduce((sum, val) => sum + val, 0) / humidityValues.length;
  const avgMoisture = moistureValues.reduce((sum, val) => sum + val, 0) / moistureValues.length;

  const MiniChart = ({ title, values, minValue, maxValue, color, unit, currentValue }) => {
    const chartWidth = 250;
    const chartHeight = 120;
    const padding = 20;

    const scaleX = (index) => padding + (index * (chartWidth - 2 * padding)) / (values.length - 1 || 1);
    const scaleY = (value) => chartHeight - padding - ((value - minValue) / (maxValue - minValue || 1)) * (chartHeight - 2 * padding);

    const pathData = values.map((value, i) =>
      `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(value)}`
    ).join(' ');

    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
          <span className="text-lg font-bold" style={{ color }}>
            {currentValue}{unit}
          </span>
        </div>

        <svg width={chartWidth} height={chartHeight} className="mx-auto">
          {/* X axis */}
          <line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* Chart line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {values.map((value, i) => (
            <circle
              key={i}
              cx={scaleX(i)}
              cy={scaleY(value)}
              r="2"
              fill={color}
            />
          ))}

          {/* Min & Max labels */}
          <text x={padding} y={12} fontSize="10" fill="#6b7280" textAnchor="start">
            {maxValue}{unit}
          </text>
          <text x={padding} y={chartHeight - 5} fontSize="10" fill="#6b7280" textAnchor="start">
            {minValue}{unit}
          </text>
        </svg>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Min: {minValue}{unit}</span>
          <span>Avg: {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}{unit}</span>
          <span>Max: {maxValue}{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-300">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        Climate Trends
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MiniChart
          title="Temperature"
          values={tempValues}
          minValue={minTemp}
          maxValue={maxTemp}
          color="#ef4444"
          unit="°C"
          currentValue={tempValues[tempValues.length - 1]}
        />
        <MiniChart
          title="Humidity"
          values={humidityValues}
          minValue={minHumidity}
          maxValue={maxHumidity}
          color="#3b82f6"
          unit="%"
          currentValue={humidityValues[humidityValues.length - 1]}
        />
        <MiniChart
          title="Soil Moisture"
          values={moistureValues}
          minValue={minMoisture}
          maxValue={maxMoisture}
          color="#10b981"
          unit="%"
          currentValue={moistureValues[moistureValues.length - 1]}
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <h3 className="font-semibold text-red-800 mb-2">Temperature Summary</h3>
          <div className="space-y-1 text-red-700">
            <div>Current: {tempValues[tempValues.length - 1]}°C</div>
            <div>Average: {avgTemp.toFixed(1)}°C</div>
            <div>Range: {minTemp}°C - {maxTemp}°C</div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Humidity Summary</h3>
          <div className="space-y-1 text-blue-700">
            <div>Current: {humidityValues[humidityValues.length - 1]}%</div>
            <div>Average: {avgHumidity.toFixed(1)}%</div>
            <div>Range: {minHumidity}% - {maxHumidity}%</div>
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">Soil Moisture Summary</h3>
          <div className="space-y-1 text-green-700">
            <div>Current: {moistureValues[moistureValues.length - 1]}%</div>
            <div>Average: {avgMoisture.toFixed(1)}%</div>
            <div>Range: {minMoisture}% - {maxMoisture}%</div>
          </div>
        </div>
      </div>

      {/* Timeline info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
        <strong>Time Range:</strong> {new Date(chartData[0].timestamp).toLocaleString()} - {new Date(chartData[chartData.length - 1].timestamp).toLocaleString()}
        <span className="ml-4"><strong>Data Points:</strong> {chartData.length}</span>
      </div>
    </div>
  );
};

export default ClimateCharts;
