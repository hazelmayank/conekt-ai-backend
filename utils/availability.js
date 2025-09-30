const Campaign = require('../models/Campaign');
const moment = require('moment');

const checkAvailability = async (routeId, package, startDate) => {
  try {
    const packageDays = parseInt(package);
    const endDate = moment(startDate).add(packageDays, 'days').toDate();

    // Get all active campaigns for this route
    const activeCampaigns = await Campaign.find({
      route: routeId,
      status: { $in: ['approved', 'live'] },
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    }).sort({ endDate: 1 });

    // If less than 7 campaigns, slot is available
    if (activeCampaigns.length < 7) {
      return {
        available: true,
        earliestStartDate: startDate,
        conflictingCampaigns: []
      };
    }

    // Find the earliest end date among active campaigns
    const earliestEndDate = activeCampaigns[0].endDate;
    const nextAvailableDate = moment(earliestEndDate).add(1, 'day').toDate();

    return {
      available: false,
      earliestStartDate: nextAvailableDate,
      conflictingCampaigns: activeCampaigns.slice(0, 7)
    };
  } catch (error) {
    console.error('Availability check error:', error);
    throw new Error('Failed to check availability');
  }
};

const getRouteCapacity = async (routeId) => {
  try {
    const today = new Date();
    
    // Get current active campaigns
    const activeCampaigns = await Campaign.find({
      route: routeId,
      status: { $in: ['approved', 'live'] },
      endDate: { $gte: today }
    }).populate('asset', 'durationSec');

    const totalSlots = 7;
    const usedSlots = activeCampaigns.length;
    const availableSlots = totalSlots - usedSlots;

    return {
      totalSlots,
      usedSlots,
      availableSlots,
      campaigns: activeCampaigns
    };
  } catch (error) {
    console.error('Route capacity error:', error);
    throw new Error('Failed to get route capacity');
  }
};

module.exports = {
  checkAvailability,
  getRouteCapacity
};
