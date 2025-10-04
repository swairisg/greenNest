import React from "react";

function SupplierDataDisplay({ data, onDelete, onEdit }) {
  const { 
    _id, 
    companyName, 
    contactPerson, 
    email, 
    phone, 
    address, 
    taxId, 
    paymentTerms,
    isActive 
  } = data;

  return (
    <div className="mb-3 p-4 bg-white rounded-lg text-gray-800 border-l-4 border-l-blue-400 border-2 ">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-600">{companyName}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-red-500/20 text-red-400 border border-red-500'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {/* Contact Information */}
            <div className="space-y-2">
              <div>
                <strong className="text-gray-700">Contact Person:</strong>
                <p className="text-gray-600">{contactPerson || 'Not specified'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Email:</strong>
                <p className="text-gray-600 truncate">{email || 'Not provided'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Phone:</strong>
                <p className="text-gray-600">{phone || 'Not provided'}</p>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-2">
              <div>
                <strong className="text-gray-700">Tax ID:</strong>
                <p className="text-gray-600">{taxId || 'Not provided'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Payment Terms:</strong>
                <p className="text-gray-600">{paymentTerms || 'Not specified'}</p>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <div>
                <strong className="text-gray-700">Address:</strong>
                <p className="text-gray-600 text-sm">{address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-500">
            <span className="text-xs text-gray-500">Supplier ID: {_id}</span>
          </div>
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={() => onEdit(_id)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(_id)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupplierDataDisplay;