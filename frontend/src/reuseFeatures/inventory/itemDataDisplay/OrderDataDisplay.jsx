import React from "react";
import moment from "moment";

function OrderDataDisplay({ data, onDelete, onEdit, onUpdateStatus }) {
  const { 
    _id, 
    poNumber, 
    supplierId, 
    items, 
    totalAmount, 
    status, 
    orderDate,
    expectedDelivery,
    isDeleted 
  } = data;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-gray-500/20 text-gray-400';
      case 'Sent': return 'bg-blue-500/20 text-blue-400';
      case 'Confirmed': return 'bg-green-500/20 text-green-400';
      case 'Received': return 'bg-purple-500/20 text-purple-400';
      case 'Cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (date) => {
    return moment(date).format('MMM DD, YYYY');
  };

  const calculateTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="mb-3 p-4 bg-white rounded-lg text-gray border-l-4 border-l-blue-500">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-600">{poNumber}</h3>
          <p className="text-gray-500 text-sm">
            Supplier: {supplierId?.companyName || 'Loading...'}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border border-green-400 ${getStatusColor(status)}`}>
            {status}
          </span>
          <p className="text-gray-700 text-sm mt-1">${totalAmount?.toFixed(2)}</p>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
        <div>
          <strong className="text-gray-600">Order Date:</strong>
          <p className="text-gray-500">{formatDate(orderDate)}</p>
        </div>
        <div>
          <strong className="text-gray-600">Expected Delivery:</strong>
          <p className="text-gray-500">{expectedDelivery ? formatDate(expectedDelivery) : 'Not set'}</p>
        </div>
        <div>
          <strong className="text-gray-600">Total Items:</strong>
          <p className="text-gray-500">{calculateTotalItems()} units</p>
        </div>
      </div>

      {/* Items List */}
      <div className="mb-3">
        <strong className="text-gray-600 text-sm">Items:</strong>
        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-xs bg-gray-200/30 p-2 rounded">
              <span className="text-gray-500">
                {item.itemId?.name || 'Item loading...'} × {item.quantity}
              </span>
              <span className="text-gray-500">${item.unitPrice?.toFixed(2)} each</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-500">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(_id)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
          >
            Edit
          </button>
          
          {/* Status Update Buttons */}
          {status === 'Draft' && (
            <button
              onClick={() => onUpdateStatus(_id, 'Sent')}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Send PO
            </button>
          )}
          
          {status === 'Sent' && (
            <button
              onClick={() => onUpdateStatus(_id, 'Confirmed')}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Confirm
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          {status === 'Draft' && (
            <button
              onClick={() => onDelete(_id)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Delete
            </button>
          )}
          
          {status === 'Cancelled' && (
            <button
              onClick={() => onUpdateStatus(_id, 'Draft')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Restore
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDataDisplay;