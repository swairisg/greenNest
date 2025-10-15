import React, { useEffect, useState } from "react";
import axios from "axios";
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
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
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
          <p className="text-gray-700 text-sm mt-1">LKR{(totalAmount || 0)?.toFixed(2)}</p>
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
                {item.itemId?.name || 'Item loading...'} × {item.quantity || 0}
              </span>
              <span className="text-gray-500">LKR{(item.unitPrice || 0)?.toFixed(2)} each</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-500">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(data)}
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

const API_URL = "http://localhost:5001/api/orders";

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  //new order form state
  const [newOrder, setNewOrder] = useState({
    supplierId: "",
    items: [{ itemId: "", quantity: null, unitPrice: null }],
    totalAmount: null,
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
      const response = await axios.get("http://localhost:5001/api/suppliers");
      setSuppliers(response.data.suppliers || []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/items");
      setInventoryItems(response.data.items || []);
    } catch (err) {
      console.error("Error fetching inventory items:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchOrders();
      } catch (err) {
        console.error("Error deleting order:", err);
      }
    }
  };

const handleEdit = (order) => {
  setIsEditing(true);
  setEditingOrder(order);

  const formattedExpectedDelivery = order.expectedDelivery 
    ? moment(order.expectedDelivery).format('YYYY-MM-DD')
    : '';

  setNewOrder({
    supplierId: order.supplierId?._id || order.supplierId || "",
    items: order.items.map(item => ({
      itemId: item.itemId?._id || item.itemId || "",
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0
    })),
    totalAmount: order.totalAmount || 0,
    status: order.status || "Draft",
    expectedDelivery: formattedExpectedDelivery
  });

  setShowForm(true);
};


 const handleUpdateOrder = async (e) => {
  e.preventDefault();

  try {
    const total = newOrder.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);

    const orderData = {
      ...newOrder,
      totalAmount: total,
      items: newOrder.items.map(item => ({
        itemId: item.itemId,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0
      }))
    };

    const response = await axios.put(`${API_URL}/${editingOrder._id}`, orderData);

    setOrders(prev => prev.map(order =>
      order._id === editingOrder._id ? response.data.order : order
    ));

    resetForm();
  } catch (err) {
    console.error("Error updating order:", err);
    alert("Failed to update order. Please check all fields.");
  }
};


const handleCreateOrder = async (e) => {
  e.preventDefault();

  try {
    const total = newOrder.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);

    const orderData = {
      ...newOrder,
      totalAmount: total,
      orderDate: new Date().toISOString(),
      items: newOrder.items.map(item => ({
        itemId: item.itemId,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0
      }))
    };

    const response = await axios.post(API_URL, orderData);

    setOrders(prev => [response.data.order, ...prev]);
    resetForm();
  } catch (err) {
    console.error("Error creating order:", err);
    alert("Failed to create order. Check all fields.");
  }
};


  const addItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { itemId: "", quantity: null, unitPrice: null }]
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
      
      if (field === 'quantity') {
        const numValue = value === '' ? 1 : Math.max(1, parseInt(value) || 1);
        updatedItems[index] = { ...updatedItems[index], [field]: numValue };
      } else if (field === 'unitPrice') {
        const numValue = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
        updatedItems[index] = { ...updatedItems[index], [field]: numValue };
      } else {
        updatedItems[index] = { ...updatedItems[index], [field]: value };
      }
      
      return { ...prev, items: updatedItems };
    });
  };

  const handleItemSelect = (index, itemId) => {
  const selectedItem = inventoryItems.find(item => item._id === itemId);
  if (selectedItem) {
    setNewOrder(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { 
        ...updatedItems[index], 
        itemId: itemId,
        unitPrice: selectedItem.unitPrice || 0
      };
      return { ...prev, items: updatedItems };
    });
  } else {
    updateItem(index, 'itemId', itemId);
  }
};


  const resetForm = () => {
    setNewOrder({
      supplierId: "",
      items: [{ itemId: "", quantity: 1, unitPrice: 0 }],
      totalAmount: 0,
      status: "Draft",
      expectedDelivery: ""
    });
    setShowForm(false);
    setIsEditing(false);
    setEditingOrder(null);
  };
   const cancelEdit = () => {
    resetForm();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/${id}`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
    }
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

  const currentTotal = newOrder.items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + (quantity * unitPrice);
  }, 0);
  
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        
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
                <label className="block text-gray-700 text-sm mb-2">Items, Quantity and Unit Price *</label>
                {newOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <select
                      value={item.itemId}
                      onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                      className="flex-1 bg-gray-50 text-gray-600 px-3 py-2 rounded border border-gray-400"
                      required
                    >
                      <option value="">Select Item</option>
                      {inventoryItems.map(invItem => (
                        <option key={invItem._id} value={invItem._id}>
                          {invItem.name} - Stock: {invItem.currentStock || 0}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-20 bg-gray-50 text-gray-600 px-3 py-2 rounded border border-gray-400"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
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

              <div className="mb-4 p-3 bg-gray-100 rounded">
                <strong className="text-gray-700">Total Amount: LKR{newOrder.items.reduce((sum, item) => {
                  const quantity = Number(item.quantity) || 0;
                  const unitPrice = Number(item.unitPrice) || 0;
                  return sum + (quantity * unitPrice);
                }, 0).toFixed(2)}</strong>
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