import React from "react";
import moment from "moment";

function TransactionDataDisplay({ data, onDelete }) {
  const { 
    _id, 
    itemId, 
    transactionType, 
    quantity, 
    supplierId, 
    reason, 
    batchNumber, 
    date,
    relatedOrderId 
  } = data;

  const getTransactionColor = (type) => {
    return type === "IN" 
      ? "bg-green-500/20 text-green-400 border-l-green-400" 
      : "bg-red-500/20 text-red-400 border-l-red-400";
  };

  const getTransactionIcon = (type) => {
    return type === "IN" ? "⬇️" : "⬆️";
  };

  const formatDate = (date) => {
    return moment(date).format('MMM DD, YYYY HH:mm');
  };

  return (
    <div className={`mb-3 p-4 bg-white rounded-lg text-gray-800 border-l-4 ${getTransactionColor(transactionType)}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getTransactionIcon(transactionType)}</span>
          <div>
            <h3 className="text-lg font-bold text-gray">
              {transactionType === "IN" ? "Stock Inward" : "Stock Outward"}
            </h3>
            <p className="text-gray-700 text-sm">
              {itemId?.name || 'Loading item...'} • {formatDate(date)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            transactionType === "IN" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            {transactionType} {quantity} units
          </span>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <strong className="text-gray-800">Item:</strong>
            <p className="text-gray-700">{itemId?.name || 'N/A'}</p>
          </div>
          <div>
            <strong className="text-gray-800">SKU:</strong>
            <p className="text-gray-700">{itemId?.sku || 'N/A'}</p>
          </div>
          <div>
            <strong className="text-gray-800">Category:</strong>
            <p className="text-gray-700">{itemId?.category || 'N/A'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <strong className="text-gray-800">Supplier:</strong>
            <p className="text-gray-700">{supplierId?.companyName || 'N/A'}</p>
          </div>
          <div>
            <strong className="text-gray-800">Reason:</strong>
            <p className="text-gray-700">{reason || 'Not specified'}</p>
          </div>
          {batchNumber && (
            <div>
              <strong className="text-gray-800">Batch Number:</strong>
              <p className="text-gray-700">{batchNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Order */}
      {relatedOrderId && (
        <div className="mt-3 p-2 bg-gray-500/30 rounded">
          <strong className="text-gray-300 text-sm">Related Order:</strong>
          <p className="text-gray-200 text-sm">{relatedOrderId}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end items-center pt-3 border-t border-gray-500">
        <button
          onClick={() => onDelete(_id)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default TransactionDataDisplay;