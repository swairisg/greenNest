import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, Edit, Plus, Calendar, User, MapPin, FileText } from "lucide-react";

const API_URL = "http://localhost:5000/api/operations";

function ManualOper() {
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newValues, setNewValues] = useState({ status: "ON", notes: "" });
  const [newEvent, setNewEvent] = useState({
    type: "manualOverride",
    status: "ON",
    performedBy: "",
    notes: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  //fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(API_URL);
      console.log('Events fetched:', res.data);
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('Error fetching events:', err.response?.data || err.message);
      setError('Failed to load operations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  //create a new manual operation
  const addEvent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const response = await axios.post(API_URL, newEvent);
      if (response.data.success) {
        setNewEvent({
          type: "manualOverride",
          status: "ON",
          performedBy: "",
          notes: "",
          location: "",
        });
        fetchEvents();
      }
    } catch (err) {
      console.error('Error adding event:', err.response?.data || err.message);
      setError('Failed to add operation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  //update event
  const startEditing = (event) => {
    setEditingId(event._id);
    setNewValues({ 
      status: event.status, 
      notes: event.notes || "",
      performedBy: event.performedBy,
      location: event.location || ""
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewValues({ status: "ON", notes: "", performedBy: "", location: "" });
  };

  //save edited event
  const saveChanges = async (id) => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.put(`${API_URL}/${id}`, newValues);
      if (response.data.success) {
        setEditingId(null);
        fetchEvents();
      }
    } catch (err) {
      console.error('Error updating event:', err.response?.data || err.message);
      setError('Failed to update operation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  //delete event
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this operation?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      console.log('Attempting to delete event with ID:', id);
      const response = await axios.delete(`${API_URL}/${id}`);
      
      if (response.data.success) {
        console.log('Delete successful:', response.data);
        setEvents((prev) => prev.filter((e) => e._id !== id));
      } else {
        console.error('Delete failed:', response.data);
        setError(`Delete failed: ${response.data.message}`);
      }
    } catch (err) {
      console.error('Delete error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url
      });
      
      if (err.response?.status === 404) {
        setError('The operation was not found. It may have already been deleted.');
       
        setEvents((prev) => prev.filter((e) => e._id !== id));
      } else {
        setError(`Delete failed: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Manual Operations</h1>
        <p className="text-gray-700 mb-6">Manage and track manual greenhouse operations</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/*add new operation */}
        <div className="bg-gray-100 rounded-lg p-6 mb-8 border-2 border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Plus className="mr-2" size={20} />
            Add New Operation
          </h2>
          <form onSubmit={addEvent} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  <User className="inline mr-2" size={16} />
                  Performed By *
                </label>
                <input
                  placeholder="Enter name or identifier"
                  value={newEvent.performedBy}
                  onChange={(e) => setNewEvent({ ...newEvent, performedBy: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-100 text-gray-600 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  <MapPin className="inline mr-2" size={16} />
                  Location
                </label>
                <input
                  placeholder="e.g., N_St01, S_St02"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-100 text-gray-600 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  <FileText className="inline mr-2" size={16} />
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes or comments"
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  rows={3}
                  className="w-full p-3 rounded-lg bg-gray-100 text-gray-600 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors resize-none"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                    className="w-full p-3 rounded-lg bg-green-500 text-white border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  >
                    <option value="ON">ON - Active</option>
                    <option value="OFF" className="bg-red-500">OFF - Completed</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 bg-red-400 border-2 border-gray-500 hover:bg-red-600 disabled:bg-green-700 disabled:cursor-not-allowed text-white p-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Plus size={20} />
                  <span>{loading ? 'Adding...' : 'Add Operation'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/*existing events */}
        <div className="bg-gray-100 rounded-lg p-6 border-2 border-green-400">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-600 flex items-center">
              <Calendar className="mr-2" size={20} />
              Operation History
            </h2>
            <span className="text-gray-500 text-sm">
              {events.length} operation{events.length !== 1 ? 's' : ''} recorded
            </span>
          </div>

          {loading && events.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading operations...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No operations recorded yet</p>
              <p className="text-gray-500 text-sm">Add your first operation above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event._id} className="bg-white p-4 rounded-lg border border-gray-700 hover:border-red-500/70 hover:border-2 transition-colors">
                  {editingId === event._id ? (
                    // edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">Performed By</label>
                          <input
                            value={newValues.performedBy}
                            onChange={(e) => setNewValues({ ...newValues, performedBy: e.target.value })}
                            className="w-full p-2 rounded bg-gray-600 text-white border border-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 text-sm font-medium mb-2">Location</label>
                          <input
                            value={newValues.location}
                            onChange={(e) => setNewValues({ ...newValues, location: e.target.value })}
                            className="w-full p-2 rounded bg-gray-600 text-white border border-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                          <select
                            value={newValues.status}
                            onChange={(e) => setNewValues({ ...newValues, status: e.target.value })}
                            className="w-full p-2 rounded bg-gray-600 text-white border border-gray-500"
                          >
                            <option value="ON">ON</option>
                            <option value="OFF">OFF</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-600 text-sm font-medium mb-2">Notes</label>
                          <input
                            value={newValues.notes}
                            onChange={(e) => setNewValues({ ...newValues, notes: e.target.value })}
                            className="w-full p-2 rounded bg-gray-600 text-white border border-gray-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => saveChanges(event._id)}
                          disabled={loading}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    //view mode
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <span className="text-white font-semibold capitalize bg-gray-600 px-3 py-1 rounded-full">
                            {event.type}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            event.status === 'ON' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {event.status}
                          </span>
                          <span className="text-gray-600 text-sm">
                            {formatDate(event.createdAt)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <User size={16} className="mr-2 text-gray-700" />
                            <span>{event.performedBy}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center text-gray-600">
                              <MapPin size={16} className="mr-2 text-gray-700" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.notes && (
                            <div className="flex items-center text-gray-600">
                              <FileText size={16} className="mr-2 text-gray-700" />
                              <span className="truncate">{event.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4 lg:mt-0 lg:ml-4">
                        <button
                          onClick={() => startEditing(event)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="Edit Operation"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(event._id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="Delete Operation"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManualOper;