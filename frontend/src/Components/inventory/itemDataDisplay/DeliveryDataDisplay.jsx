import React from "react";
import moment from "moment";

function DeliveryDataDisplay({ data, onUpdateStatus, onDelete, onEdit }) {
  const { 
    _id, 
    deliveryNumber, 
    associatedOrderId, 
    dropoffAddress, 
    scheduledDeliveryTime,
    actualDeliveryTime,
    assignedDriverId,
    status,
    geolocation,
    notes
  } = data;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-500/20 text-blue-400 border-l-blue-400';
      case 'Picked Up': return 'bg-purple-500/20 text-purple-400 border-l-purple-400';
      case 'In Transit': return 'bg-yellow-500/20 text-yellow-400 border-l-yellow-400';
      case 'Delivered': return 'bg-green-500/20 text-green-400 border-l-green-400';
      case 'Delayed': return 'bg-red-500/20 text-red-400 border-l-red-400';
      case 'Cancelled': return 'bg-gray-500/20 text-gray-400 border-l-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (date) => date ? moment(date).format('MMM DD, YYYY HH:mm') : 'N/A';
  const formatAddress = (address) => address.length > 50 ? address.substring(0, 50) + '...' : address;

  return (
    <div className={`mb-3 p-4 bg-gray-700 rounded-lg text-white border-l-4 ${getStatusColor(status)}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{deliveryNumber}</h3>
          <p className="text-gray-300 text-sm">
            PO: {associatedOrderId?.poNumber || 'N/A'} • 
            Driver: {assignedDriverId?.name || 'Unassigned'}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
          <p className="text-gray-300 text-sm mt-1">{formatDate(scheduledDeliveryTime)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
        <div></div>
        <div className="space-y-2">
          <div>
            <strong className="text-gray-300">Dropoff:</strong>
            <p className="text-gray-200">{formatAddress(dropoffAddress)}</p>
          </div>
          <div>
            <strong className="text-gray-300">Scheduled Delivery:</strong>
            <p className="text-gray-200">{formatDate(scheduledDeliveryTime)}</p>
          </div>
          {actualDeliveryTime && (
            <div>
              <strong className="text-gray-300">Actual Delivery:</strong>
              <p className="text-gray-200">{formatDate(actualDeliveryTime)}</p>
            </div>
          )}
        </div>
      </div>

      {geolocation && (
        <div className="mb-3 p-2 bg-gray-600/30 rounded">
          <strong className="text-gray-300 text-sm">Last Location:</strong>
          <p className="text-gray-200 text-sm">
            Lat: {geolocation.lat}, Lng: {geolocation.lng}
          </p>
        </div>
      )}

      {notes && (
        <div className="mb-3">
          <strong className="text-gray-300 text-sm">Notes:</strong>
          <p className="text-gray-200 text-sm">{notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-500">
        <div className="flex space-x-2">
          {status === 'Scheduled' && (
            <button
              onClick={() => onUpdateStatus(_id, 'Picked Up')}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Mark Picked Up
            </button>
          )}
          {status === 'Picked Up' && (
            <button
              onClick={() => onUpdateStatus(_id, 'In Transit')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Mark In Transit
            </button>
          )}
          {status === 'In Transit' && (
            <button
              onClick={() => onUpdateStatus(_id, 'Delivered')}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Mark Delivered
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          {status !== 'Delivered' && status !== 'Cancelled' && (
            <button
              onClick={() => onUpdateStatus(_id, 'Delayed')}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Delay
            </button>
          )}
          {status === 'Scheduled' && (
            <button
              onClick={() => onDelete(_id)}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Cancel
            </button>
          )}
          {/* Edit Button */}
          <button
            onClick={() => onEdit(_id)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryDataDisplay;
