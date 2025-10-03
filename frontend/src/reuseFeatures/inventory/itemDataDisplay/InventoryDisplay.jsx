import React from "react";
import {
  Edit,
  Trash2,
  Package,
  BarChart3,
  Tag,
  Folder,
  Users,
} from "lucide-react";

function InventoryDisplay({ data, suppliers = [], onDelete, onEdit }) {
  const {
    _id,
    name,
    category,
    description,
    currentStock,
    minStockLevel,
    maxStockLevel,
    unitOfMeasure,
    sku,
    supplierId
  } = data;

 // Get supplier name - handle both populated and non-populated supplier data
const getSupplierName = () => {
  console.log("Supplier data for item:", data.name, "supplierId:", supplierId);
  console.log("Available suppliers:", suppliers);

  // If supplier is populated as an object
  if (supplierId && typeof supplierId === 'object' && supplierId._id) {
    const supplierName = supplierId.name || supplierId.companyName;
    console.log("Populated supplier found:", supplierName);
    return supplierName || "N/A";
  } 
  // If supplier is a string ID
  else if (supplierId && typeof supplierId === 'string') {
    const supplier = suppliers.find((s) => s._id === supplierId);
    if (supplier) {
      const supplierName = supplier.name || supplier.companyName;
      console.log("Supplier found by ID:", supplierName);
      return supplierName || "N/A";
    } else {
      console.log("No supplier found for ID:", supplierId);
      return "N/A";
    }
  }
  // If no supplier data
  else {
    console.log("No supplier data available");
    return "N/A";
  }
};

  //stock stat
  const getStockStatus = () => {
    if (currentStock <= minStockLevel) {
      return {
        status: "Low Stock",
        color: "text-red-400",
        bg: "bg-red-500/10",
        borderColor: "border-l-red-400",
        progressColor: "bg-red-400",
      };
    } else if (currentStock >= maxStockLevel * 0.8) {
      return {
        status: "High Stock",
        color: "text-green-400",
        bg: "bg-green-500/10",
        borderColor: "border-l-green-400",
        progressColor: "bg-green-400",
      };
    } else {
      return {
        status: "Normal",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        borderColor: "border-l-blue-400",
        progressColor: "bg-blue-400",
      };
    }
  };

  const stockStatus = getStockStatus();
  const stockPercentage = Math.min(100, (currentStock / maxStockLevel) * 100);
  const isCritical = currentStock <= minStockLevel;

  return (
    <div
      className={`mb-4 p-4 bg-gray-50 rounded-lg text-gray-600 border-l-4  border-2 ${stockStatus.borderColor} hover:border-gray-600/50 hover:border-t-2 transition-colors duration-200`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stockStatus.bg}`}>
                <Package size={20} className={stockStatus.color} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray">{name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Tag size={14} />
                  <span>{sku}</span>
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                stockStatus.color
              } ${stockStatus.bg} border ${stockStatus.borderColor.replace(
                "border-l-",
                "border-"
              )}`}
            >
              {stockStatus.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <div className="flex items-center space-x-2">
              <Users size={16} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Supplier</p>
                <p className="text-gray-600 font-medium">
                  {getSupplierName()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Folder size={16} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Category</p>
                <p className="text-gray-600 font-medium">{category}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <BarChart3 size={16} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Current Stock</p>
                <p className={`font-bold ${stockStatus.color}`}>
                  {currentStock} {unitOfMeasure}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-xs text-gray-600">Stock Range</p>
                <p className="text-gray-600 text-sm">
                  {minStockLevel} - {maxStockLevel} {unitOfMeasure}
                </p>
              </div>
            </div>
          </div>

          {description && (
            <div className="mb-3 p-2 bg-gray-200/30 border rounded">
              <p className="text-gray-600 text-sm">{description}</p>
            </div>
          )}

          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Stock Level Progress</span>
              <span className="font-medium">
                {currentStock} / {maxStockLevel} {unitOfMeasure} (
                {Math.round(stockPercentage)}%)
              </span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${stockStatus.progressColor} transition-all duration-500 ease-out`}
                style={{ width: `${stockPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Min: {minStockLevel}</span>
              <span>Max: {maxStockLevel}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2 ml-4 min-w-[100px]">
          <button
            onClick={() => onEdit(data)} 
            className="flex items-center justify-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded text-sm transition-colors"
            title="Edit Item"
          >
            <Edit size={14} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(_id)}
            className="flex items-center justify-center space-x-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded text-sm transition-colors"
            title="Delete Item"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {isCritical && (
        <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span className="text-red-300 text-xs font-medium">
            ⚠️ Stock level critical! Consider reordering.
          </span>
        </div>
      )}
    </div>
  );
}

export default InventoryDisplay;