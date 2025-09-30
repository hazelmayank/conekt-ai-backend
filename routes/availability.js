const express = require('express');
const { checkAvailability, getRouteCapacity } = require('../utils/availability');
const { authenticateToken, requireAdvertiser } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Check availability for a route
router.post('/check', authenticateToken, requireAdvertiser, validateRequest(schemas.checkAvailability), async (req, res) => {
  try {
    const { routeId, package, startDate } = req.body;
    
    const availability = await checkAvailability(routeId, package, new Date(startDate));
    
    res.json(availability);
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Get route capacity
router.get('/route/:id/capacity', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const capacity = await getRouteCapacity(id);
    
    res.json(capacity);
  } catch (error) {
    console.error('Get capacity error:', error);
    res.status(500).json({ error: 'Failed to get route capacity' });
  }
});

module.exports = router;
