import React, { useEffect, useState } from "react";
import axios from "axios";
import OrderDataDisplay from "../../../Components/inventory/itemDataDisplay/OrderDataDisplay";

const API_URL = "http://localhost:5000/api/orders";

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  //new order form state
  const [newOrder, setNewOrder] = useState({
    supplierId: "",
    items: [{ itemId: "", quantity: 1, unitPrice: 0 }],
    totalAmount: 0,
    status: "Draft",
    expectedDelivery: ""
  });

  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchInventoryItems();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await axios.get(`${API_URL}${params}`);
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
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

  const fetchInventoryItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/items");
      setInventoryItems(response.data.items || []);
    } catch (err) {
      console.error("Error fetching inventory items:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchOrders();
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  const handleEdit = (id) => {
    console.log("Edit order:", id);
    
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/${id}`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      //calculate total amount
      const total = newOrder.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const orderData = {
        ...newOrder,
        totalAmount: total,
        orderDate: new Date().toISOString()
      };

      const response = await axios.post(API_URL, orderData);
      setOrders(prev => [response.data.order, ...prev]);
      setNewOrder({
        supplierId: "",
        items: [{ itemId: "", quantity: 1, unitPrice: 0 }],
        totalAmount: 0,
        status: "Draft",
        expectedDelivery: ""
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error creating order:", err);
    }
  };

  const addItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { itemId: "", quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setNewOrder(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });
  };

  if (loading) {
    return (
      <div className="p-6 text-white">
        <p>Loading purchase orders...</p>
      </div>
    );
  }

  const statusCounts = {
    Draft: orders.filter(o => o.status === 'Draft').length,
    Sent: orders.filter(o => o.status === 'Sent').length,
    Confirmed: orders.filter(o => o.status === 'Confirmed').length,
    Received: orders.filter(o => o.status === 'Received').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length
  };

  const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray">
        Order Management
        </h1>
        <p className="text-gray-600 text-sm mb-6">
            Smarter Odering System and tracking
          </p>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-red-400">
            <h3 className="font-medium text-gray">Draft</h3>
            <p className="text-2xl text-red-400">{statusCounts.Draft}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-blue-400">
            <h3 className="font-medium text-gray">Sent</h3>
            <p className="text-2xl text-blue-400">{statusCounts.Sent}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-green-400">
            <h3 className="font-medium text-gray">Confirmed</h3>
            <p className="text-2xl text-green-400">{statusCounts.Confirmed}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-purple-400">
            <h3 className="font-medium text-gray">Received</h3>
            <p className="text-2xl text-purple-400">{statusCounts.Received}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-yellow-400">
            <h3 className="font-medium text-gray">Total Value</h3>
            <p className="text-2xl text-yellow-400">LKR{totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-gray-400">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-100 text-gray px-3 py-2 rounded border border-gray-500"
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {showForm ? 'Cancel' : 'Create New PO'}
            </button>
          </div>

          {/* Create Order Form */}
          {showForm && (
            <form onSubmit={handleCreateOrder} className="mt-4 p-4 bg-white rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-2">Supplier *</label>
                  <select
                    value={newOrder.supplierId}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-600 px-3 py-2 rounded border border-gray-400"
                    required
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
                  <label className="block text-gray-700 text-sm mb-2">Expected Delivery</label>
                  <input
                    type="date"
                    value={newOrder.expectedDelivery}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-600 px-3 py-2 rounded border border-gray-400"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm mb-2">Items, Quantity  and Unit Price *</label>
                {newOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <select
                      value={item.itemId}
                      onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                      className="flex-1 bg-gray-50 text-gray-600 px-3 py-2 rounded border border-gray-400"
                      required
                    >
                      <option value="">Select Item</option>
                      {inventoryItems.map(item => (
                        <option key={item._id} value={item._id}>
                          {item.name} - Stock: {item.currentStock}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      className="w-20 bg-gray-50 text-gray-600 px-3 py-2 rounded border border-gray-400"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                      className="w-24 bg-gray-50 text-gray-600 px-3 py-2 rounded border border-gray-400"
                      step="0.01"
                      min="0"
                      placeholder="Price"
                      required
                    />
                    {newOrder.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                >
                  + Add Item
                </button>
              </div>

              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Create Purchase Order
              </button>
            </form>
          )}
        </div>

        {/* Orders List */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray">
            Purchase Orders ({orders.length})
          </h2>
          
          {orders.length === 0 ? (
            <p className="text-gray-600">No purchase orders found</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderDataDisplay
                  key={order._id}
                  data={order}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderManagement;