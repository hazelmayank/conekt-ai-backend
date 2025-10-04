const Campaign = require('../models/Campaign');
const Playlist = require('../models/Playlist');
const Truck = require('../models/Truck');

/**
 * Generate playlist for a specific truck and date
 * @param {String} truckId - Truck ID
 * @param {Date} date - Target date (defaults to today)
 * @returns {Object} Generated playlist data
 */
const generatePlaylistForTruck = async (truckId, date = new Date()) => {
  try {
    console.log(`Generating playlist for truck ${truckId} on date ${date}`);

    // Verify truck exists
    const truck = await Truck.findById(truckId);
    if (!truck) {
      throw new Error(`Truck ${truckId} not found`);
    }

    // Get active campaigns for this truck on the target date
    const campaigns = await Campaign.find({
      truck: truckId,
      status: 'approved',
      startDate: { $lte: date },
      endDate: { $gte: date }
    }).populate('asset');

    console.log({ truckId, date, campaignCount: campaigns.length });

    if (campaigns.length === 0) {
      // Create empty playlist if no campaigns
      const version = `v${Date.now()}_empty`;
      const playlist = await Playlist.findOneAndUpdate(
        { truck: truckId, date: date },
        {
          truck: truckId,
          date: date,
          version,
          items: [],
          pushStatus: 'pending'
        },
        { upsert: true, new: true }
      );

      return {
        success: true,
        playlist,
        itemsCount: 0,
        version
      };
    }

    // Create playlist items from campaigns
    const playlistItems = campaigns.map(campaign => {
      if (!campaign.asset) {
        throw new Error(`Campaign ${campaign._id} has no asset`);
      }
      
      return {
        id: campaign.asset._id.toString(),
        type: 'video',
        url: campaign.asset.url,
        checksum: campaign.asset.checksum || 'no-checksum',
        duration: campaign.asset.durationSec,
        loop: false
      };
    });

    // Generate version with timestamp
    const version = `v${Date.now()}`;

    // Create or update playlist
    const playlist = await Playlist.findOneAndUpdate(
      { truck: truckId, date: date },
      {
        truck: truckId,
        date: date,
        version,
        items: playlistItems,
        pushStatus: 'pending',
        isActive: true
      },
      { upsert: true, new: true }
    );

    console.log(`Playlist generated successfully: ${playlist._id}`);

    return {
      success: true,
      playlist,
      itemsCount: playlistItems.length,
      version
    };
  } catch (error) {
    console.error('Error generating playlist:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate playlists for all trucks for a specific date
 * @param {Date} date - Target date (defaults to today)
 * @returns {Object} Summary of playlist generation results
 */
const generatePlaylistsForAllTrucks = async (date = new Date()) => {
  try {
    console.log(`Generating playlists for all trucks on date ${date}`);

    // Get all active trucks
    const trucks = await Truck.find({}).select('_id');
    
    if (trucks.length === 0) {
      return {
        success: true,
        message: 'No trucks found',
        results: [],
        summary: { total: 0, successful: 0, failed: 0 }
      };
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Generate playlist for each truck
    for (const truck of trucks) {
      const result = await generatePlaylistForTruck(truck._id, date);
      results.push({
        truckId: truck._id,
        ...result
      });

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log(`Playlist generation completed: ${successCount} successful, ${failureCount} failed`);

    return {
      success: true,
      results,
      summary: {
        total: trucks.length,
        successful: successCount,
        failed: failureCount
      }
    };
  } catch (error) {
    console.error('Error generating playlists for all trucks:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Regenerate playlist for trucks affected by a specific campaign
 * @param {String} campaignId - Campaign ID
 * @returns {Object} Results of playlist regeneration
 */
const regeneratePlaylistForCampaign = async (campaignId) => {
  try {
    console.log(`Regenerating playlists for campaign ${campaignId}`);

    // Get campaign details
    const campaign = await Campaign.findById(campaignId).populate('asset truck');
    
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (!campaign.truck) {
      throw new Error(`Campaign ${campaignId} has no associated truck`);
    }

    // Calculate date range for the campaign
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    
    // Generate playlists for each day of the campaign
    const results = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const date = new Date(currentDate);
      const result = await generatePlaylistForTruck(campaign.truck._id, date);
      
      results.push({
        truckId: campaign.truck._id,
        date: date,
        ...result
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Playlist regeneration completed for campaign ${campaignId}`);

    return {
      success: true,
      campaignId,
      results,
      summary: {
        totalDays: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  } catch (error) {
    console.error('Error regenerating playlists for campaign:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get playlist statistics for monitoring
 * @returns {Object} Playlist statistics
 */
const getPlaylistStats = async () => {
  try {
    const stats = await Playlist.aggregate([
      {
        $group: {
          _id: '$pushStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalPlaylists = await Playlist.countDocuments();
    const activePlaylists = await Playlist.countDocuments({ isActive: true });
    const pendingPlaylists = await Playlist.countDocuments({ pushStatus: 'pending' });

    return {
      success: true,
      totalPlaylists,
      activePlaylists,
      pendingPlaylists,
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting playlist stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generatePlaylistForTruck,
  generatePlaylistsForAllTrucks,
  regeneratePlaylistForCampaign,
  getPlaylistStats
};
