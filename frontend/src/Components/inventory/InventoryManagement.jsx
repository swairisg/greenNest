import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import SupplierManagement from "./SupplierManagement";
import OrderManagement from "./OrderManagement";
import DeliveryManagement from "./DeliveryManagement";
import DriverManagement from "./DriverManagement";
import {
  Plus,
  Package,
  AlertCircle,
  Layers,
  TrendingUp,
  Users,
  Search,
  Filter,
  X,
  Edit,
  Trash2,
  BarChart3,
  Tag,
  Folder,
  Download,
  FileText,
  FileDown,
  PieChart,
} from "lucide-react";



const API_URL = "http://localhost:5001/api/items";
const SUPPLIERS_API_URL = "http://localhost:5001/api/suppliers";
const ORDER_URL = "http://localhost:5001/api/orders";
const DELIVERY_URL = "http://localhost:5001/api/deliveries";

function InventoryManagement() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrdersLoading] = useState(true);
  const [delivery, setDelivary] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    lowStock: false,
    search: "",
  });

  const [searchInput, setSearchInput] = useState("");
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    description: "",
    unitOfMeasure: "units",
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 100,
    supplierId: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchItems();
    fetchSuppliers();
    fetchOrders();
    fetchDelivery();
  }, [filters.category, filters.lowStock]);

  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const response = await axios.get(SUPPLIERS_API_URL);
      if (response.data.success) {
        const suppliersData =
          response.data.suppliers || response.data.data || [];
        setSuppliers(suppliersData || []);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await axios.get(ORDER_URL);
      if (response.data.success) {
        const orderData =
          response.data.order || response.data.data || [];
        setOrders(orderData || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchDelivery = async () => {
    try {
      setDeliveryLoading(true);
      const response = await axios.get(DELIVERY_URL);
      if (response.data.success) {
        const deliveryData =
          response.data.delivery || response.data.data || [];
        setDelivary(deliveryData || []);
      }
    } catch (err) {
      console.error("Error fetching deliveries:", err);
      setDelivary([]);
    } finally {
      setDeliveryLoading(false);
    }
  };


  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.lowStock) params.append("lowStock", "true");
      if (filters.search) params.append("search", filters.search);

      const response = await axios.get(`${API_URL}?${params}`);
      if (response.data.success) {
        setItems(response.data.items || []);
      } else {
        setError(response.data.message || "Failed to fetch items");
      }
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load inventory data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput,
    }));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setFilters((prev) => ({
      ...prev,
      search: "",
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      if (response.data.success) {
        setItems((prev) => prev.filter((item) => item._id !== id));
        setSuccess("Item deleted successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "Failed to delete item");
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      setError("Failed to delete item. Please try again.");
    }
  };

  const handleEdit = (item) => {
    setEditMode(true);
    setEditingItem(item);
    const supplierId = item.supplierId?._id || item.supplierId;

    setNewItem({
      name: item.name || "",
      category: item.category || "",
      description: item.description || "",
      unitOfMeasure: item.unitOfMeasure || "units",
      currentStock: item.currentStock || 0,
      minStockLevel: item.minStockLevel || 0,
      maxStockLevel: item.maxStockLevel || 100,
      supplierId: supplierId || "",
    });
    setShowForm(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      setError("");
      if (!editingItem || !editingItem._id) {
        setError("Cannot update: Item ID is missing");
        return;
      }

      const response = await axios.put(
        `${API_URL}/${editingItem._id}`,
        newItem
      );

      if (response.data.success) {
        fetchItems();
        setSuccess("Item updated successfully");
        setTimeout(() => setSuccess(""), 3000);
        resetForm();
      } else {
        setError(response.data.message || "Failed to update item");
      }
    } catch (err) {
      console.error("Error updating item:", err);
      setError("Failed to update item. Please try again.");
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();

    if (!newItem.supplierId) {
      setError("Please select a supplier");
      return;
    }

    try {
      setError("");
      const response = await axios.post(API_URL, newItem);

      if (response.data.success) {
        const createdItem = response.data.item || response.data.data;

        if (!createdItem) {
          setError("Server responded but no item data received");
          return;
        }

        setItems((prev) => [createdItem, ...prev]);
        resetForm();
        setSuccess("Item created successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "Failed to create item");
      }
    } catch (err) {
      console.error("Error creating item:", err);
      if (err.response?.data?.message) {
        if (err.response.data.errors) {
          setError(
            `${err.response.data.message}: ${err.response.data.errors.join(
              ", "
            )}`
          );
        } else {
          setError(err.response.data.message);
        }
      } else if (err.response?.data?.errors) {
        setError(`Validation errors: ${err.response.data.errors.join(", ")}`);
      } else {
        setError("Failed to create item. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setNewItem({
      name: "",
      category: "",
      description: "",
      unitOfMeasure: "units",
      currentStock: 0,
      minStockLevel: 0,
      maxStockLevel: 100,
      supplierId: "",
    });
    setShowForm(false);
    setEditMode(false);
    setEditingItem(null);
  };

  const cancelEdit = () => {
    resetForm();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      lowStock: false,
      search: "",
    });
    setSearchInput("");
  };

  const getUniqueCategories = () => {
    if (!Array.isArray(items)) return [];
    const categories = items.map((item) => item.category).filter(Boolean);
    return [...new Set(categories)];
  };

  const categories = getUniqueCategories();
  const totalItems = items.length;
  const lowStockItems = items.filter(
    (item) => (item.currentStock || 0) <= (item.minStockLevel || 0)
  ).length;
  const totalStockValue = items.reduce(
    (sum, item) => sum + (item.currentStock || 0),
    0
  );

  const filteredItems = items.filter((item) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const itemName = item.name || "";
      const itemSku = item.sku || "";
      const itemDescription = item.description || "";

      return (
        itemName.toLowerCase().includes(searchLower) ||
        itemSku.toLowerCase().includes(searchLower) ||
        itemDescription.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const InventoryDisplay = ({ data, suppliers = [], onDelete, onEdit }) => {
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
      supplierId,
    } = data;

    const getSupplierName = () => {
      if (supplierId && typeof supplierId === "object" && supplierId._id) {
        return supplierId.name || supplierId.companyName || "N/A";
      } else if (supplierId && typeof supplierId === "string") {
        const supplier = suppliers.find((s) => s._id === supplierId);
        if (supplier) {
          return supplier.name || supplier.companyName || "N/A";
        } else {
          return "N/A";
        }
      } else {
        return "N/A";
      }
    };

    const getStockStatus = () => {
      const current = Number(currentStock) || 0;
      const min = Number(minStockLevel) || 0;
      const max = Number(maxStockLevel) || 100;

      if (current <= min) {
        return {
          status: "Low Stock",
          color: "text-red-400",
          bg: "bg-red-500/10",
          borderColor: "border-l-red-400",
          progressColor: "bg-red-400",
        };
      } else if (current >= max * 0.8) {
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
    const current = Number(currentStock) || 0;
    const max = Number(maxStockLevel) || 100;
    const stockPercentage = Math.min(100, (current / max) * 100);
    const isCritical = current <= (Number(minStockLevel) || 0);

    return (
      <div
        className={`mb-4 p-4 bg-gray-50 rounded-lg text-gray-600 border-l-4 border-2 ${stockStatus.borderColor} hover:border-gray-600/50 hover:border-t-2 transition-colors duration-200`}
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
                    {current} {unitOfMeasure}
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
                  {current} / {max} {unitOfMeasure} (
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
  };

  const ReportGenerator = () => {
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [error, setError] = useState("");
    const [stats, setStats] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState("");

    useEffect(() => {
      fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/reports/dashboard/stats"
        );
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load dashboard statistics");
      }
    };

    const generateCSV = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `http://localhost:5001/api/reports/export/csv${
            categoryFilter ? `?category=${categoryFilter}` : ""
          }`,
          {
            responseType: "blob",
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `inventory-${categoryFilter || "all"}-${
            new Date().toISOString().split("T")[0]
          }.csv`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("CSV export error:", err);
        setError("Failed to export CSV. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const generatePDF = async () => {
      try {
        setPdfLoading(true);
        setError("");

        const response = await axios.get(
          `http://localhost:5001/api/reports/stock?format=pdf${
            categoryFilter ? `&category=${categoryFilter}` : ""
          }`,
          {
            responseType: "blob",
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `inventory-report-${new Date().toISOString().split("T")[0]}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("PDF export error:", err);
        setError("Failed to generate PDF report. Please try again.");
      } finally {
        setPdfLoading(false);
      }
    };

    const handleCategoryFilter = (e) => {
      setCategoryFilter(e.target.value);
    };

    const clearFilter = () => {
      setCategoryFilter("");
    };

    if (!stats) {
      return (
        <div className="text-center py-8 text-gray-300">Loading reports...</div>
      );
    }

    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle size={20} className="mr-2" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-600 mb-3">
            Report Filters
          </h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Filter by Category
              </label>
              <select
                value={categoryFilter}
                onChange={handleCategoryFilter}
                className="bg-gray-100 text-gray px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                {stats.overview.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={clearFilter}
              className="bg-gray-100 border border-gray-500 hover:bg-gray-600 hover:text-gray-100 text-gray font-medium py-2 px-4 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-500/20 border border-blue-500 p-4 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="text-blue-500 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">
                  {stats.overview.totalItems}
                </div>
                <div className="text-blue-500 text-sm">Total Items</div>
              </div>
            </div>
          </div>

          <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">
                  {stats.overview.lowStockItems}
                </div>
                <div className="text-red-500 text-sm">Low Stock</div>
              </div>
            </div>
          </div>

          <div className="bg-green-500/20 border border-green-500 p-4 rounded-lg">
            <div className="flex items-center">
              <PieChart className="text-green-500 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">
                  {stats.overview.totalStockValue}
                </div>
                <div className="text-green-500 text-sm">Total Stock</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/20 border border-purple-500 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="text-purple-500 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">
                  {stats.summary.totalCategories}
                </div>
                <div className="text-purple-500 text-sm">Categories</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FileDown size={20} className="mr-2" />
            Export Reports
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={generatePDF}
              disabled={pdfLoading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-700 text-white font-medium py-3 px-4 rounded transition-colors flex items-center justify-center"
            >
              <FileText size={18} className="mr-2" />
              {pdfLoading ? "Generating..." : "PDF Report"}
            </button>

            <button
              onClick={generateCSV}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white font-medium py-3 px-4 rounded transition-colors flex items-center justify-center"
            >
              <Download size={18} className="mr-2" />
              {loading ? "Exporting..." : "CSV Export"}
            </button>

            <button
              onClick={() => window.print()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded transition-colors flex items-center justify-center"
            >
              <BarChart3 size={18} className="mr-2" />
              Print Summary
            </button>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">
            Stock by Category
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.byCategory.map((category) => (
              <div key={category._id} className="bg-gray-600 p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">{category._id}</span>
                  <span className="text-sm text-gray-300">
                    {category.itemCount} items
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">
                    {category.totalStock} in stock
                  </span>
                  {category.lowStockCount > 0 && (
                    <span className="text-red-400">
                      {category.lowStockCount} low
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <span className="ml-3 text-lg">Loading inventory data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <h1 className="text-3xl font-bold mb-1 text-gray-600">
            Inventory Management
          </h1>
        </div>
        <p className="text-gray-500 text-sm">
          Smart inventory tracking and management
        </p>
      </div>
      <div className="flex border-b border-gray-300 mb-6">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-6 py-3 font-medium ${
            activeTab === "inventory"
              ? "text-blue-600 border-b-4 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Inventory
        </button>

        <button
          onClick={() => setActiveTab("suppliers")}
          className={`px-6 py-3 font-medium ${
            activeTab === "suppliers"
              ? "text-blue-600 border-b-4 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Suppliers
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-6 py-3 font-medium ${
            activeTab === "orders"
              ? "text-blue-600 border-b-4 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab("deliveries")}
          className={`px-6 py-3 font-medium ${
            activeTab === "deliveries"
              ? "text-blue-600 border-b-4 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Deliveries
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`px-6 py-3 font-medium ${
            activeTab === "drivers"
              ? "text-blue-600 border-b-4 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Driver Management
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === "inventory" && (
          <>
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                <div className="flex items-center">
                  <AlertCircle size={20} className="mr-2" />
                  <span className="flex-1">{error}</span>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-300 text-lg ml-2"
                >
                  ×
                </button>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                <div className="flex items-center">
                  <Package size={20} className="mr-2" />
                  <span className="flex-1">{success}</span>
                </div>
                <button
                  onClick={() => setSuccess("")}
                  className="text-green-400 hover:text-green-300 text-lg ml-2"
                >
                  ×
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-100 rounded-lg p-4 text-center border-2 border-blue-500 hover:bg-blue-200 hover:border-2 transition-colors">
                <div className="flex items-center justify-center mb-2">
                  <Package className="text-blue-600 mr-2" size={24} />
                  <h3 className="font-medium text-gray-600">Total Items</h3>
                </div>
                <p className="text-2xl text-blue-600 font-bold">{totalItems}</p>
              </div>

              <div className="bg-gray-100 rounded-lg p-4 text-center border-2 border-red-500 hover:bg-red-200 transition-colors">
                <div className="flex items-center justify-center mb-2">
                  <AlertCircle className="text-red-500 mr-2" size={24} />
                  <h3 className="font-medium text-gray-600">Low Stock</h3>
                </div>
                <p className="text-2xl text-red-500 font-bold">
                  {lowStockItems}
                </p>
              </div>

              <div className="bg-gray-100 rounded-lg p-4 text-center border-2 border-green-500 hover:bg-green-200 transition-colors">
                <div className="flex items-center justify-center mb-2">
                  <Layers className="text-green-500 mr-2" size={24} />
                  <h3 className="font-medium text-gray-600">Categories</h3>
                </div>
                <p className="text-2xl text-green-500 font-bold">
                  {categories.length}
                </p>
              </div>

              <div className="bg-gray-100 rounded-lg p-4 text-center border-2 border-yellow-500 hover:bg-yellow-200 transition-colors">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="text-yellow-400 mr-2" size={24} />
                  <h3 className="font-medium text-gray-600">Total Stock</h3>
                </div>
                <p className="text-2xl text-yellow-400 font-bold">
                  {totalStockValue}
                </p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-6 mb-6 border border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                  <Filter size={20} className="mr-2" />
                  Filters & Actions
                </h3>

                <div className="flex gap-2">
                  {(filters.category || filters.lowStock || filters.search) && (
                    <button
                      onClick={clearFilters}
                      className="bg-white hover:bg-gr text-gray-600 font-bold py-2 px-4 rounded transition-colors text-sm flex items-center"
                    >
                      <X size={16} className="mr-1" />
                      Clear Filters
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditingItem(null);
                      setShowForm(!showForm);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center"
                  >
                    <Plus size={20} className="mr-2" />
                    {showForm ? "Cancel" : "Add New Item"}
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search
                        size={18}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search items by name, SKU, or description..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleSearch();
                          }
                        }}
                        className="w-full bg-gray-100 text-gray pl-10 pr-4 py-2 rounded border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center whitespace-nowrap"
                    >
                      <Search size={18} className="mr-2" />
                      Search
                    </button>
                    {filters.search && (
                      <button
                        onClick={handleClearSearch}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center whitespace-nowrap"
                      >
                        <X size={18} className="mr-2" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-gray-500 text-sm font-medium whitespace-nowrap">
                    Category:
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                    className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center space-x-2 text-gray-500">
                  <input
                    type="checkbox"
                    checked={filters.lowStock}
                    onChange={(e) =>
                      handleFilterChange("lowStock", e.target.checked)
                    }
                    className="rounded bg-gray-600 border-gray-500 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm whitespace-nowrap">
                    Show Low Stock Only
                  </span>
                </label>
              </div>

              {showForm && (
                <form
                  onSubmit={editMode ? handleUpdateItem : handleCreateItem}
                  className="mt-6 p-4 bg-white rounded-lg border border-gray-600"
                >
                  <h4 className="text-lg font-semibold text-gray mb-4 flex items-center">
                    <Package size={20} className="mr-2" />
                    {editMode
                      ? "Edit Inventory Item"
                      : "Add New Inventory Item"}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm mb-2 font-medium">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter item name"
                        value={newItem.name}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm mb-2 font-medium">
                        Category *
                      </label>
                      <select
                        value={newItem.category}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Seed">Seed</option>
                        <option value="Fertilizer">Fertilizer</option>
                        <option value="Tool">Tool</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Pesticide">Pesticide</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm mb-2 font-medium">
                        Current Stock *
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Current stock quantity"
                        value={newItem.currentStock}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            currentStock: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm mb-2 font-medium">
                        Min Stock Level *
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Minimum stock level"
                        value={newItem.minStockLevel}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            minStockLevel: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm mb-2 font-medium">
                        Max Stock Level *
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Maximum stock level"
                        value={newItem.maxStockLevel}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            maxStockLevel: parseInt(e.target.value) || 100,
                          }))
                        }
                        className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm mb-2 font-medium">
                        Unit of Measure *
                      </label>
                      <select
                        value={newItem.unitOfMeasure}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            unitOfMeasure: e.target.value,
                          }))
                        }
                        className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                        required
                      >
                        <option value="units">Units</option>
                        <option value="kg">Kilograms</option>
                        <option value="g">Grams</option>
                        <option value="liters">Liters</option>
                        <option value="packs">Packs</option>
                        <option value="boxes">Boxes</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex text-gray-600 text-sm mb-2 font-medium items-center">
                        <Users size={16} className="mr-2" />
                        Supplier *
                        {suppliersLoading && (
                          <span className="ml-2 text-xs text-yellow-400">
                            (Loading...)
                          </span>
                        )}
                      </label>

                      {suppliersLoading ? (
                        <div className="w-full bg-gray-200 text-gray-500 px-3 py-2 rounded border border-gray-500">
                          <span className="text-gray-400">
                            Loading suppliers...
                          </span>
                        </div>
                      ) : suppliers.length > 0 ? (
                        <select
                          value={newItem.supplierId}
                          onChange={(e) =>
                            setNewItem((prev) => ({
                              ...prev,
                              supplierId: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                          required
                        >
                          <option value="">Select a Supplier</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier._id} value={supplier._id}>
                              {supplier.name ||
                                supplier.companyName ||
                                `Supplier ${supplier._id}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-3 py-2 rounded">
                          <div className="flex items-center">
                            <AlertCircle size={16} className="mr-2" />
                            <span className="text-sm">
                              No suppliers available.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-600 text-sm mb-2 font-medium">
                        Description
                      </label>
                      <textarea
                        placeholder="Item description (optional)"
                        value={newItem.description}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full bg-gray-200 text-gray-500 px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors resize-none"
                        rows="3"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition-colors flex items-center"
                    >
                      <Plus size={16} className="mr-2" />
                      {editMode ? "Update Item" : "Create Item"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-gray-100 rounded-lg p-6 mb-6 border-2 border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-600">
                  Inventory Items ({filteredItems.length})
                </h2>
                <span className="text-gray-450 text-sm">
                  {filters.lowStock && "Low Stock • "}
                  {filters.category && `${filters.category} • `}
                  {filters.search && `"${filters.search}" • `}
                  Showing {filteredItems.length} of {items.length} items
                </span>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">No items found</p>
                  <p className="text-gray-500 text-sm">
                    {filters.category || filters.lowStock || filters.search
                      ? "Try changing your filters"
                      : "Add your first item to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <InventoryDisplay
                      key={item._id}
                      data={item}
                      suppliers={suppliers}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray">
                Reports & Analytics
              </h2>
              <ReportGenerator />
            </div>
          </>
        )}

        {activeTab === "suppliers" && <SupplierManagement />}
        
        {activeTab === "orders" && <OrderManagement />}

        {activeTab === "deliveries" && <DeliveryManagement />}

        {activeTab === "drivers" && <DriverManagement/>}
      </div>
    </div>
  );
}

export default InventoryManagement;