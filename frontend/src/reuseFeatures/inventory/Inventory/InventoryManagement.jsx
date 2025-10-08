import React, { useEffect, useState } from "react";
import axios from "axios";
import InventoryDisplay from "../../../Components/inventory/itemDataDisplay/InventoryDisplay";
import ReportGenerator from "../Report/ReportGenerator";
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
} from "lucide-react";

const API_URL = "http://localhost:5001/api/items";
const SUPPLIERS_API_URL = "http://localhost:5001/api/suppliers";

function InventoryManagement() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    lowStock: false,
    search: "",
  });
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
  }, [filters]);

  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      console.log("Fetching suppliers from:", SUPPLIERS_API_URL);

      const response = await axios.get(SUPPLIERS_API_URL);
      console.log("Suppliers API response:", response.data);

      if (response.data.success) {
        const suppliersData =
          response.data.suppliers || response.data.data || [];
        setSuppliers(suppliersData || []);

        if (!suppliersData || suppliersData.length === 0) {
          console.log("No suppliers found in response");
        }
      } else {
        console.error(
          "Suppliers API returned success: false",
          response.data.message
        );
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.lowStock) params.append("lowStock", "true");
      if (filters.search) params.append("search", filters.search);

      const response = await axios.get(`${API_URL}?${params}`);
      console.log("Items response:", response.data);

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
    console.log("Editing item:", item);
    setEditMode(true);
    setEditingItem(item);

    // Extract supplier ID properly - handle both populated and non-populated supplier data
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

      // Check if editingItem is defined and has an _id
      if (!editingItem || !editingItem._id) {
        setError("Cannot update: Item ID is missing");
        return;
      }

      console.log("Updating item:", editingItem._id, "with data:", newItem);

      const response = await axios.put(
        `${API_URL}/${editingItem._id}`,
        newItem
      );

      console.log("Update response:", response.data);

      if (response.data.success) {
        fetchItems(); // Refresh the items list
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
      console.log(" Creating item with data:", newItem);

      const response = await axios.post(API_URL, newItem);
      
      console.log(" Backend response:", response.data);
      
      if (response.data.success) {
        const createdItem = response.data.item || response.data.data;

        if (!createdItem) {
          console.error(" No item data in response:", response.data);
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
      console.error("Error response data:", err.response?.data);

      if (err.response?.data?.message) {
        if (err.response.data.errors) {
        setError(`${err.response.data.message}: ${err.response.data.errors.join(', ')}`);
        } else {
        setError(err.response.data.message);
        }
      } else if (err.response?.data?.errors) {
      setError(`Validation errors: ${err.response.data.errors.join(', ')}`);
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
  };

  const getUniqueCategories = () => {
    return [...new Set(items.map((item) => item.category).filter(Boolean))];
  };

  const categories = getUniqueCategories();
  const totalItems = items.length;
  const lowStockItems = items.filter(
    (item) => item.currentStock <= item.minStockLevel
  ).length;
  const totalStockValue = items.reduce(
    (sum, item) => sum + (item.currentStock || 0),
    0
  );

  const filteredItems = items.filter((item) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        (item.description &&
          item.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

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
      <div className="max-w-6xl mx-auto">
        {/* Notifications */}
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

        {/* Header */}
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

        {/* Summary Cards */}
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
            <p className="text-2xl text-red-500 font-bold">{lowStockItems}</p>
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

        {/* Filters and Actions */}
        <div className="bg-gray-100 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-700
             flex items-center">
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
            {/* Search Filter */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search items by name, SKU, or description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full bg-gray-100 text-gray pl-10 pr-4 py-2 rounded border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-500 text-sm font-medium whitespace-nowrap">
                Category:
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
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

            {/* Low Stock Filter */}
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

          {/* Add/Edit Item Form */}
          {showForm && (
            <form
              onSubmit={editMode ? handleUpdateItem : handleCreateItem}
              className="mt-6 p-4 bg-white rounded-lg border border-gray-600"
            >
              <h4 className="text-lg font-semibold text-gray mb-4 flex items-center">
                <Package size={20} className="mr-2" />
                {editMode ? "Edit Inventory Item" : "Add New Inventory Item"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <div>
                  <label className="block text-gray-600 text-sm mb-2 font-medium">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter item name"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                    required
                  />
                </div>

                {/* Category Field */}
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
                    className="w-full bg-gray-100 text-gray-500
                     px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
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

                {/* Current Stock Field */}
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

                {/* Min Stock Level */}
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

                {/* Max Stock Level */}
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

                {/* Unit of Measure Field */}
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

                {/* Single Supplier Selection Field */}
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
                        <span className="text-sm">No suppliers available.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
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

        {/* Items List */}
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

        {/* Reports Section */}
        <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray">
            Reports & Analytics
          </h2>
          <ReportGenerator items={items} />
        </div>
      </div>
    </div>
  );
}

export default InventoryManagement;