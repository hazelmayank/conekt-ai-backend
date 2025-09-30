// Seed test data for development
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const City = require('../models/City');
const Route = require('../models/Route');
const Truck = require('../models/Truck');
const User = require('../models/User');

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test cities
    const cities = await City.insertMany([
      { name: 'Mumbai', enabled: true, description: 'Financial capital of India' },
      { name: 'Delhi', enabled: true, description: 'Capital of India' },
      { name: 'Bangalore', enabled: true, description: 'IT hub of India' }
    ]);
    console.log('✅ Cities created:', cities.length);

    // Create test routes first
    const routes = await Route.insertMany([
      { city: cities[0]._id, name: 'Marine Drive Route', description: 'Scenic route along Marine Drive', truck: null },
      { city: cities[1]._id, name: 'Connaught Place Route', description: 'Central business district', truck: null },
      { city: cities[2]._id, name: 'MG Road Route', description: 'Main commercial street', truck: null }
    ]);
    console.log('✅ Routes created:', routes.length);

    // Create test trucks with route references
    const trucks = await Truck.insertMany([
      { route: routes[0]._id, controllerId: 'TRUCK_001', status: 'online' },
      { route: routes[1]._id, controllerId: 'TRUCK_002', status: 'offline' },
      { route: routes[2]._id, controllerId: 'TRUCK_003', status: 'online' }
    ]);
    console.log('✅ Trucks created:', trucks.length);

    // Update routes with truck references
    for (let i = 0; i < routes.length; i++) {
      routes[i].truck = trucks[i]._id;
      await routes[i].save();
    }

    // Create admin user
    const adminUser = new User({
      phone: '9999999999',
      role: 'admin'
    });
    await adminUser.save();
    console.log('✅ Admin user created');

    console.log('\n🎉 Test data seeded successfully!');
    console.log('\n📋 Test Data Summary:');
    console.log(`Cities: ${cities.length}`);
    console.log(`Routes: ${routes.length}`);
    console.log(`Trucks: ${trucks.length}`);
    console.log('Admin Phone: 9999999999');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
