// Test Twilio Verify setup
const { sendOTP, verifyOTP } = require('./utils/twilio');

async function testTwilioSetup() {
  console.log('🧪 Testing Twilio Verify setup...');
  console.log('📱 Make sure your phone number is verified in Twilio Console');
  console.log('🔑 Using Twilio Verify SID:', process.env.TWILIO_VERIFY_SID);
  
  try {
    // Test with your phone number (use E.164 format)
    const testPhone = '+917651816966'; // Replace with your actual phone number in E.164 format
    
    console.log(`📤 Sending OTP to ${testPhone}...`);
    const result = await sendOTP(testPhone);
    
    console.log('✅ OTP sent successfully!');
    console.log('📱 Check your phone for the SMS');
    console.log('📊 Result:', result);
    
    // Test OTP verification
    console.log('\n🔍 To test OTP verification, run:');
    console.log(`node -e "require('./utils/twilio').verifyOTP('${testPhone}', 'YOUR_OTP_HERE').then(console.log)"`);
    
  } catch (error) {
    console.error('❌ Twilio test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if your phone number is verified in Twilio Console');
    console.log('2. Verify your TWILIO_VERIFY_SID in .env file');
    console.log('3. Ensure your Twilio account has SMS credits');
    console.log('4. Check if the phone number format is correct (+91XXXXXXXXXX)');
  }
}

// Only run if called directly
if (require.main === module) {
  testTwilioSetup();
}

module.exports = { testTwilioSetup };
