// Comprehensive API testing script
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let authToken = '';
let adminToken = '';

// Test data
const testPhone = '+917651816966'; // Replace with your verified number
const adminPhone = '+919999999999';

async function testAPI() {
  console.log('🧪 Starting Comprehensive API Tests...\n');

  try {
    // Test 1: Health Check
    await testHealthCheck();
    
    // Test 2: Authentication Flow
    await testAuthentication();
    
    // Test 3: Advertiser APIs
    await testAdvertiserAPIs();
    
    // Test 4: Admin APIs
    await testAdminAPIs();
    
    // Test 5: Hardware APIs
    await testHardwareAPIs();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testHealthCheck() {
  console.log('1️⃣ Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', response.data);
  } catch (error) {
    console.error('❌ Health Check failed:', error.message);
  }
  console.log('');
}

async function testAuthentication() {
  console.log('2️⃣ Testing Authentication Flow...');
  
  try {
    // Register new user
    console.log('📝 Registering user...');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test User',
      phone: testPhone,
      role: 'advertiser'
    });
    console.log('✅ Registration:', registerResponse.data);
    
    // Note: In development mode, use the dev code '000000'
    // In production, check your phone for the actual OTP
    const otpCode = '000000'; // Use actual OTP from SMS in production
    
    // Verify registration OTP
    console.log('🔐 Verifying registration OTP...');
    const verifyResponse = await axios.post(`${BASE_URL}/api/auth/register/verify`, {
      phone: testPhone,
      otp: otpCode
    });
    console.log('✅ Registration Verified:', verifyResponse.data);
    authToken = verifyResponse.data.token;
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
  }
  console.log('');
}

async function testAdvertiserAPIs() {
  console.log('3️⃣ Testing Advertiser APIs...');
  
  if (!authToken) {
    console.log('⚠️ Skipping advertiser tests - no auth token');
    return;
  }
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    // Get Cities
    console.log('🏙️ Getting cities...');
    const citiesResponse = await axios.get(`${BASE_URL}/api/cities`, { headers });
    console.log('✅ Cities:', citiesResponse.data);
    
    if (citiesResponse.data.length > 0) {
      const cityId = citiesResponse.data[0]._id;
      
      // Get Routes for first city
      console.log('🛣️ Getting routes for city...');
      const routesResponse = await axios.get(`${BASE_URL}/api/cities/${cityId}/routes`, { headers });
      console.log('✅ Routes:', routesResponse.data);
      
      if (routesResponse.data.length > 0) {
        const routeId = routesResponse.data[0]._id;
        
        // Check availability
        console.log('📅 Checking availability...');
        const availabilityResponse = await axios.post(`${BASE_URL}/api/availability/check`, {
          routeId: routeId,
          package: '7',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, { headers });
        console.log('✅ Availability:', availabilityResponse.data);
      }
    }
    
    // Get user's campaigns
    console.log('📊 Getting user campaigns...');
    const campaignsResponse = await axios.get(`${BASE_URL}/api/campaigns/mine`, { headers });
    console.log('✅ User Campaigns:', campaignsResponse.data);
    
    // Get user profile
    console.log('👤 Getting user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/profile`, { headers });
    console.log('✅ User Profile:', profileResponse.data);
    
    // Test OTP-based login for existing user
    console.log('🔐 Testing OTP-based login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      phone: testPhone
    });
    console.log('✅ Login OTP Sent:', loginResponse.data);
    
    // Verify login OTP
    const loginVerifyResponse = await axios.post(`${BASE_URL}/api/auth/login/verify`, {
      phone: testPhone,
      otp: '000000'
    });
    console.log('✅ Login Verified:', loginVerifyResponse.data);
    
  } catch (error) {
    console.error('❌ Advertiser API test failed:', error.response?.data || error.message);
  }
  console.log('');
}

async function testAdminAPIs() {
  console.log('4️⃣ Testing Admin APIs...');
  
  try {
    // Register admin user
    console.log('👨‍💼 Registering admin user...');
    const adminRegisterResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Admin User',
      phone: adminPhone,
      role: 'admin'
    });
    console.log('✅ Admin Registration:', adminRegisterResponse.data);
    
    // Verify admin registration OTP
    console.log('🔐 Verifying admin registration OTP...');
    const adminVerifyResponse = await axios.post(`${BASE_URL}/api/auth/register/verify`, {
      phone: adminPhone,
      otp: '000000' // Use actual OTP in production
    });
    console.log('✅ Admin Registration Verified:', adminVerifyResponse.data);
    adminToken = adminVerifyResponse.data.token;
    
    if (!adminToken) {
      console.log('⚠️ Skipping admin tests - no admin token');
      return;
    }
    
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    
    // Get admin dashboard
    console.log('📊 Getting admin dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/api/admin/dashboard`, { headers: adminHeaders });
    console.log('✅ Admin Dashboard:', dashboardResponse.data);
    
    // Get pending campaigns
    console.log('📋 Getting pending campaigns...');
    const campaignsResponse = await axios.get(`${BASE_URL}/api/admin/campaigns?status=pending`, { headers: adminHeaders });
    console.log('✅ Pending Campaigns:', campaignsResponse.data);
    
    // Get trucks
    console.log('🚛 Getting trucks...');
    const trucksResponse = await axios.get(`${BASE_URL}/api/trucks`, { headers: adminHeaders });
    console.log('✅ Trucks:', trucksResponse.data);
    
    // Test OTP-based login for admin
    console.log('🔐 Testing admin OTP-based login...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      phone: adminPhone
    });
    console.log('✅ Admin Login OTP Sent:', adminLoginResponse.data);
    
    // Verify admin login OTP
    const adminLoginVerifyResponse = await axios.post(`${BASE_URL}/api/auth/login/verify`, {
      phone: adminPhone,
      otp: '000000'
    });
    console.log('✅ Admin Login Verified:', adminLoginVerifyResponse.data);
    
  } catch (error) {
    console.error('❌ Admin API test failed:', error.response?.data || error.message);
  }
  console.log('');
}

async function testHardwareAPIs() {
  console.log('5️⃣ Testing Hardware APIs...');
  
  const apiKey = process.env.API_SECRET_KEY || 'your-api-secret-key-for-hardware-auth';
  
  try {
    // Test truck heartbeat
    console.log('💓 Testing truck heartbeat...');
    const heartbeatResponse = await axios.post(`${BASE_URL}/api/hardware/TRUCK_001/heartbeat`, {
      device_id: 'TRUCK_001',
      status: 'online',
      uptime_seconds: 3600,
      last_ad_playback_timestamp: new Date().toISOString()
    }, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Heartbeat Response:', heartbeatResponse.data);
    
    // Test get playlist
    console.log('📋 Testing get playlist...');
    const playlistResponse = await axios.get(`${BASE_URL}/api/hardware/TRUCK_001/playlist`, {
      headers: {
        'x-api-key': apiKey
      }
    });
    console.log('✅ Playlist Response:', playlistResponse.data);
    
    // Test telemetry
    console.log('📊 Testing telemetry...');
    const telemetryResponse = await axios.get(`${BASE_URL}/api/hardware/TRUCK_001/telemetry`, {
      headers: {
        'x-api-key': apiKey
      }
    });
    console.log('✅ Telemetry Response:', telemetryResponse.data);
    
  } catch (error) {
    console.error('❌ Hardware API test failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Run if called directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
