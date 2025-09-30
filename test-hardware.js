// Test hardware endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'your-api-secret-key-for-hardware-auth'; // Set this in your .env

async function testHardwareEndpoints() {
  console.log('🧪 Testing Hardware Endpoints...');
  
  try {
    // Test truck heartbeat
    console.log('\n📡 Testing truck heartbeat...');
    const heartbeatResponse = await axios.post(`${BASE_URL}/api/hardware/TRUCK_001/heartbeat`, {
      device_id: 'TRUCK_001',
      status: 'online',
      uptime_seconds: 3600,
      last_ad_playback_timestamp: new Date().toISOString()
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Heartbeat response:', heartbeatResponse.data);

    // Test get playlist
    console.log('\n📋 Testing get playlist...');
    const playlistResponse = await axios.get(`${BASE_URL}/api/hardware/TRUCK_001/playlist`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    console.log('✅ Playlist response:', playlistResponse.data);

    // Test telemetry
    console.log('\n📊 Testing telemetry...');
    const telemetryResponse = await axios.get(`${BASE_URL}/api/hardware/TRUCK_001/telemetry`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    console.log('✅ Telemetry response:', telemetryResponse.data);

  } catch (error) {
    console.error('❌ Hardware test failed:', error.response?.data || error.message);
  }
}

// Only run if called directly
if (require.main === module) {
  testHardwareEndpoints();
}

module.exports = { testHardwareEndpoints };
