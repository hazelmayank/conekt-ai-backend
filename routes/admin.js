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
const playlistUtils = require('../utils/playlist');
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
    const endDate = moment(startDate).add(packageDays - 1, 'days').toDate();

    campaign.status = 'approved';
    campaign.startDate = new Date(startDate);
    campaign.endDate = endDate;
    campaign.approvedBy = req.user._id;
    campaign.approvedAt = new Date();

    await campaign.save();

    // Auto-regenerate playlists for this campaign
    try {
      const playlistUtils = require('../utils/playlist');
      const playlistResult = await playlistUtils.regeneratePlaylistForCampaign(campaign._id);
      
      if (playlistResult.success) {
        console.log(`Playlists auto-regenerated for campaign ${campaign._id}:`, playlistResult.summary);
      } else {
        console.error(`Failed to auto-regenerate playlists for campaign ${campaign._id}:`, playlistResult.error);
      }
    } catch (playlistError) {
      console.error('Error auto-regenerating playlists:', playlistError);
    }

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
    
    if (!truckId) {
      return res.status(400).json({ error: 'truckId is required' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const playlistUtils = require('../utils/playlist');
    const result = await playlistUtils.generatePlaylistForTruck(truckId, targetDate);

    if (!result.success) {
      return res.status(400).json({ 
        error: 'Failed to generate playlist',
        details: result.error 
      });
    }

    res.json({
      id: result.playlist._id,
      version: result.version,
      itemsCount: result.itemsCount,
      truckId: truckId
    });
  } catch (error) {
    console.error('Generate playlist error:', error);
    res.status(500).json({ 
      error: 'Failed to generate playlist',
      details: error.message 
    });
  }
});

// Generate playlists for all trucks
router.post('/playlists/generate-all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    
    const playlistUtils = require('../utils/playlist');
    const result = await playlistUtils.generatePlaylistsForAllTrucks(targetDate);

    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to generate playlists',
        details: result.error 
      });
    }

    res.json({
      message: 'Playlists generated for all trucks',
      summary: result.summary,
      results: result.results
    });
  } catch (error) {
    console.error('Generate all playlists error:', error);
    res.status(500).json({ 
      error: 'Failed to generate playlists for all trucks',
      details: error.message 
    });
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

// Get playlist statistics
router.get('/playlists/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await playlistUtils.getPlaylistStats();
    
    if (!stats.success) {
      return res.status(500).json({ 
        error: 'Failed to get playlist stats',
        details: stats.error 
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('Get playlist stats error:', error);
    res.status(500).json({ error: 'Failed to get playlist statistics' });
  }
});

// Manual playlist refresh for all trucks
router.post('/playlists/refresh-all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    
    const result = await playlistUtils.generatePlaylistsForAllTrucks(targetDate);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to refresh playlists',
        details: result.error 
      });
    }

    res.json({
      message: 'Playlists refreshed successfully',
      timestamp: new Date().toISOString(),
      summary: result.summary,
      results: result.results
    });
  } catch (error) {
    console.error('Manual playlist refresh error:', error);
    res.status(500).json({ error: 'Failed to manually refresh playlists' });
  }
});

// Get scheduler status
router.get('/scheduler/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!global.playlistScheduler) {
      return res.json({
        enabled: false,
        message: 'Scheduler not initialized'
      });
    }

    const basicStatus = {
      enabled: global.playlistScheduler ? global.playlistScheduler.isEnabled : false,
      tasksCount: global.playlistScheduler ? global.playlistScheduler.tasks.size : 0,
      uptime: process.uptime(),
      message: 'Scheduler running with auto-refresh, daily generation, and morning checks'
    };
    res.json(basicStatus);
  } catch (error) {
    console.error('Get scheduler status error:', error);
    res.status(500).json({ error: 'Failed to get scheduler status' });
  }
});

// Trigger manual playlist refresh via scheduler
router.post('/scheduler/refresh', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { date } = req.body;
    
    if (!global.playlistScheduler) {
      return res.status(500).json({ error: 'Scheduler not available' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const result = await global.playlistScheduler.triggerManualRefresh(targetDate);
    
    res.json({
      message: result.success ? 'Manual refresh triggered successfully' : 'Manual refresh failed',
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error('Trigger manual playback error:', error);
    res.status(500).json({ error: 'Failed to trigger manual refresh' });
  }
});

// Delete all campaigns on a specific route within a date range
router.delete('/routes/:routeId/campaigns', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { routeId } = req.params;
    const { startDate, endDate } = req.body;
    
    // Verify route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Build query for campaigns on this route
    let query = { route: routeId };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query.startDate = { 
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get campaigns matching the criteria
    const campaigns = await Campaign.find(query);
    
    if (campaigns.length === 0) {
      const message = startDate && endDate 
        ? `No campaigns found on this route between ${startDate} and ${endDate}`
        : 'No campaigns found on this route';
      
      return res.json({ 
        message,
        deletedCount: 0,
        routeName: route.name,
        dateRange: startDate && endDate ? { startDate, endDate } : null
      });
    }

    // Delete campaigns matching the criteria
    const deleteResult = await Campaign.deleteMany(query);
    
    // Log the action
    const logMessage = startDate && endDate 
      ? `Admin ${req.user._id} deleted ${deleteResult.deletedCount} campaigns from route ${routeId} (${route.name}) between ${startDate} and ${endDate}`
      : `Admin ${req.user._id} deleted ${deleteResult.deletedCount} campaigns from route ${routeId} (${route.name})`;
    
    console.log(logMessage);
    
    const message = startDate && endDate 
      ? `Successfully deleted ${deleteResult.deletedCount} campaigns from route between ${startDate} and ${endDate}`
      : `Successfully deleted ${deleteResult.deletedCount} campaigns from route`;
    
    res.json({
      message,
      deletedCount: deleteResult.deletedCount,
      routeName: route.name,
      routeId: routeId,
      dateRange: startDate && endDate ? { startDate, endDate } : null
    });
  } catch (error) {
    console.error('Delete route campaigns error:', error);
    res.status(500).json({ error: 'Failed to delete campaigns' });
  }
});

module.exports = router;
