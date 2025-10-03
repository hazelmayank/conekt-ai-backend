const mongoose = require('mongoose');
const moment = require('moment');
const Campaign = require('../models/Campaign'); // Ensure you import the correct model

// MongoDB URI (Update with your actual Mongo URI)
const dbURI = 'mongodb+srv://mayankjeefinal:Mayank%406696@mayankfirstdb.vva4taq.mongodb.net/conekt-ai-db';

const seedCampaigns = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Sample data (repeated for multiple campaigns)
    const campaigns = [];
    const advertiserId = '68da4a16e539eae777e28d20';
    const routeId = '68da17212d8ff0001d095d83';
    const truckId = '68da17212d8ff0001d095d88';
    const assetId = '68da8168325d28ed8aaca296';
    const approvedById = '68da7c6b325d28ed8aaca275';
    
    // Loop to create 6 campaigns (1-15 of the month)
    for (let i = 0; i < 6; i++) {
      const startDate = moment().month(9).date(1 + i * 2).hour(0).minute(0).second(0).toDate(); // 1st, 3rd, 5th, etc.
      const endDate = moment(startDate).add(15, 'days').subtract(1, 'second').toDate(); // 15 days later

      const campaign = {
        advertiser: advertiserId,
        route: routeId,
        truck: truckId,
        asset: assetId,
        package: '15', // 15-day package
        startDate: startDate,
        endDate: endDate,
        status: 'approved',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: approvedById
      };

      campaigns.push(campaign);
    }

    // Insert the campaigns into MongoDB
    await Campaign.insertMany(campaigns);

    console.log('6 campaigns successfully seeded!');
    mongoose.connection.close(); // Close connection after seeding
  } catch (error) {
    console.error('Error seeding campaigns:', error);
    mongoose.connection.close();
  }
};

// Run the seeding script
seedCampaigns();
