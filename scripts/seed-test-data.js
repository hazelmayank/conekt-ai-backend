// Comprehensive test data seeding
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const City = require('../models/City');
const Route = require('../models/Route');
const Truck = require('../models/Truck');
const User = require('../models/User');
const Asset = require('../models/Asset');
const Campaign = require('../models/Campaign');

async function seedTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      City.deleteMany({}),
      Route.deleteMany({}),
      Truck.deleteMany({}),
      User.deleteMany({}),
      Asset.deleteMany({}),
      Campaign.deleteMany({})
    ]);
    console.log('🧹 Cleared existing data');

    // 1. Create Cities
    const cities = await City.insertMany([
      { 
        name: 'Mumbai', 
        enabled: true, 
        description: 'Financial capital of India' 
      },
      { 
        name: 'Delhi', 
        enabled: true, 
        description: 'Capital of India' 
      },
      { 
        name: 'Bangalore', 
        enabled: true, 
        description: 'IT hub of India' 
      },
      { 
        name: 'Chennai', 
        enabled: true, 
        description: 'Cultural capital of South India' 
      }
    ]);
    console.log(`✅ Created ${cities.length} cities`);

    // 2. Create Routes first (without trucks)
    const routes = await Route.insertMany([
      { 
        city: cities[0]._id, 
        name: 'Marine Drive Route', 
        description: 'Scenic route along Marine Drive, Mumbai',
        truck: null, // Will be updated after truck creation
        isActive: true
      },
      { 
        city: cities[1]._id, 
        name: 'Connaught Place Route', 
        description: 'Central business district, Delhi',
        truck: null,
        isActive: true
      },
      { 
        city: cities[2]._id, 
        name: 'MG Road Route', 
        description: 'Main commercial street, Bangalore',
        truck: null,
        isActive: true
      },
      { 
        city: cities[3]._id, 
        name: 'Marina Beach Route', 
        description: 'Coastal route along Marina Beach, Chennai',
        truck: null,
        isActive: true
      }
    ]);
    console.log(`✅ Created ${routes.length} routes`);

    // 3. Create Trucks with route references
    const trucks = await Truck.insertMany([
      { 
        route: routes[0]._id,
        controllerId: 'TRUCK_001', 
        status: 'online',
        lastHeartbeatAt: new Date(),
        uptimeSeconds: 3600
      },
      { 
        route: routes[1]._id,
        controllerId: 'TRUCK_002', 
        status: 'offline',
        lastHeartbeatAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        uptimeSeconds: 7200
      },
      { 
        route: routes[2]._id,
        controllerId: 'TRUCK_003', 
        status: 'online',
        lastHeartbeatAt: new Date(),
        uptimeSeconds: 1800
      },
      { 
        route: routes[3]._id,
        controllerId: 'TRUCK_004', 
        status: 'maintenance',
        lastHeartbeatAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        uptimeSeconds: 0
      }
    ]);
    console.log(`✅ Created ${trucks.length} trucks`);

    // 4. Update routes with truck references
    for (let i = 0; i < routes.length; i++) {
      routes[i].truck = trucks[i]._id;
      await routes[i].save();
    }
    console.log('✅ Updated routes with trucks');

    // 5. Create Users
    const users = await User.insertMany([
      {
        phone: '9999999999',
        role: 'admin'
      },
      {
        phone: '8888888888',
        role: 'advertiser'
      },
      {
        phone: '7777777777',
        role: 'advertiser'
      }
    ]);
    console.log(`✅ Created ${users.length} users`);

    // 6. Create Sample Assets
    const assets = await Asset.insertMany([
      {
        owner: users[1]._id,
        url: 'https://res.cloudinary.com/demo/video/upload/sample-video-1.mp4',
        publicId: 'sample-video-1',
        durationSec: 30,
        fileSize: 1024000,
        mimeType: 'video/mp4',
        validated: true,
        checksum: 'abc123def456'
      },
      {
        owner: users[1]._id,
        url: 'https://res.cloudinary.com/demo/video/upload/sample-video-2.mp4',
        publicId: 'sample-video-2',
        durationSec: 45,
        fileSize: 1536000,
        mimeType: 'video/mp4',
        validated: true,
        checksum: 'def456ghi789'
      },
      {
        owner: users[2]._id,
        url: 'https://res.cloudinary.com/demo/video/upload/sample-video-3.mp4',
        publicId: 'sample-video-3',
        durationSec: 60,
        fileSize: 2048000,
        mimeType: 'video/mp4',
        validated: false,
        checksum: 'ghi789jkl012'
      }
    ]);
    console.log(`✅ Created ${assets.length} assets`);

    // 7. Create Sample Campaigns
    const campaigns = await Campaign.insertMany([
      {
        advertiser: users[1]._id,
        route: routes[0]._id,
        truck: trucks[0]._id,
        asset: assets[0]._id,
        package: '7',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'approved',
        paymentStatus: 'paid'
      },
      {
        advertiser: users[1]._id,
        route: routes[1]._id,
        truck: trucks[1]._id,
        asset: assets[1]._id,
        package: '15',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
        status: 'pending',
        paymentStatus: 'pending'
      },
      {
        advertiser: users[2]._id,
        route: routes[2]._id,
        truck: trucks[2]._id,
        asset: assets[2]._id,
        package: '30',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        status: 'pending',
        paymentStatus: 'pending'
      }
    ]);
    console.log(`✅ Created ${campaigns.length} campaigns`);

    console.log('\n🎉 Test data seeded successfully!');
    console.log('\n📋 Test Data Summary:');
    console.log(`Cities: ${cities.length}`);
    console.log(`Routes: ${routes.length}`);
    console.log(`Trucks: ${trucks.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Assets: ${assets.length}`);
    console.log(`Campaigns: ${campaigns.length}`);
    
    console.log('\n👥 Test Users:');
    console.log('Admin: 9999999999');
    console.log('Advertiser 1: 8888888888');
    console.log('Advertiser 2: 7777777777');
    
    console.log('\n🏙️ Test Cities:');
    cities.forEach(city => console.log(`- ${city.name} (${city._id})`));
    
    console.log('\n🚛 Test Trucks:');
    trucks.forEach(truck => console.log(`- ${truck.controllerId} (${truck.status})`));

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData();
}

module.exports = { seedTestData };
