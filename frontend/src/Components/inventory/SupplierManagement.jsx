import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001/api/suppliers";

function SupplierDataDisplay({ data, onDelete, onEdit }) {
  const { 
    _id, 
    companyName, 
    contactPerson, 
    email, 
    phone, 
    address, 
    taxId, 
    paymentTerms,
    isActive 
  } = data;

  return (
    <div className="mb-3 p-4 bg-white rounded-lg text-gray-800 border-l-4 border-l-blue-400 border-2 ">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-600">{companyName}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-red-500/20 text-red-400 border border-red-500'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div>
                <strong className="text-gray-700">Contact Person:</strong>
                <p className="text-gray-600">{contactPerson || 'Not specified'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Email:</strong>
                <p className="text-gray-600 truncate">{email || 'Not provided'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Phone:</strong>
                <p className="text-gray-600">{phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <strong className="text-gray-700">Tax ID:</strong>
                <p className="text-gray-600">{taxId || 'Not provided'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Payment Terms:</strong>
                <p className="text-gray-600">{paymentTerms || 'Not specified'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <strong className="text-gray-700">Address:</strong>
                <p className="text-gray-600 text-sm">{address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-500">
            <span className="text-xs text-gray-500">Supplier ID: {_id}</span>
          </div>
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={() => onEdit(data)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(_id)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterActive, setFilterActive] = useState(true);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

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
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchSuppliers();
      } catch (err) {
        console.error("Error deleting supplier:", err);
      }
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setNewSupplier({
      companyName: supplier.companyName || "",
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      taxId: supplier.taxId || "",
      paymentTerms: supplier.paymentTerms || "",
      isActive: supplier.isActive !== undefined ? supplier.isActive : true
    });
    setIsEditMode(true);
    setShowForm(true);
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/${editingSupplier._id}`, newSupplier);
      fetchSuppliers();
      resetForm();
    } catch (err) {
      console.error("Error updating supplier:", err);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, newSupplier);
      fetchSuppliers();
      resetForm();
    } catch (err) {
      console.error("Error creating supplier:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
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
    setIsEditMode(false);
    setEditingSupplier(null);
  };

  const cancelEdit = () => {
    resetForm();
  };

  if (loading) {
    return (
      <div className="p-6 text-white">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading suppliers data...</span>
        </div>
      </div>
    );
  }

  const activeSuppliers = suppliers.filter(s => s.isActive).length;
  const totalSuppliers = suppliers.length;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">

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

        <div className="bg-gray-50 border-2 border-gray-950 rounded-lg p-6 mb-6 ">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ">
            <div className="flex items-center space-x-4">
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
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {showForm ? 'Cancel' : 'Add New Supplier'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={isEditMode ? handleUpdateSupplier : handleCreateSupplier} className="mt-4 p-4 bg-gray-50 rounded">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  {isEditMode ? `Edit Supplier - ${editingSupplier?.companyName}` : 'Add New Supplier'}
                </h3>
                {isEditMode && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    editingSupplier?.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {editingSupplier?.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>

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
                {isEditMode && (
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2 text-gray-500">
                      <input 
                        type="checkbox" 
                        name="isActive"
                        checked={newSupplier.isActive}
                        onChange={(e) => setNewSupplier(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded bg-gray-600"
                      />
                      <span>Active Supplier</span>
                    </label>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  {isEditMode ? 'Update Supplier' : 'Add Supplier'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

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