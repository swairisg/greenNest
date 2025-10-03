import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import DeliveryDataDisplay from "../itemDataDisplay/DeliveryDataDisplay";

const API_URL = "http://localhost:5000/api/deliveries";

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
    notes: ""
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
      if (filters.status) params.append('status', filters.status);
      if (filters.driverId) params.append('driverId', filters.driverId);

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
      const response = await axios.get("http://localhost:5000/api/drivers");
      setDrivers(response.data.drivers || []);
    } catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/orders");
      setOrders(response.data.orders || []);
    } catch (err) { console.error(err); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/${id}/status`, { status });
      fetchDeliveries();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchDeliveries();
    } catch (err) { console.error(err); }
  };

  // Handle both create & update
  const handleSaveDelivery = async (e) => {
    e.preventDefault();
    try {
      if (newDelivery._id) {
        await axios.put(`${API_URL}/${newDelivery._id}`, newDelivery);
      } else {
        const response = await axios.post(API_URL, newDelivery);
        setDeliveries(prev => [response.data.delivery, ...prev]);
      }
      setNewDelivery({
        _id: "",
        associatedOrderId: "",
        dropoffAddress: "",
        scheduledDeliveryTime: "",
        assignedDriverId: "",
        notes: ""
      });
      setShowForm(false);
      fetchDeliveries();
    } catch (err) { console.error(err); }
  };

  // Populate form for editing
  const handleEditDelivery = (id) => {
    const delivery = deliveries.find(d => d._id === id);
    if (!delivery) return;

    setNewDelivery({
      _id: delivery._id,
      associatedOrderId: delivery.associatedOrderId._id,
      dropoffAddress: delivery.dropoffAddress,
      scheduledDeliveryTime: moment(delivery.scheduledDeliveryTime).format('YYYY-MM-DDTHH:mm'),
      assignedDriverId: delivery.assignedDriverId?._id || "",
      notes: delivery.notes || ""
    });

    setShowForm(true);
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  if (loading) return <div className="min-h-screen bg-gray-900 p-6 text-white">Loading deliveries...</div>;

  const statusCounts = {
    Scheduled: deliveries.filter(d => d.status === 'Scheduled').length,
    'Picked Up': deliveries.filter(d => d.status === 'Picked Up').length,
    'In Transit': deliveries.filter(d => d.status === 'In Transit').length,
    Delivered: deliveries.filter(d => d.status === 'Delivered').length,
    Delayed: deliveries.filter(d => d.status === 'Delayed').length
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Delivery Management</h1>
          <p className="text-gray-400 text-sm">Logistics and delivery tracking system</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <h3 className="font-medium text-white">{status}</h3>
              <p className="text-2xl text-blue-400">{count}</p>
            </div>
          ))}
        </div>

        {/* Filters & Actions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap gap-4">
              <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
                <option value="">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Picked Up">Picked Up</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Delayed">Delayed</option>
              </select>

              <select value={filters.driverId} onChange={(e) => handleFilterChange('driverId', e.target.value)} className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
                <option value="">All Drivers</option>
                {drivers.map(driver => <option key={driver._id} value={driver._id}>{driver.name}</option>)}
              </select>
            </div>

            <button onClick={() => setShowForm(!showForm)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors">
              {showForm ? 'Cancel' : (newDelivery._id ? 'Edit Delivery' : 'Create Delivery')}
            </button>
          </div>

          {/* Delivery Form */}
          {showForm && (
            <form onSubmit={handleSaveDelivery} className="mt-4 p-4 bg-gray-700 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Purchase Order *</label>
                  <select value={newDelivery.associatedOrderId} onChange={(e) => setNewDelivery(prev => ({ ...prev, associatedOrderId: e.target.value }))} className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500" required>
                    <option value="">Select PO</option>
                    {orders.map(order => <option key={order._id} value={order._id}>{order.poNumber} - ${order.totalAmount}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Driver *</label>
                  <select value={newDelivery.assignedDriverId} onChange={(e) => setNewDelivery(prev => ({ ...prev, assignedDriverId: e.target.value }))} className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500" required>
                    <option value="">Select Driver</option>
                    {drivers.map(driver => <option key={driver._id} value={driver._id}>{driver.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Dropoff Address *</label>
                  <textarea value={newDelivery.dropoffAddress} onChange={(e) => setNewDelivery(prev => ({ ...prev, dropoffAddress: e.target.value }))} className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500" required rows="2"/>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Scheduled Delivery *</label>
                  <input type="datetime-local" value={newDelivery.scheduledDeliveryTime} onChange={(e) => setNewDelivery(prev => ({ ...prev, scheduledDeliveryTime: e.target.value }))} className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500" required/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm mb-2">Notes</label>
                  <textarea value={newDelivery.notes} onChange={(e) => setNewDelivery(prev => ({ ...prev, notes: e.target.value }))} className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500" rows="2"/>
                </div>
              </div>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">{newDelivery._id ? 'Update Delivery' : 'Create Delivery'}</button>
            </form>
          )}
        </div>

        {/* Delivery List */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-white">Deliveries ({deliveries.length})</h2>
          {deliveries.length === 0 ? (
            <p className="text-gray-300">No deliveries found</p>
          ) : (
            <div className="space-y-4">
              {deliveries.map(d => (
                <DeliveryDataDisplay key={d._id} data={d} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} onEdit={handleEditDelivery}/>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeliveryManagement;
