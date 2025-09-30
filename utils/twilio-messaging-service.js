// Alternative implementation using Messaging Service
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendOTP = async (phone) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Using Messaging Service (recommended for production)
    await client.messages.create({
      body: `Your Conekt verification code is: ${otp}. This code will expire in 10 minutes.`,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: `+91${phone}`
    });

    return otp;
  } catch (error) {
    console.error('Twilio error:', error);
    throw new Error('Failed to send OTP');
  }
};

module.exports = {
  sendOTP
};
