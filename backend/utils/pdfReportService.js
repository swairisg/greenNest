const PDFDocument = require('pdfkit');

class PDFReportService {
  async generateStockReport(items, filters = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        doc.on('error', (error) => {
          reject(error);
        });

        let yPosition = this.addHeader(doc, 'STOCK LEVEL REPORT');
        yPosition = this.addFiltersSection(doc, filters, yPosition);
        yPosition = this.addStockSummary(doc, items, yPosition);
        this.addStockTable(doc, items, yPosition);
        this.addFooter(doc);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  
  addHeader(doc, title) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#059669')
       .text('GREENNEST AGRICULTURAL MANAGEMENT', 50, 50)
       .fillColor('#000000');

    doc.fontSize(14)
       .text(title, 50, 80);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generated on: ${new Date().toLocaleString()}`, 50, 110);

    doc.moveTo(50, 130).lineTo(550, 130).strokeColor('#cccccc').stroke();

    return 150;
  }

  addFiltersSection(doc, filters, yPosition) {
    if (filters.category || filters.lowStockOnly) {
      doc.fontSize(9).font('Helvetica-Bold').text('FILTERS APPLIED:', 50, yPosition);
      yPosition += 15;
      
      doc.font('Helvetica');
      if (filters.category) {
        doc.text(`• Category: ${filters.category}`, 60, yPosition);
        yPosition += 12;
      }
      if (filters.lowStockOnly) {
        doc.text('• Low Stock Items Only', 60, yPosition);
        yPosition += 12;
      }
      yPosition += 10;
    }
    
    return yPosition;
  }

  addStockSummary(doc, items, yPosition) {
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.currentStock <= item.minStockLevel).length;
    const outOfStockItems = items.filter(item => item.currentStock === 0).length;
    const totalStockValue = items.reduce((sum, item) => sum + (item.currentStock || 0), 0);
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

    doc.fontSize(11).font('Helvetica-Bold').text('SUMMARY', 50, yPosition);
    yPosition += 20;
    
    doc.font('Helvetica').fontSize(9);
    doc.text(`• Total Items: ${totalItems}`, 60, yPosition);
    yPosition += 12;
    doc.text(`• Low Stock Items: ${lowStockItems}`, 60, yPosition);
    yPosition += 12;
    doc.text(`• Out of Stock Items: ${outOfStockItems}`, 60, yPosition);
    yPosition += 12;
    doc.text(`• Total Stock Quantity: ${totalStockValue}`, 60, yPosition);
    yPosition += 12;
    doc.text(`• Categories: ${categories.join(', ')}`, 60, yPosition);
    yPosition += 20;
    
    return yPosition;
  }

  addStockTable(doc, items, yPosition) {
    const tableTop = yPosition;
    
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Item Name', 50, yPosition);
    doc.text('SKU', 150, yPosition);
    doc.text('Category', 220, yPosition);
    doc.text('Stock', 290, yPosition);
    doc.text('Min/Max', 330, yPosition);
    doc.text('Supplier', 390, yPosition);
    doc.text('Status', 500, yPosition);
    
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;
    
    doc.font('Helvetica').fontSize(8);
    items.forEach((item) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Item Name', 50, yPosition);
        doc.text('SKU', 150, yPosition);
        doc.text('Category', 220, yPosition);
        doc.text('Stock', 290, yPosition);
        doc.text('Min/Max', 330, yPosition);
        doc.text('Supplier', 390, yPosition);
        doc.text('Status', 500, yPosition);
        yPosition += 25;
      }

      const status = item.currentStock === 0 ? 'OUT OF STOCK' : 
                    item.currentStock <= item.minStockLevel ? 'LOW STOCK' : 'OK';
      
      const statusColor = status === 'OUT OF STOCK' ? '#ff0000' : 
                         status === 'LOW STOCK' ? '#ff6b00' : '#00aa00';

      doc.text((item.name || '').substring(0, 20), 50, yPosition);
      doc.text(item.sku || '', 150, yPosition);
      doc.text(item.category || '', 220, yPosition);
      doc.text((item.currentStock || 0).toString(), 290, yPosition);
      doc.text(`${item.minStockLevel || 0}/${item.maxStockLevel || 0}`, 330, yPosition);
      doc.text(item.supplierId?.name || item.supplierId?.companyName || 'N/A', 390, yPosition);
      doc.fillColor(statusColor).text(status, 500, yPosition).fillColor('#000000');
      
      yPosition += 15;
    });
  }

  addFooter(doc) {
    const pageHeight = doc.page.height;
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#666666')
       .text('GreenNest Agricultural Management System - Confidential Report', 50, pageHeight - 30)
       .text(`Page ${doc.bufferedPageRange().count}`, 500, pageHeight - 30);
  }
}

module.exports = new PDFReportService();