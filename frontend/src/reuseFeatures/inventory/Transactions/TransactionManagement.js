import React, { useEffect, useState } from "react";
import axios from "axios";
import TransactionDataDisplay from "../../../Components/inventory/itemDataDisplay/TransactionDataDisplay";

const API_URL = "http://localhost:5000/api/transactions";

function TransactionManagement() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [transactionType, setTransactionType] = useState("IN");
  const [filters, setFilters] = useState({
    itemId: "",
    transactionType: "",
    dateFrom: "",
    dateTo: ""
  });

  //
  const [newTransaction, setNewTransaction] = useState({
    itemId: "",
    quantity: "",
    supplierId: "",
    reason: "",
    batchNumber: "",
    relatedOrderId: ""
  });

  const [inventoryItems, setInventoryItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTransactions();
    fetchInventoryItems();
    fetchSuppliers();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.itemId) params.append('itemId', filters.itemId);
      if (filters.transactionType) params.append('transactionType', filters.transactionType);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await axios.get(`${API_URL}/logs?${params}`);
      setTransactions(response.data.logs || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/items");
      setInventoryItems(response.data.items || []);
    } catch (err) {
      console.error("Error fetching inventory items:", err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/suppliers");
      setSuppliers(response.data.suppliers || []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (window.confirm("Are you sure you want to delete this transaction?")) {
        await axios.delete(`${API_URL}/${id}`);
        fetchTransactions();
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("Failed to delete transaction");
    }
  };

  const handleNumberChange = (field, value) => {
    if (value === "" || value === null || value === undefined) {
      setNewTransaction(prev => ({ ...prev, [field]: "" }));
      return;
    }

  const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setNewTransaction(prev => ({ ...prev, [field]: numValue }));
    } else {
      setNewTransaction(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (!newTransaction.itemId) {
        setError("Please select an item");
        return;
      }
      
      if (!newTransaction.quantity || newTransaction.quantity <= 0) {
        setError("Please enter a valid quantity");
        return;
      }
      
      if (!newTransaction.reason) {
        setError("Please enter a reason for the transaction");
        return;
      }

      const endpoint = transactionType === "IN" ? `${API_URL}/in` : `${API_URL}/out`;

      const transactionData = {
        ...newTransaction,
        quantity: Number(newTransaction.quantity),
        transactionType: transactionType
      };

      console.log("🔄 Creating transaction:", transactionData);

      const response = await axios.post(endpoint, transactionData);

      setNewTransaction({
        itemId: "",
        quantity: "",
        supplierId: "",
        reason: "",
        batchNumber: "",
        relatedOrderId: ""
      });
      setShowForm(false);

      fetchTransactions();

    } catch (err) {
      console.error("Error creating transaction:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(", "));
      } else {
        setError("Failed to create transaction. Please try again.");
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading transactions...</span>
          </div>
        </div>
      </div>
    );
  }

  const inwardCount = transactions.filter(t => t.transactionType === "IN").length;
  const outwardCount = transactions.filter(t => t.transactionType === "OUT").length;
  const totalQuantity = transactions.reduce((sum, t) => sum + (t.quantity || 0), 0);

  return (
    <div className=" min-h-screen bg-white  p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray">
          Inventory Transactions
        </h1>
        <p className="text-gray-600 text-sm mb-4">
            Smart transaction tracking and management 
          </p>

          {/*error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError("")}
              className="mt-2 text-red-500 hover:text-red-700 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-100 rounded-lg p-4 text-center border-2 border-blue-500">
            <h3 className="font-medium text-gray-600">Total Transactions</h3>
            <p className="text-2xl text-blue-400">{transactions.length}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 text-center border-2 border-green-500">
            <h3 className="font-medium text-gray-600">Inward</h3>
            <p className="text-2xl text-green-400">{inwardCount}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 text-center border-2 border-red-500">
            <h3 className="font-medium text-gray-600">Outward</h3>
            <p className="text-2xl text-red-400">{outwardCount}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 text-center border-2 border-yellow-500">
            <h3 className="font-medium text-gray-600">Total Quantity</h3>
            <p className="text-2xl text-yellow-400">{totalQuantity}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-gray-100 rounded-lg p-6 mb-6 border-2 border-gray-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap gap-4">
              {/* Item Filter */}
              <select 
                value={filters.itemId}
                onChange={(e) => handleFilterChange('itemId', e.target.value)}
                className="bg-white text-gray px-3 py-2 rounded border border-gray-500"
              >
                <option value="">All Items</option>
                {inventoryItems.map(item => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>

              {/* Transaction Type Filter */}
              <select 
                value={filters.transactionType}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                className="bg-white text-gray px-3 py-2 rounded border border-gray-500"
              >
                <option value="">All Types</option>
                <option value="IN">Inward Only</option>
                <option value="OUT">Outward Only</option>
              </select>

              {/* Date Filters */}
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="bg-white text-gray px-3 py-2 rounded border border-gray-500"
                placeholder="From Date"
              />

              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="To Date"
              />
             
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setTransactionType("IN");
                  setShowForm(!showForm);
                  setError("");
                }}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Stock In
              </button>
              <button
                onClick={() => {
                  setTransactionType("OUT");
                  setShowForm(!showForm);
                  setError("");
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Stock Out
              </button>
            </div>
          </div>

          {/* Transaction Form */}
          {showForm && (
            <form onSubmit={handleCreateTransaction} className="mt-4 p-4 bg-gray-50 rounded border-2 border-gray-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-2">Item *</label>
                  <select
                    value={newTransaction.itemId}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, itemId: e.target.value }))}
                    className="w-full  text-gray-600 px-3 py-2 rounded border border-gray-400"
                    required
                  >
                    <option value="">Select Item</option>
                    {inventoryItems.map(item => (
                      <option key={item._id} value={item._id}>
                        {item.name} (Stock: {item.currentStock})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={newTransaction.quantity}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    className="w-full  text-gray-600 px-3 py-2 rounded border border-gray-400"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2">Supplier</label>
                  <select
                    value={newTransaction.supplierId}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="w-full text-gray-600 px-3 py-2 rounded border border-gray-400"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2">Reason *</label>
                  <input
                    type="text"
                    value={newTransaction.reason}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full  text-gray-600 px-3 py-2 rounded border border-gray-400"
                    placeholder="e.g., Restock, Sale, Adjustment"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2">Batch Number</label>
                  <input
                    type="text"
                    value={newTransaction.batchNumber}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, batchNumber: e.target.value }))}
                    className="w-full  text-gray-600 px-3 py-2 rounded border border-gray-400"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2">Related Order ID</label>
                  <input
                    type="text"
                    value={newTransaction.relatedOrderId}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, relatedOrderId: e.target.value }))}
                    className="w-full text-gray-600 px-3 py-2 rounded border border-gray-400"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className={`text-lg font-bold ${
                  transactionType === "IN" ? "text-green-400 " : "text-red-400"
                }`}>
                  {transactionType === "IN" ? "Stock Inward" : "Stock Outward"}
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`${
                      transactionType === "IN" 
                        ? "bg-green-500 hover:bg-green-600" 
                        : "bg-red-500 hover:bg-red-600"
                    } text-white font-bold py-2 px-4 rounded transition-colors`}
                  >
                    Record {transactionType === "IN" ? "Inward" : "Outward"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Transactions List */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray">
            Transaction History ({transactions.length})
          </h2>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions found</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <TransactionDataDisplay
                  key={transaction._id}
                  data={transaction}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionManagement;