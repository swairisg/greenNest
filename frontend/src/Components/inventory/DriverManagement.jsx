import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001/api/drivers";

// Driver card component
function DriverDataDisplay({ data, onToggleStatus, onEdit }) {
  const { _id, name, phone, email, vehicleInfo, licenseNumber, address, isActive } = data;

  return (
    <div className="mb-3 p-4 bg-white rounded-lg text-gray-800 border-l-4 border-l-green-400">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{name}</h3>
          <p className="text-gray-700 text-sm">{licenseNumber}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <strong className="text-gray-700">Contact:</strong>
            <p className="text-gray-800">{phone}</p>
          </div>
          <div>
            <strong className="text-gray-700">Email:</strong>
            <p className="text-gray-800 truncate">{email}</p>
          </div>
          <div>
            <strong className="text-gray-700">Vehicle:</strong>
            <p className="text-gray-800">{vehicleInfo}</p>
          </div>
        </div>

        <div className="space-y-2">
          {address && (
            <div>
              <strong className="text-gray-700">Address:</strong>
              <p className="text-gray-800 text-sm">{address}</p>
            </div>
          )}
          <div>
            <strong className="text-gray-700">Status:</strong>
            <p className="text-gray-800 mb-2">{isActive ? "Available" : "Not Available"}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center pt-3 border-t border-gray-500 space-x-2">
        <button
          onClick={() => onEdit(data)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onToggleStatus(_id)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
        >
          {isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

// Main DriverManagement component
function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

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
      setError("Failed to load drivers. Please check if the server is running.");
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  // Create driver
  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const response = await axios.post(API_URL, newDriver);
      const createdDriver = response.data.driver || response.data;

      if (createdDriver) {
        setDrivers((prev) => [createdDriver, ...prev]);
        setNewDriver({
          name: "",
          phone: "",
          email: "",
          vehicleInfo: "",
          licenseNumber: "",
          address: "",
        });
        setShowForm(false);
      } else {
        setError("Unexpected response from server");
      }
    } catch (err) {
      console.error("Error creating driver:", err);
      if (err.response?.data?.errors) {
        setError(`Validation errors: ${err.response.data.errors.join(", ")}`);
      } else if (err.response?.data?.message) {
        setError(`Server error: ${err.response.data.message}`);
      } else {
        setError("Failed to create driver. Please check your connection.");
      }
    }
  };

  // Toggle Active/Inactive
  const handleToggleStatus = async (id) => {
    try {
      const driver = drivers.find((d) => d._id === id);
      if (!driver) return;

      const updatedStatus = !driver.isActive;
      await axios.put(`${API_URL}/${id}`, { isActive: updatedStatus });
      setDrivers((prev) =>
        prev.map((d) => (d._id === id ? { ...d, isActive: updatedStatus } : d))
      );
    } catch (err) {
      console.error("Error toggling driver status:", err);
      setError("Failed to change driver status.");
    }
  };

  // Start editing driver
  const handleEdit = (driver) => {
    setEditingDriver(driver);
  };

  // Save edited driver
  const saveEdit = async () => {
    try {
      await axios.put(`${API_URL}/${editingDriver._id}`, editingDriver);
      fetchDrivers();
      setEditingDriver(null);
    } catch (err) {
      console.error("Error updating driver:", err);
      setError("Failed to update driver");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 text-white">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
          <span className="ml-2">Loading drivers...</span>
        </div>
      </div>
    );
  }

  const activeDrivers = drivers.filter((d) => d.isActive).length;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-blue-600">
            <h3 className="font-medium text-gray-700">Total Drivers</h3>
            <p className="text-2xl text-blue-500">{drivers.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-green-600">
            <h3 className="font-medium text-gray-700">Active Drivers</h3>
            <p className="text-2xl text-green-500">{activeDrivers}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-yellow-600">
            <h3 className="font-medium text-gray-700">Available Vehicles</h3>
            <p className="text-2xl text-yellow-500">{activeDrivers}</p>
          </div>
        </div>

        {/* Create Driver */}
        <div className="bg-gray-100 rounded-lg p-6 mb-6 border-2 border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-gray-700">Manage your delivery drivers and logistics partners</div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {showForm ? "Cancel" : "Add New Driver"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreateDriver} className="mt-4 p-4 bg-gray-100 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {["name", "phone", "email", "licenseNumber", "vehicleInfo"].map((field) => (
                  <div key={field}>
                    <label className="block text-gray-900 text-sm mb-2">
                      {field.charAt(0).toUpperCase() + field.slice(1)} *
                    </label>
                    <input
                      type={field === "email" ? "email" : "text"}
                      value={newDriver[field]}
                      onChange={(e) => setNewDriver((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full bg-white text-gray-800 px-3 py-2 rounded border border-gray-500 focus:border-green-400 focus:outline-none"
                      placeholder={field === "licenseNumber" ? "GN000" : ""}
                      required
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-900 text-sm mb-2">Address</label>
                  <textarea
                    value={newDriver.address}
                    onChange={(e) => setNewDriver((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full text-gray-900 bg-white px-3 py-2 rounded border border-gray-500 focus:border-green-400 focus:outline-none"
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
                  onClick={() => setShowForm(false)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Drivers List */}
        <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Drivers ({drivers.length})</h2>
            <button
              onClick={fetchDrivers}
              className="bg-red-600 hover:bg-gray-700 text-white text-sm py-1 px-3 rounded transition-colors"
            >
              Refresh
            </button>
          </div>

          {drivers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 mb-4">No drivers found</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Add Your First Driver
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-green-700 mb-2">Active Drivers</h3>
              <div className="space-y-4 mb-6">
                {drivers.filter((d) => d.isActive).map((driver) => (
                  <DriverDataDisplay
                    key={driver._id}
                    data={driver}
                    onToggleStatus={handleToggleStatus}
                    onEdit={handleEdit}
                  />
                ))}
              </div>

              <h3 className="text-lg font-semibold text-red-700 mb-2">Inactive Drivers</h3>
              <div className="space-y-4">
                {drivers.filter((d) => !d.isActive).map((driver) => (
                  <DriverDataDisplay
                    key={driver._id}
                    data={driver}
                    onToggleStatus={handleToggleStatus}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Driver</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveEdit();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {["name", "phone", "email", "vehicleInfo", "licenseNumber"].map((field) => (
                  <div key={field}>
                    <label className="block text-gray-900 text-sm mb-2">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      type={field === "email" ? "email" : "text"}
                      value={editingDriver[field]}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      className="w-full bg-white text-gray-800 px-3 py-2 rounded border border-gray-500 focus:border-green-400 focus:outline-none"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-900 text-sm mb-2">Address</label>
                  <textarea
                    value={editingDriver.address}
                    onChange={(e) =>
                      setEditingDriver((prev) => ({ ...prev, address: e.target.value }))
                    }
                    className="w-full text-gray-900 bg-white px-3 py-2 rounded border border-gray-500 focus:border-green-400 focus:outline-none"
                    rows="2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default DriverManagement;
