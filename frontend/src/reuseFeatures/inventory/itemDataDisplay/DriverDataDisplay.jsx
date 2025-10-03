import React from "react";

function DriverDataDisplay({ data, onDelete, onEdit }) {
  const { 
    _id, 
    name, 
    phone, 
    email, 
    vehicleInfo, 
    licenseNumber, 
    address,
    isActive 
  } = data;

  return (
    <div className="mb-3 p-4 bg-gray-700 rounded-lg text-white border-l-4 border-l-green-400">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{name}</h3>
          <p className="text-gray-300 text-sm">{licenseNumber}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Driver Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <strong className="text-gray-300">Contact:</strong>
            <p className="text-gray-200">{phone}</p>
          </div>
          <div>
            <strong className="text-gray-300">Email:</strong>
            <p className="text-gray-200 truncate">{email}</p>
          </div>
          <div>
            <strong className="text-gray-300">Vehicle:</strong>
            <p className="text-gray-200">{vehicleInfo}</p>
          </div>
        </div>

        <div className="space-y-2">
          {address && (
            <div>
              <strong className="text-gray-300">Address:</strong>
              <p className="text-gray-200 text-sm">{address}</p>
            </div>
          )}
          <div>
            <strong className="text-gray-300">Status:</strong>
            <p className="text-gray-200">{isActive ? 'Available' : 'Not Available'}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center pt-3 border-t border-gray-500 space-x-2">
        <button
          onClick={() => onEdit(_id)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(_id)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

export default DriverDataDisplay;