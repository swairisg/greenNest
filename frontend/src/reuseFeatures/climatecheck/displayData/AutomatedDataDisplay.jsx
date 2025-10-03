// components/Home/displayData/AutomatedDataDisplay.js
import React from "react";

function AutomatedDataDisplay({ task, onToggle, onEdit }) {
  const { _id, parameter, minValue, maxValue, isActive } = task;

  return (
    <div className="mb-2 p-3 bg-gray-600 rounded flex justify-between items-center text-white">
      <div className="flex-1 flex flex-col md:flex-row md:justify-between md:items-center">
        <span className="font-semibold">{parameter}</span>
        <span className="text-gray-300">
          Min: {minValue}, Max: {maxValue}
        </span>
      </div>

      <div className="flex items-center space-x-2 mt-2 md:mt-0">
        <button
          onClick={() => onToggle(_id)}
          className={`px-2 py-1 text-xs rounded text-white ${
            isActive ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </button>
        <button
          onClick={() => onEdit(_id)}
          className="px-2 py-1 bg-yellow-600 text-white text-xs rounded"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default AutomatedDataDisplay;
