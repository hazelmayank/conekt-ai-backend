const express = require('express');
const Campaign = require('../models/Campaign');
const Playlist = require('../models/Playlist');
const Truck = require('../models/Truck');
const Route = require('../models/Route');
const City = require('../models/City');
const Asset = require('../models/Asset');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const { checkAvailability } = require('../utils/availability');
const moment = require('moment');

const router = express.Router();

// Get all campaigns for admin review
router.get('/campaigns', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    
    const campaigns = await Campaign.find({ status })
      .populate('advertiser', 'phone')
      .populate('route', 'name')
      .populate('asset', 'url durationSec')
      .populate('truck', 'controllerId status')
      .select('status package startDate endDate paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Campaign.countDocuments({ status });

    res.json({
      campaigns,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get admin campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Approve campaign
router.post('/campaigns/:id/approve', authenticateToken, requireAdmin, validateRequest(schemas.approveCampaign), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate } = req.body;

    const campaign = await Campaign.findById(id).populate('route');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({ error: 'Campaign is not pending' });
    }

    // Check availability again
    const availability = await checkAvailability(campaign.route._id, campaign.package, new Date(startDate));
    if (!availability.available) {
      return res.status(400).json({ 
        error: 'No slots available',
        earliestStartDate: availability.earliestStartDate
      });
    }

    // Update campaign
    const packageDays = parseInt(campaign.package);
    const endDate = moment(startDate).add(packageDays, 'days').toDate();

    campaign.status = 'approved';
    campaign.startDate = new Date(startDate);
    campaign.endDate = endDate;
    campaign.approvedBy = req.user._id;
    campaign.approvedAt = new Date();

    await campaign.save();

    res.json({ message: 'Campaign approved successfully' });
  } catch (error) {
    console.error('Approve campaign error:', error);
    res.status(500).json({ error: 'Failed to approve campaign' });
  }
});

// Reject campaign
router.post('/campaigns/:id/reject', authenticateToken, requireAdmin, validateRequest(schemas.rejectCampaign), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({ error: 'Campaign is not pending' });
    }

    campaign.status = 'rejected';
    campaign.rejectionReason = reason;
    campaign.approvedBy = req.user._id;
    campaign.approvedAt = new Date();

    await campaign.save();

    res.json({ message: 'Campaign rejected successfully' });
  } catch (error) {
    console.error('Reject campaign error:', error);
    res.status(500).json({ error: 'Failed to reject campaign' });
  }
});

// Generate playlist for a truck
router.post('/playlists/generate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { truckId, date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    // Get active campaigns for this truck on the target date
    const campaigns = await Campaign.find({
      truck: truckId,
      status: 'approved',
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    }).populate('asset');

    if (campaigns.length === 0) {
      return res.status(400).json({ error: 'No active campaigns for this truck' });
    }

    // Create playlist items
    const playlistItems = campaigns.map(campaign => ({
      id: campaign.asset._id.toString(),
      type: 'video',
      url: campaign.asset.url,
      checksum: campaign.asset.checksum,
      duration: campaign.asset.durationSec,
      loop: false
    }));

    // Generate version
    const version = `v${Date.now()}`;

    // Create or update playlist
    const playlist = await Playlist.findOneAndUpdate(
      { truck: truckId, date: targetDate },
      {
        truck: truckId,
        date: targetDate,
        version,
        items: playlistItems,
        pushStatus: 'pending'
      },
      { upsert: true, new: true }
    );

    res.json({
      id: playlist._id,
      version: playlist.version,
      itemsCount: playlist.items.length,
      truckId: playlist.truck
    });
  } catch (error) {
    console.error('Generate playlist error:', error);
    res.status(500).json({ error: 'Failed to generate playlist' });
  }
});

// Push playlist to truck
router.post('/playlists/:id/push', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Update push status
    playlist.pushStatus = 'pushed';
    playlist.pushedAt = new Date();
    await playlist.save();

    res.json({ message: 'Playlist pushed successfully' });
  } catch (error) {
    console.error('Push playlist error:', error);
    res.status(500).json({ error: 'Failed to push playlist' });
  }
});

// Get truck playlist
router.get('/trucks/:id/playlist', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const playlist = await Playlist.findOne({
      truck: id,
      date: targetDate
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json({
      timestamp: new Date().toISOString(),
      version: playlist.version,
      playlist: playlist.items
    });
  } catch (error) {
    console.error('Get truck playlist error:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

// Admin dashboard
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get statistics
    const [
      totalCampaigns,
      pendingCampaigns,
      activeCampaigns,
      expiringCampaigns,
      totalTrucks,
      onlineTrucks,
      totalAssets,
      totalPayments
    ] = await Promise.all([
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'pending' }),
      Campaign.countDocuments({ status: 'approved' }),
      Campaign.countDocuments({ 
        status: 'approved', 
        endDate: { $lte: tomorrow, $gte: today } 
      }),
      Truck.countDocuments(),
      Truck.countDocuments({ status: 'online' }),
      Asset.countDocuments(),
      require('../models/Payment').countDocuments({ status: 'paid' })
    ]);

    res.json({
      campaigns: {
        total: totalCampaigns,
        pending: pendingCampaigns,
        active: activeCampaigns,
        expiring: expiringCampaigns
      },
      trucks: {
        total: totalTrucks,
        online: onlineTrucks,
        offline: totalTrucks - onlineTrucks
      },
      assets: {
        total: totalAssets
      },
      payments: {
        total: totalPayments
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Generate routes for cities
router.post('/cities/:id/routes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if city exists
    const city = await City.findById(id);
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    // Create truck first
    const truck = new Truck({
      route: null, // Will be updated after route creation
      controllerId: `TRUCK_${Date.now()}`,
      status: 'offline'
    });
    await truck.save();

    // Create route
    const route = new Route({
      city: id,
      name,
      description,
      truck: truck._id
    });
    await route.save();

    // Update truck with route
    truck.route = route._id;
    await truck.save();

    res.status(201).json({
      id: route._id,
      name: route.name,
      truckId: truck._id,
      controllerId: truck.controllerId
    });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

module.exports = router;
