import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, Edit2  } from "lucide-react";

const API_URL = "http://localhost:5001/api/automation";

function AutomatedTasks() {
  const [tasks, setTasks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newValues, setNewValues] = useState({ minValue: "", maxValue: "" });

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API_URL);
      setTasks(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = async (task) => {
    try {
      await axios.put(`${API_URL}/${task._id}`, {
        isActive: !task.isActive,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, isActive: !t.isActive } : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (task) => {
    setEditingId(task._id);
    setNewValues({ minValue: task.minValue, maxValue: task.maxValue });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewValues({ minValue: "", maxValue: "" });
  };

  const saveChanges = async (taskId) => {
    try {
      await axios.put(`${API_URL}/${taskId}`, {
        minValue: Number(newValues.minValue),
        maxValue: Number(newValues.maxValue),
      });
      setEditingId(null);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

 const handleDelete = async (taskId) => {
  try {
    await axios.delete(`${API_URL}/${taskId}`); // ✅ Correct
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  } catch (err) {
    console.error(err);
  }
};

  return (
    
    <div className="min-h-screen bg-white p-6"> 
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Automated Tasks</h1>

        <div className="bg-gray-800 rounded-lg p-6"> 
          <h2 className="text-lg font-semibold mb-3 text-gray-200">
            Automation Overview
          </h2>

          {tasks.length === 0 ? (
            <p className="text-gray-200">No automation tasks available</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task._id}
                className="flex flex-col md:flex-row items-center justify-between bg-gray-700 p-4 rounded-lg mb-3 border border-gray-600" 
              >
                <div className="flex-1 flex flex-col md:flex-row md:items-center md:space-x-6 mb-2 md:mb-0">
                  <span className="text-white font-semibold text-lg mb-1 md:mb-0">
                    {task.parameter}
                  </span>

                  {editingId === task._id ? (
                    <div className="flex items-center space-x-2">
                      <label className="text-gray-300 text-sm">Min:</label>
                      <input
                        type="number"
                        value={newValues.minValue}
                        onChange={(e) =>
                          setNewValues({
                            ...newValues,
                            minValue: e.target.value,
                          })
                        }
                        className="w-20 p-2 rounded bg-white text-gray-900 border border-gray-500"
                      />
                      <label className="text-gray-900 text-sm">Max:</label>
                      <input
                        type="number"
                        value={newValues.maxValue}
                        onChange={(e) =>
                          setNewValues({
                            ...newValues,
                            maxValue: e.target.value,
                          })
                        }
                        className="w-20 p-2 rounded bg-gray-600 text-white border border-gray-500"
                      />
                    </div>
                  ) : (
                    <span className="text-gray-300">
                      Min: {task.minValue} | Max: {task.maxValue}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {editingId === task._id ? (
                    <>
                      <button
                        onClick={() => saveChanges(task._id)}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleTask(task)}
                        className={`px-3 py-2 text-sm rounded-lg text-white transition-colors ${
                          task.isActive 
                            ? "bg-[#0dbf19] hover:bg-green-600 font-bold" 
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        {task.isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => startEditing(task)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(task._id)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AutomatedTasks;
