const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

// Public — clients poll this to check maintenance status
router.get('/maintenance', async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    res.json({
      success: true,
      data: {
        maintenanceMode: settings?.maintenanceMode || false,
        maintenanceMessage: settings?.maintenanceMessage || 'The system is currently under maintenance.',
      }
    });
  } catch {
    res.json({ success: true, data: { maintenanceMode: false } });
  }
});

// Super admin only
router.put('/maintenance', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;

    const settings = await SystemSettings.findOneAndUpdate(
      {},
      { maintenanceMode, maintenanceMessage, updatedBy: req.user.id, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    await logAction(
      req,
      maintenanceMode ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
      'System', null, 'System Settings',
      { maintenanceMessage }
    );

    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update maintenance settings' });
  }
});

module.exports = router;
