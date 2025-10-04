import React, { useEffect, useState } from "react";
import axios from "axios";
import SupplierDataDisplay from "../../../Components/inventory/itemDataDisplay/SupplierDataDisplay";

const API_URL = "http://localhost:5000/api/suppliers";

function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterActive, setFilterActive] = useState(true);

  //new supplier form state
  const [newSupplier, setNewSupplier] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    paymentTerms: "",
    isActive: true
  });

  useEffect(() => {
    fetchSuppliers();
  }, [filterActive]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      let filteredSuppliers = response.data.suppliers || [];
      
      if (filterActive) {
        filteredSuppliers = filteredSuppliers.filter(supplier => supplier.isActive);
      }
      
      setSuppliers(filteredSuppliers);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchSuppliers(); //refresh
    } catch (err) {
      console.error("Error deleting supplier:", err);
    }
  };

  const handleEdit = (id) => {
    //edit modal
    console.log("Edit supplier:", id);
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(API_URL, newSupplier);
      setSuppliers(prev => [response.data.supplier, ...prev]);
      setNewSupplier({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
        paymentTerms: "",
        isActive: true
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error creating supplier:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="p-6 text-white">
        <p>Loading suppliers data...</p>
      </div>
    );
  }

  const activeSuppliers = suppliers.filter(s => s.isActive).length;
  const totalSuppliers = suppliers.length;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <h1 className="text-3xl font-bold mb-1 text-gray-600">
              Supplier Management
            </h1>
          </div>
          <p className="text-gray-500 text-sm">
            Smarter supplier tracking and control
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-200 rounded-lg p-4 text-center border-2 border-blue-500">
            <h3 className="font-medium text-gray-600">Total Suppliers</h3>
            <p className="text-2xl text-blue-500 md:font-bold">{totalSuppliers}</p>
          </div>
          <div className="bg-gray-200 rounded-lg p-4 text-center border-2 border-green-500">
            <h3 className="font-medium text-gray-600">Active Suppliers</h3>
            <p className="text-2xl text-green-500 md:font-bold">{activeSuppliers}</p>
          </div>
          <div className="bg-gray-200 rounded-lg p-4 text-center border-2 border-red-500">
            <h3 className="font-medium text-gray-600">Inactive Suppliers</h3>
            <p className="text-2xl text-red-500 md:font-bold">{totalSuppliers - activeSuppliers}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-gray-50 border-2 border-gray-950 rounded-lg p-6 mb-6 ">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ">
            <div className="flex items-center space-x-4">
              {/* Active Filter */}
              <label className="flex items-center space-x-2 text-gray-500">
                <input 
                  type="checkbox" 
                  checked={filterActive}
                  onChange={(e) => setFilterActive(e.target.checked)}
                  className="rounded bg-gray-600"
                />
                <span>Show Active Only</span>
              </label>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {showForm ? 'Cancel' : 'Add New Supplier'}
            </button>
          </div>

          {/* Add Supplier Form */}
          {showForm && (
            <form onSubmit={handleCreateSupplier} className="mt-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray text-sm mb-2">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={newSupplier.companyName}
                    onChange={handleInputChange}
                    className="w-full bg-white text-gray px-3 py-2 rounded border-2 border-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray text-sm mb-2">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={newSupplier.contactPerson}
                    onChange={handleInputChange}
                    className="w-full bg-white text-gray px-3 py-2 rounded border-2 border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray text-sm mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newSupplier.email}
                    onChange={handleInputChange}
                    className="w-full bg-white text-gray px-3 py-2 rounded border-2 border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray text-sm mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newSupplier.phone}
                    onChange={handleInputChange}
                    className="w-full bg-white text-gray px-3 py-2 rounded border-2 border-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray text-sm mb-2">Address</label>
                  <textarea
                    name="address"
                    value={newSupplier.address}
                    onChange={handleInputChange}
                    className="w-full bg-white text-gray px-3 py-2 rounded border-2 border-gray-900"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-gray text-sm mb-2">Tax ID</label>
                  <input
                    type="text"
                    name="taxId"
                    value={newSupplier.taxId}
                    onChange={handleInputChange}
                    className="w-full bg-white text-gray px-3 py-2 rounded border-2 border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray text-sm mb-2">Payment Terms</label>
                  <select
                    name="paymentTerms"
                    value={newSupplier.paymentTerms}
                    onChange={handleInputChange}
                    className="w-full bg-white text-gray px-3 py-2 rounded border-2 border-gray-900"
                  >
                    <option value="">Select Payment Terms</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on receipt">Due on receipt</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Add Supplier
              </button>
            </form>
          )}
        </div>

        {/* Suppliers List */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray">
            {filterActive ? 'Active Suppliers' : 'All Suppliers'} ({suppliers.length})
          </h2>
          
          {suppliers.length === 0 ? (
            <p className="text-gray-500">No suppliers found</p>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <SupplierDataDisplay
                  key={supplier._id}
                  data={supplier}
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

export default SupplierManagement;