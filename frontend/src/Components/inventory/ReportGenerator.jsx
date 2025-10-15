import React, { useEffect, useState } from "react";
import axios from "axios";
import { Download, FileText, BarChart3, AlertCircle, FileDown, PieChart } from "lucide-react";

function ReportGenerator({ items = [] }) {
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/reports/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard statistics');
    }
  };

  const generateCSV = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `http://localhost:5001/api/reports/export/csv${categoryFilter ? `?category=${categoryFilter}` : ''}`, 
        {
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-${categoryFilter || 'all'}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('CSV export error:', err);
      setError('Failed to export CSV. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      setPdfLoading(true);
      setError("");
      
      const response = await axios.get(
        `http://localhost:5001/api/reports/stock?format=pdf${categoryFilter ? `&category=${categoryFilter}` : ''}`, 
        {
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('PDF export error:', err);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
  };

  const clearFilter = () => {
    setCategoryFilter('');
  };

  if (!stats) {
    return <div className="text-center py-8 text-gray-300">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-600 mb-3">Report Filters</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Filter by Category</label>
            <select 
              value={categoryFilter}
              onChange={handleCategoryFilter}
              className="bg-gray-100 text-gray px-3 py-2 rounded border border-gray-500 focus:border-green-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {stats.overview.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button
            onClick={clearFilter}
            className="bg-gray-100 border border-gray-500 hover:bg-gray-600 hover:text-gray-100 text-gray font-medium py-2 px-4 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-500/20 border border-blue-500 p-4 rounded-lg">
          <div className="flex items-center">
            <BarChart3 className="text-blue-500 mr-3" size={24} />
            <div>
              <div className="text-2xl font-bold text-white">{stats.overview.totalItems}</div>
              <div className="text-blue-500 text-sm">Total Items</div>
            </div>
          </div>
        </div>
        
        <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-3" size={24} />
            <div>
              <div className="text-2xl font-bold text-white">{stats.overview.lowStockItems}</div>
              <div className="text-red-500 text-sm">Low Stock</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-500/20 border border-green-500 p-4 rounded-lg">
          <div className="flex items-center">
            <PieChart className="text-green-500 mr-3" size={24} />
            <div>
              <div className="text-2xl font-bold text-white">{stats.overview.totalStockValue}</div>
              <div className="text-green-500 text-sm">Total Stock</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-500/20 border border-purple-500 p-4 rounded-lg">
          <div className="flex items-center">
            <FileText className="text-purple-500 mr-3" size={24} />
            <div>
              <div className="text-2xl font-bold text-white">{stats.summary.totalCategories}</div>
              <div className="text-purple-500 text-sm">Categories</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <FileDown size={20} className="mr-2" />
          Export Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={generatePDF}
            disabled={pdfLoading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-red-700 text-white font-medium py-3 px-4 rounded transition-colors flex items-center justify-center"
          >
            <FileText size={18} className="mr-2" />
            {pdfLoading ? 'Generating...' : 'PDF Report'}
          </button>
          
          <button
            onClick={generateCSV}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white font-medium py-3 px-4 rounded transition-colors flex items-center justify-center"
          >
            <Download size={18} className="mr-2" />
            {loading ? 'Exporting...' : 'CSV Export'}
          </button>
          
          <button
            onClick={() => window.print()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded transition-colors flex items-center justify-center"
          >
            <BarChart3 size={18} className="mr-2" />
            Print Summary
          </button>
        </div>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Stock by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.byCategory.map(category => (
            <div key={category._id} className="bg-gray-600 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-white">{category._id}</span>
                <span className="text-sm text-gray-300">{category.itemCount} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400">{category.totalStock} in stock</span>
                {category.lowStockCount > 0 && (
                  <span className="text-red-400">{category.lowStockCount} low</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportGenerator;