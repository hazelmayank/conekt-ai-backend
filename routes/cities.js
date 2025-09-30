const express = require('express');
const City = require('../models/City');
const Route = require('../models/Route');
const { authenticateToken, requireAdvertiser } = require('../middleware/auth');

const router = express.Router();

// Get all cities
router.get('/', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const cities = await City.find({ enabled: true }).select('name description');
    res.json(cities);
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Get routes for a city
router.get('/:id/routes', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const routes = await Route.find({ 
      city: id, 
      isActive: true 
    })
    .populate('truck', 'controllerId status')
    .select('name description truck');

    res.json(routes);
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

module.exports = router;
