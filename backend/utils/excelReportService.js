const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelReportService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../reports');
    this.ensureReportsDir();
  }

  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  // Generate stock report in Excel
  async generateStockReport(items, filters = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Report');
    
    // Title
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'GREENNEST - STOCK LEVEL REPORT';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Date
    worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleString()}`;
    worksheet.getCell('A2').font = { italic: true };
    
    // Filters
    if (filters.category || filters.lowStock) {
      worksheet.getCell('A3').value = 'Filters:';
      worksheet.getCell('A3').font = { bold: true };
      
      let filterText = '';
      if (filters.category) filterText += `Category: ${filters.category} `;
      if (filters.lowStock) filterText += 'Low Stock Only';
      worksheet.getCell('B3').value = filterText;
    }
    
    // Add headers
    worksheet.addRow([]); // Empty row
    
    worksheet.columns = [
      { header: 'Item Name', key: 'name', width: 30 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Current Stock', key: 'currentStock', width: 15 },
      { header: 'Min Stock', key: 'minStockLevel', width: 15 },
      { header: 'Max Stock', key: 'maxStockLevel', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    
    // Style header row
    const headerRow = worksheet.getRow(6);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
    
    // Add data
    items.forEach(item => {
      const status = item.currentStock <= item.minStockLevel ? 'LOW STOCK' : 'OK';
      const row = worksheet.addRow({
        name: item.name,
        sku: item.sku,
        category: item.category,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
        maxStockLevel: item.maxStockLevel,
        status: status
      });
      
      // Color code low stock rows
      if (status === 'LOW STOCK') {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE4E1' }
          };
          cell.font = { bold: true, color: { argb: 'FFFF0000' } };
        });
      }
    });
    
    // Add summary
    worksheet.addRow([]); // Empty row
    
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.currentStock <= item.minStockLevel).length;
    const totalStock = items.reduce((sum, item) => sum + item.currentStock, 0);
    
    worksheet.addRow(['SUMMARY', '', '', '', '', '', '']);
    worksheet.addRow(['Total Items:', totalItems]);
    worksheet.addRow(['Low Stock Items:', lowStockItems]);
    worksheet.addRow(['Total Stock Quantity:', totalStock]);
    worksheet.addRow(['Stock Health:', `${Math.round((1 - lowStockItems/totalItems) * 100)}%`]);
    
    // Style summary
    for (let i = worksheet.rowCount - 4; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      row.font = { bold: true };
      if (i === worksheet.rowCount - 4) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F8FF' }
        };
      }
    }
    
    // Save file
    const filename = `stock_report_${Date.now()}.xlsx`;
    const filepath = path.join(this.reportsDir, filename);
    await workbook.xlsx.writeFile(filepath);
    
    return { filename, filepath };
  }

  async generateTransactionReport(transactions, filters = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');
    
    
    const filename = `transaction_report_${Date.now()}.xlsx`;
    const filepath = path.join(this.reportsDir, filename);
    await workbook.xlsx.writeFile(filepath);
    
    return { filename, filepath };
  }
}

module.exports = new ExcelReportService();