const Inventory = require('../../Model/inventory/InventoryModel');

class ReportController {
  //generate stock report
  async generateStockReport(req, res) {
    try {
      console.log('📊 Generating stock report with query:', req.query);
      
      const { format, category, lowStockOnly } = req.query;
      
      let filter = { isActive: true };
      if (category) filter.category = category;
      if (lowStockOnly === 'true') {
        filter.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
      }

      const items = await Inventory.find(filter)
        .populate('supplierId', 'name companyName email phone')
        .sort({ category: 1, name: 1 })
        .lean();

      console.log(`📦 Found ${items.length} items for report`);

      if (format === 'pdf') {
        //
        return res.json({
          success: true,
          data: items,
          summary: this.generateSummary(items),
          filters: { category, lowStockOnly },
          message: 'PDF generation not yet implemented'
        });
      }

      // json response
      res.json({
        success: true,
        data: items,
        summary: this.generateSummary(items),
        filters: { category, lowStockOnly }
      });

    } catch (error) {
      console.error('❌ Stock report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating stock report',
        error: error.message
      });
    }
  }

  //export to CSV
  async exportToCSV(req, res) {
    try {
      const { category } = req.query;
      
      let filter = { isActive: true };
      if (category) filter.category = category;

      const items = await Inventory.find(filter)
        .populate('supplierId', 'name companyName')
        .lean();

      const csvContent = this.generateCSV(items);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-${category || 'all'}-${Date.now()}.csv"`);
      res.send(csvContent);

    } catch (error) {
      console.error('❌ CSV export error:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting CSV',
        error: error.message
      });
    }
  }

  // dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const totalItems = await Inventory.countDocuments({ isActive: true });
      const lowStockItems = await Inventory.countDocuments({
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minStockLevel'] }
      });
      
      const items = await Inventory.find({ isActive: true });
      const totalStockValue = items.reduce((sum, item) => sum + (item.currentStock || 0), 0);
      const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

      const categoryStats = await Inventory.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            itemCount: { $sum: 1 },
            totalStock: { $sum: '$currentStock' },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: ['$currentStock', '$minStockLevel'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { itemCount: -1 } }
      ]);

      const result = {
        success: true,
        data: {
          overview: {
            totalItems,
            totalStockValue,
            lowStockItems,
            outOfStockItems: items.filter(item => item.currentStock === 0).length,
            categories: categories
          },
          byCategory: categoryStats,
          summary: {
            stockHealth: totalItems > 0 ? Math.round((1 - lowStockItems / totalItems) * 100) : 0,
            totalCategories: categories.length
          }
        }
      };

      res.json(result);

    } catch (error) {
      console.error('❌ Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard statistics',
        error: error.message
      });
    }
  }

  // method to generate summary
  generateSummary(items) {
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.currentStock <= item.minStockLevel).length;
    const outOfStockItems = items.filter(item => item.currentStock === 0).length;
    const totalStockValue = items.reduce((sum, item) => sum + (item.currentStock || 0), 0);
    const categories = [...new Set(items.map(item => item.category))];
    
    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalStockValue,
      categories: categories.length,
      categoryList: categories,
      stockHealth: totalItems > 0 ? Math.round((1 - lowStockItems / totalItems) * 100) : 0
    };
  }

  // method to generate CSV
  generateCSV(items) {
    const headers = ['Name', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Max Stock', 'Unit', 'Supplier', 'Status', 'Last Updated'];
    
    const rows = items.map(item => [
      `"${item.name}"`,
      item.sku,
      item.category,
      item.currentStock,
      item.minStockLevel,
      item.maxStockLevel,
      item.unitOfMeasure || 'units',
      `"${item.supplierId?.name || item.supplierId?.companyName || 'N/A'}"`,
      item.currentStock === 0 ? 'Out of Stock' : item.currentStock <= item.minStockLevel ? 'Low Stock' : 'Normal',
      new Date(item.updatedAt).toLocaleDateString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = new ReportController();