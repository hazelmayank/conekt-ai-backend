const express = require('express');
const Truck = require('../models/Truck');
const Playlist = require('../models/Playlist');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all trucks
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const trucks = await Truck.find()
      .populate('route', 'name city')
      .select('controllerId status lastHeartbeatAt uptimeSeconds')
      .sort({ lastHeartbeatAt: -1 });

    res.json(trucks);
  } catch (error) {
    console.error('Get trucks error:', error);
    res.status(500).json({ error: 'Failed to fetch trucks' });
  }
});

// Get truck status
router.get('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const truck = await Truck.findById(id)
      .populate('route', 'name city');

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    res.json({
      id: truck._id,
      controllerId: truck.controllerId,
      status: truck.status,
      lastHeartbeatAt: truck.lastHeartbeatAt,
      uptimeSeconds: truck.uptimeSeconds,
      route: truck.route
    });
  } catch (error) {
    console.error('Get truck status error:', error);
    res.status(500).json({ error: 'Failed to fetch truck status' });
  }
});

module.exports = router;
