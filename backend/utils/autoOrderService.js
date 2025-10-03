const Order = require('../models/InventoryAndSupplychain/OrderModel');
const Inventory = require('../models/InventoryAndSupplychain/InventoryModel');
const Supplier = require('../models/InventoryAndSupplychain/SupplierModel');
const whatsappService = require('./WhatsAppService');

class AutoOrderService {
  constructor() {
    this.reorderThreshold = 0.2; // 20% above min stock level
    this.isRunning = false;
  }

  // Check stock levels and generate POs automatically
  async checkStockLevelsAndGeneratePOs() {
    if (this.isRunning) {
      console.log('🔄 Auto-order service already running...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('🔍 Checking stock levels for auto-reordering...');
      
      const lowStockItems = await Inventory.find({
        isActive: true,
        $expr: { 
          $lte: [ 
            "$currentStock", 
            { $multiply: ["$minStockLevel", 1 + this.reorderThreshold] } 
          ] 
        }
      }).populate('supplierId');

      console.log(`📊 Found ${lowStockItems.length} low-stock items`);

      const poResults = [];
      for (const item of lowStockItems) {
        try {
          const po = await this.generatePurchaseOrderForItem(item);
          poResults.push({ success: true, po, item });
          console.log(`✅ Auto-generated PO ${po.poNumber} for ${item.name}`);
        } catch (error) {
          console.error(`❌ Failed to generate PO for ${item.name}:`, error);
          poResults.push({ success: false, error: error.message, item });
        }
      }

      // Send summary notification
      await this.sendSummaryNotification(poResults);
      
      console.log(`🎉 Auto-order completed: ${poResults.filter(r => r.success).length} POs generated`);
      return poResults;

    } catch (error) {
      console.error('❌ Error in auto-order service:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Generate PO for a single low-stock item
  async generatePurchaseOrderForItem(item) {
    if (!item.supplierId || !item.supplierId.isActive) {
      throw new Error(`No active supplier for item: ${item.name}`);
    }

    const reorderQuantity = this.calculateReorderQuantity(item);
    const unitPrice = await this.getHistoricalPrice(item._id) || this.estimateMarketPrice(item);

    const poData = {
      supplierId: item.supplierId._id,
      items: [{
        itemId: item._id,
        quantity: reorderQuantity,
        unitPrice: unitPrice
      }],
      status: 'Draft',
      totalAmount: reorderQuantity * unitPrice,
      notes: `Auto-generated PO for low stock: ${item.name}`
    };

    const order = new Order(poData);
    await order.save();

    // Populate for notification
    await order.populate('supplierId');
    await order.populate('items.itemId');

    return order;
  }

  // Calculate optimal reorder quantity
  calculateReorderQuantity(item) {
    const deficit = item.maxStockLevel - item.currentStock;
    const minReorder = item.minStockLevel * 2; // At least 2x min stock
    
    return Math.max(deficit, minReorder, 10); // Minimum 10 units
  }

  // Get historical price (simplified - would query transaction history)
  async getHistoricalPrice(itemId) {
    // In real implementation, this would query past transactions
    // For now, return a reasonable estimate
    const prices = {
      'Seed': 5.00,
      'Fertilizer': 15.00,
      'Tool': 25.00,
      'Equipment': 100.00
    };
    
    const item = await Inventory.findById(itemId);
    return prices[item.category] || 10.00;
  }

  // Estimate market price based on category
  estimateMarketPrice(item) {
    const priceRanges = {
      'Seed': { min: 3.00, max: 8.00 },
      'Fertilizer': { min: 10.00, max: 20.00 },
      'Tool': { min: 15.00, max: 50.00 },
      'Equipment': { min: 75.00, max: 200.00 }
    };
    
    const range = priceRanges[item.category] || { min: 5.00, max: 15.00 };
    return range.min + (Math.random() * (range.max - range.min));
  }

  // Send summary notification
  async sendSummaryNotification(results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    if (successful > 0) {
      const message = `🤖 AUTO-ORDER SUMMARY\n\nGenerated ${successful} purchase orders\n${failed} failures\n\nReview drafts in the system.`;
      
      // Send WhatsApp notification
      await whatsappService.sendManagerNotification(message);
    }
  }

  // Send notification to manager
  async sendManagerNotification(message) {
    try {
      if (process.env.MANAGER_PHONE_NUMBER) {
        await whatsappService.sendMessage(
          process.env.MANAGER_PHONE_NUMBER,
          message
        );
      }
    } catch (error) {
      console.error('Failed to send manager notification:', error);
    }
  }

  // Start automated checking (run daily at 9 AM)
  startDailyChecking() {
    console.log('⏰ Starting daily auto-order service...');
    
    const now = new Date();
    const nineAM = new Date();
    nineAM.setHours(9, 0, 0, 0);
    
    let timeUntilNineAM = nineAM - now;
    if (timeUntilNineAM < 0) {
      timeUntilNineAM += 24 * 60 * 60 * 1000; // Next day
    }

    console.log(`⏰ First check in ${Math.round(timeUntilNineAM/60000)} minutes`);

    setTimeout(() => {
      this.checkStockLevelsAndGeneratePOs();
      // Continue daily
      setInterval(() => {
        this.checkStockLevelsAndGeneratePOs();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilNineAM);
  }

  // Manual trigger for testing
  async manualTrigger() {
    console.log('🔄 Manual auto-order trigger');
    return await this.checkStockLevelsAndGeneratePOs();
  }
}

module.exports = new AutoOrderService();