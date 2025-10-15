import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";

const API_URL = "http://localhost:5001/api/deliveries";

function DeliveryManagement() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: "", driverId: "" });
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newDelivery, setNewDelivery] = useState({
    _id: "", // for editing
    associatedOrderId: "",
    dropoffAddress: "",
    scheduledDeliveryTime: "",
    assignedDriverId: "",
    notes: "",
  });

  useEffect(() => {
    fetchDeliveries();
    fetchDrivers();
    fetchOrders();
  }, [filters]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.driverId) params.append("driverId", filters.driverId);

      const response = await axios.get(`${API_URL}?${params}`);
      setDeliveries(response.data.deliveries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/drivers");
      setDrivers(response.data.drivers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/orders");
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/${id}/status`, { status });
      fetchDeliveries();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchDeliveries();
    } catch (err) {
      console.error(err);
    }
  };

  // create & update
  const handleSaveDelivery = async (e) => {
    e.preventDefault();
    try {
      const deliveryData = {
        associatedOrderId: newDelivery.associatedOrderId,
        dropoffAddress: newDelivery.dropoffAddress,
        scheduledDeliveryTime: new Date(newDelivery.scheduledDeliveryTime), // Convert to Date object
        assignedDriverId: newDelivery.assignedDriverId,
        status: "Scheduled", // Always set to Scheduled for new deliveries
        notes: newDelivery.notes || "",
      };

      if (newDelivery._id) {
        await axios.put(`${API_URL}/${newDelivery._id}`, deliveryData);
      } else {
        const response = await axios.post(API_URL, deliveryData);
        setDeliveries((prev) => [response.data.delivery, ...prev]);
      }
      setNewDelivery({
        _id: "",
        associatedOrderId: "",
        dropoffAddress: "",
        scheduledDeliveryTime: "",
        assignedDriverId: "",
        notes: "",
      });
      setShowForm(false);
      fetchDeliveries();
    } catch (err) {
      console.error("Error saving delivery:", err);
      alert(`Failed to save delivery: ${err.response?.data?.message || err.message}`);
    }
  };

  // Populate form for editing
  const handleEditDelivery = (id) => {
    const delivery = deliveries.find((d) => d._id === id);
    if (!delivery) return;

    setNewDelivery({
      _id: delivery._id,
      associatedOrderId: delivery.associatedOrderId._id,
      dropoffAddress: delivery.dropoffAddress,
      scheduledDeliveryTime: moment(delivery.scheduledDeliveryTime).format(
        "YYYY-MM-DDTHH:mm"
      ),
      assignedDriverId: delivery.assignedDriverId?._id || "",
      notes: delivery.notes || "",
    });

    setShowForm(true);
  };

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 p-6 text-white">
        Loading deliveries...
      </div>
    );

  const statusCounts = {
    Scheduled: deliveries.filter((d) => d.status === "Scheduled").length,
    "Picked Up": deliveries.filter((d) => d.status === "Picked Up").length,
    "In Transit": deliveries.filter((d) => d.status === "In Transit").length,
    Delivered: deliveries.filter((d) => d.status === "Delivered").length,
    Delayed: deliveries.filter((d) => d.status === "Delayed").length,
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div
              key={status}
              className="bg-gray-100 rounded-lg p-4 text-center border-2 border-blue-500"
            >
              <h3 className="font-medium text-gray">{status}</h3>
              <p className="text-2xl text-blue-500">{count}</p>
            </div>
          ))}
        </div>

        {/* Filters & Actions */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-green-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="bg-gray-100 text-gray px-3 py-2 rounded border border-gray-600"
              >
                <option value="">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Picked Up">Picked Up</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Delayed">Delayed</option>
              </select>

              <select
                value={filters.driverId}
                onChange={(e) => handleFilterChange("driverId", e.target.value)}
                className="bg-gray-100 text-gray px-3 py-2 rounded border border-gray-600"
              >
                <option value="">All Drivers</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {showForm
                ? "Cancel"
                : newDelivery._id
                ? "Edit Delivery"
                : "Create Delivery"}
            </button>
          </div>

          {/* Delivery Form */}
          {showForm && (
            <form
              onSubmit={handleSaveDelivery}
              className="mt-4 p-4 bg-gray-100 rounded"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-800 text-sm mb-2">
                    Purchase Order *
                  </label>
                  <select
                    value={newDelivery.associatedOrderId}
                    onChange={(e) =>
                      setNewDelivery((prev) => ({
                        ...prev,
                        associatedOrderId: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-50 text-gray px-3 py-2 rounded border border-gray-500"
                    required
                  >
                    <option value="">Select PO</option>
                    {orders.map((order) => (
                      <option key={order._id} value={order._id}>
                        {order.poNumber} - LKR{order.totalAmount}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-800 text-sm mb-2">
                    Driver *
                  </label>
                  <select
                    value={newDelivery.assignedDriverId}
                    onChange={(e) =>
                      setNewDelivery((prev) => ({
                        ...prev,
                        assignedDriverId: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-50 text-gray px-3 py-2 rounded border border-gray-500"
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-800 text-sm mb-2">
                    Dropoff Address *
                  </label>
                  <textarea
                    value={newDelivery.dropoffAddress}
                    onChange={(e) =>
                      setNewDelivery((prev) => ({
                        ...prev,
                        dropoffAddress: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-50 text-gray px-3 py-2 rounded border border-gray-500"
                    required
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-gray-800 text-sm mb-2">
                    Scheduled Delivery *
                  </label>
                  <input
                    type="datetime-local"
                    value={newDelivery.scheduledDeliveryTime}
                    onChange={(e) =>
                      setNewDelivery((prev) => ({
                        ...prev,
                        scheduledDeliveryTime: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-50 text-gray px-3 py-2 rounded border border-gray-500"
                    required
                     min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-800 text-sm mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newDelivery.notes}
                    onChange={(e) =>
                      setNewDelivery((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-50 text-gray px-3 py-2 rounded border border-gray-500"
                    rows="2"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                {newDelivery._id ? "Update Delivery" : "Create Delivery"}
              </button>
            </form>
          )}
        </div>

        {/* Delivery List */}
        <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray">
            Deliveries ({deliveries.length})
          </h2>
          {deliveries.length === 0 ? (
            <p className="text-gray-600">No deliveries found</p>
          ) : (
            <div className="space-y-4">
              {deliveries.map((d) => (
                <DeliveryDataDisplay
                  key={d._id}
                  data={d}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDelete}
                  onEdit={handleEditDelivery}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div className={`mb-3 p-4 bg-gray-50 rounded-lg text-gray-800 border-l-4 ${getStatusColor(status)}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-500">{deliveryNumber}</h3>
          <p className="text-gray-600 text-sm">
            PO: {associatedOrderId?.poNumber || 'N/A'} • 
            Driver: {assignedDriverId?.name || 'Unassigned'}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
          <p className="text-gray-800 text-sm mt-1">{formatDate(scheduledDeliveryTime)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
        <div></div>
        <div className="space-y-2">
          <div>
            <strong className="text-gray-800">Dropoff:</strong>
            <p className="text-gray-700">{formatAddress(dropoffAddress)}</p>
          </div>
          <div>
            <strong className="text-gray-800">Scheduled Delivery:</strong>
            <p className="text-gray-700">{formatDate(scheduledDeliveryTime)}</p>
          </div>
          {actualDeliveryTime && (
            <div>
              <strong className="text-gray-800">Actual Delivery:</strong>
              <p className="text-gray-700">{formatDate(actualDeliveryTime)}</p>
            </div>
          )}
        </div>
      </div>

      {geolocation && (
        <div className="mb-3 p-2 bg-gray-600/30 rounded">
          <strong className="text-gray-800 text-sm">Last Location:</strong>
          <p className="text-gray-700 text-sm">
            Lat: {geolocation.lat}, Lng: {geolocation.lng}
          </p>
        </div>
      )}

      {notes && (
        <div className="mb-3">
          <strong className="text-gray-800 text-sm">Notes:</strong>
          <p className="text-gray-700 text-sm">{notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-500">
        <div className="flex space-x-2">
          {status === 'Scheduled' && (
            <button
              onClick={() => onUpdateStatus(_id, 'Picked Up')}
              className="bg-purple-500 hover:bg-purple-600 text-gray-600 font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Mark Picked Up
            </button>
          )}
          {status === 'Picked Up' && (
            <button
              onClick={() => onUpdateStatus(_id, 'In Transit')}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-600 font-bold py-1 px-3 rounded text-xs transition-colors"
            >
              Mark In Transit
            </button>
          )}
          {status === 'In Transit' && (
            <button
              onClick={() => onUpdateStatus(_id, 'Delivered')}
              className="bg-green-500 hover:bg-green-600 text-gray-600 font-bold py-1 px-3 rounded text-xs transition-colors"
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

export default DeliveryManagement;