const express = require('express');
const Campaign = require('../models/Campaign');
const Asset = require('../models/Asset');
const Route = require('../models/Route');
const Truck = require('../models/Truck');
const { authenticateToken, requireAdvertiser } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const { checkAvailability } = require('../utils/availability');
const moment = require('moment');

const router = express.Router();

// Create campaign
router.post('/', authenticateToken, requireAdvertiser, validateRequest(schemas.createCampaign), async (req, res) => {
  try {
    const { routeId, assetId, package, startDate } = req.body;

      const dayOfMonth = moment(startDate).date();
    if (![1, 15, 16 ].includes(dayOfMonth)) {
      return res.status(400).json({ error: 'Start date must be either 1st or 15th of the month' });
    }
    // Verify asset ownership
    const asset = await Asset.findOne({ _id: assetId, owner: req.user._id });
    if (!asset) {
      return res.status(400).json({ error: 'Asset not found or not owned by you' });
    }

    // Get route and truck info
    const route = await Route.findById(routeId).populate('truck');
    if (!route) {
      return res.status(400).json({ error: 'Route not found' });
    }

    // Check availability
    const availability = await checkAvailability(routeId, package, new Date(startDate));
    if (!availability.available) {
      return res.status(400).json({ 
        error: 'No slots available',
        earliestStartDate: availability.earliestStartDate
      });
    }

    // Calculate end date
    const packageDays = parseInt(package);
    const endDate = moment(startDate).add(packageDays - 1, 'days').toDate();

    // Create campaign
    const campaign = new Campaign({
      advertiser: req.user._id,
      route: routeId,
      truck: route.truck._id,
      asset: assetId,
      package,
      startDate: new Date(startDate),
      endDate
    });

    await campaign.save();

    res.status(201).json({
      id: campaign._id,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      package: campaign.package
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Get user's campaigns
router.get('/mine', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ advertiser: req.user._id })
      .populate('route', 'name')
      .populate('asset', 'url durationSec')
      .populate('truck', 'controllerId')
      .select('status package startDate endDate paymentStatus createdAt')
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get specific campaign
router.get('/:id', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({ 
      _id: id, 
      advertiser: req.user._id 
    })
    .populate('route', 'name')
    .populate('asset', 'url durationSec fileSize')
    .populate('truck', 'controllerId status');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

module.exports = router;
