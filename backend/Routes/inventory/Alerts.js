const express = require('express');
const router = express.Router();
const Inventory = require('../../models/InventoryAndSupplychain/InventoryModel');

// Get active alerts (low stock items)
router.get('/active', async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    })
    .populate('supplierId', 'companyName contactPerson email phone')
    .select('name sku category currentStock minStockLevel maxStockLevel supplierId')
    .lean();

    const alerts = lowStockItems.map(item => ({
      type: 'LOW_STOCK',
      severity: item.currentStock === 0 ? 'HIGH' : 'MEDIUM',
      message: `${item.name} (${item.sku}) is ${item.currentStock === 0 ? 'out of stock' : 'running low'}. Current: ${item.currentStock}, Minimum: ${item.minStockLevel}`,
      item: item,
      timestamp: new Date()
    }));

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });

  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
});

module.exports = router;