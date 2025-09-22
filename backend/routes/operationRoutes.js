// routes/operationRoutes.js
const express = require('express');
const router = express.Router();

// This is a basic operations router that you can expand based on your needs
// Currently redirects to automation system for automated operations

// GET /api/operations - Get operation status overview
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: "Operations API is working!",
    note: "For automated operations, use /api/automation endpoints",
    endpoints: {
      status: "GET /api/operations/status",
      manual: "POST /api/operations/manual/:operation"
    },
    automationEndpoints: {
      watering: "POST /api/automation/operations/watering",
      fertilization: "POST /api/automation/operations/fertilization",
      settings: "GET /api/automation/settings"
    }
  });
});

// GET /api/operations/status - Get current operations status
router.get('/status', async (req, res) => {
  try {
    // This could integrate with your automation system
    res.json({
      success: true,
      message: "For detailed operation status, use /api/automation/status",
      quickStatus: {
        watering: "Check automation system",
        fertilization: "Check automation system",
        ventilation: "Check automation system"
      },
      redirectTo: "/api/automation/status"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get operation status",
      error: error.message
    });
  }
});

// POST /api/operations/manual/:operation - Manual operation trigger
router.post('/manual/:operation', async (req, res) => {
  try {
    const { operation } = req.params;
    const validOperations = ['watering', 'fertilization', 'ventilation'];
    
    if (!validOperations.includes(operation)) {
      return res.status(400).json({
        success: false,
        message: `Invalid operation. Use one of: ${validOperations.join(', ')}`
      });
    }
    
    // Redirect to automation system
    res.json({
      success: true,
      message: `Manual ${operation} request received`,
      note: `Please use /api/automation/operations/${operation} for actual execution`,
      redirectTo: `/api/automation/operations/${operation}`,
      requestBody: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to process manual ${operation} request`,
      error: error.message
    });
  }
});

module.exports = router;