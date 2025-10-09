const Inventory = require('../../Model/inventory/InventoryModel');
const PDFReportService = require('../../utils/pdfReportService');

class ReportController {
  
  async generateStockReport(req, res) {
    try {
      console.log('Generating stock report with query:', req.query);
      
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

      console.log(`Found ${items.length} items for report`);

      if (format === 'pdf') {
        try {
          const pdfBuffer = await PDFReportService.generateStockReport(items, { category, lowStockOnly });
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="stock-report-${Date.now()}.pdf"`);
          return res.send(pdfBuffer);
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          return res.status(500).json({
            success: false,
            message: 'Error generating PDF report',
            error: pdfError.message
          });
        }
      }

      res.json({
        success: true,
        data: items,
        summary: this.generateSummary(items),
        filters: { category, lowStockOnly }
      });

    } catch (error) {
      console.error('Stock report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating stock report',
        error: error.message
      });
    }
  }

  async exportToCSV(req, res) {
  try {
    console.log('Starting CSV export with query:', req.query);
    
    const { category } = req.query;
    
    let filter = { isActive: true };
    if (category) filter.category = category;

    console.log('Filter:', filter);

    const items = await Inventory.find(filter)
      .populate('supplierId', 'name companyName')
      .lean();

    console.log(`Found ${items.length} items for CSV export`);

    if (items.length === 0) {
      console.log('No items found for CSV export');
      return res.status(404).json({
        success: false,
        message: 'No items found to export'
      });
    }

    console.log('First item sample:', JSON.stringify(items[0], null, 2));

    const csvContent = this.generateCSV(items);
    
    console.log('CSV content generated successfully, length:', csvContent.length);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-${category || 'all'}-${Date.now()}.csv"`);
    res.send(csvContent);

    console.log('CSV export completed successfully');

  } catch (error) {
    console.error('CSV export error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error exporting CSV',
      error: error.message
    });
  }
}

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
      console.error(' Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard statistics',
        error: error.message
      });
    }
  }


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

  generateCSV(items) {
  console.log(' Starting CSV generation for', items.length, 'items');
  
  try {
    // Simple headers
    const headers = ['Name', 'Category', 'Current Stock', 'Min Stock', 'Status'];
    
    // Create rows with safe defaults
    const rows = items.map((item, index) => {
      try {
        const name = item.name || `Item-${index}`;
        const category = item.category || 'Unknown';
        const currentStock = item.currentStock || 0;
        const minStock = item.minStockLevel || 0;
        
        let status = 'Normal';
        if (currentStock === 0) {
          status = 'Out of Stock';
        } else if (currentStock <= minStock) {
          status = 'Low Stock';
        }
        
        return [name, category, currentStock, minStock, status];
      } catch (rowError) {
        console.error(` Error in row ${index}:`, rowError);
        return ['Error', 'Error', 0, 0, 'Error'];
      }
    });

    // Combine everything
    const csvArray = [headers, ...rows];
    const csvString = csvArray.map(row => row.join(',')).join('\n');
    
    console.log(' CSV generation completed');
    return csvString;
    
  } catch (error) {
    console.error(' CSV generation failed:', error);
    // Return minimal error CSV
    return 'Name,Category,Current Stock,Min Stock,Status\n"CSV Generation Failed","Error",0,0,"Error"';
  }
  }
}

module.exports = new ReportController();