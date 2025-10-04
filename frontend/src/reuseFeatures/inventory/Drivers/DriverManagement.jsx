import React, { useEffect, useState } from "react";
import axios from "axios";
import DriverDataDisplay from "../itemDataDisplay/DriverDataDisplay";

const API_URL = "http://localhost:5000/api/drivers";

function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [newDriver, setNewDriver] = useState({
    name: "",
    phone: "",
    email: "",
    vehicleInfo: "",
    licenseNumber: "",
    address: "",
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(API_URL);

      const driversData = response.data.drivers || response.data || [];
      setDrivers(driversData);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setError(
        "Failed to load drivers. Please check if the server is running."
      );
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchDrivers();//refres
    } catch (err) {
      console.error("Error deleting driver:", err);
      setError("Failed To delete driver");
    }
  };

  const handleEdit = async (id, updatedData) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, updatedData);
      fetchDrivers(); //
    } catch (err) {
      console.error("Error updating driver:", err);
      setError("Failed to update driver");
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const response = await axios.post(API_URL, newDriver);

      const createdDriver = response.data.driver || response.data;

      if (createdDriver) {
        setDrivers(prev => [createdDriver, ...prev]);
        setNewDriver({
          name: "",
          phone: "",
          email: "",
          vehicleInfo: "",
          licenseNumber: "",
          address: ""
        });
        setShowForm(false);
      } else {
        setError("Unexpected response from server");
      }
    } catch (err) {
      console.error("Error creating driver:", err);

      if (err.response?.data?.error === 'DUPLICATE_LICENSE') {
        setError("License number already exists. Please use a unique license number.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to create driver. Please check your connection.");
      }
    }
  };
  //validate driver
  const validateDriver = (driver) => {
    const errors = [];
    if (!driver.name.trim()) errors.push("Name is required");
    if (!driver.phone.trim()) errors.push("Phone is required");
    if (!driver.email.trim()) errors.push("Email is required");
    if (!driver.vehicleInfo.trim()) errors.push("Vehicle info is required");
    if (!driver.licenseNumber.trim()) errors.push("License number is required e.g.:GN000");

    if (driver.email && !/\S+@\S+\.\S+/.test(driver.email)) {
      errors.push("Valid email is required");
    }

    return errors;
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <span className="ml-2">Loading drivers...</span>
          </div>
        </div>
      </div>
    );
  }

  const activeDrivers = drivers.filter((d) => d.isActive).length;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className=" mb-8">
          <div className="flex items-center space-x-3 mb-4">

            <h1 className="text-3xl font-bold text-white mb-1">
              Driver Management
            </h1>

          </div>
          <p className="text-gray-400 text-sm">
            Driver and logistics partner management
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
            <h3 className="font-medium text-white">Total Drivers</h3>
            <p className="text-2xl text-blue-400">{drivers.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
            <h3 className="font-medium text-white">Active Drivers</h3>
            <p className="text-2xl text-green-400">{activeDrivers}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
            <h3 className="font-medium text-white">Available Vehicles</h3>
            <p className="text-2xl text-yellow-400">{activeDrivers}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-gray-300">
              Manage your delivery drivers and logistics partners
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {showForm ? 'Cancel' : 'Add New Driver'}
            </button>
          </div>

          {/* Create Driver Form */}
          {showForm && (
            <form onSubmit={handleCreateDriver} className="mt-4 p-4 bg-gray-700 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Name *</label>
                  <input
                    type="text"
                    value={newDriver.name}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-green-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-green-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Email *</label>
                  <input
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-green-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">License Number *</label>
                  <input
                    type="text"
                    placeholder="GN000"
                    value={newDriver.licenseNumber}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-green-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Vehicle Info *</label>
                  <input
                    type="text"
                    value={newDriver.vehicleInfo}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, vehicleInfo: e.target.value }))}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-green-400 focus:outline-none"
                    placeholder="e.g., Toyota Hilux - ABC123"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Address</label>
                  <textarea
                    value={newDriver.address}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-green-400 focus:outline-none"
                    rows="2"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Add Driver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Drivers List */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              Drivers ({drivers.length})
            </h2>
            <button
              onClick={fetchDrivers}
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm py-1 px-3 rounded transition-colors"
            >
              Refresh
            </button>
          </div>

          {drivers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">No drivers found</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Add Your First Driver
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {drivers.map((driver) => (
                <DriverDataDisplay
                  key={driver._id}
                  data={driver}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriverManagement;
