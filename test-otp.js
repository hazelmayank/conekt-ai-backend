// Test OTP functionality
const { sendOTP } = require('./utils/mock-twilio');

async function testOTP() {
  console.log('Testing OTP functionality...');
  
  try {
    const otp = await sendOTP('9876543210');
    console.log('✅ OTP generated successfully:', otp);
    console.log('✅ In development mode, OTP is logged to console');
    console.log('✅ In production, OTP would be sent via SMS');
  } catch (error) {
    console.error('❌ OTP test failed:', error);
  }
}

testOTP();
