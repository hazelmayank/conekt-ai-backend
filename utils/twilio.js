const twilio = require('twilio');

const DEV_OTP_CODE = '000000';
const DEV_MODE = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SID;

let client = null;
if (!DEV_MODE) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const sendOTP = async (phone) => {
  try {
    if (DEV_MODE) {
      // Development mode - return mock OTP
      console.log(`[DEV] OTP for ${phone}: ${DEV_OTP_CODE}`);
      return { dev: true, message: `DEV mode: use code ${DEV_OTP_CODE}`, otp: DEV_OTP_CODE };
    }

    // Use Twilio Verify service
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications
      .create({
        to: phone,
        channel: 'sms'
      });

    console.log(`OTP sent to ${phone} via Twilio Verify`);
    return { sid: verification.sid, status: verification.status };
  } catch (error) {
    console.error('Twilio Verify error:', error);
    throw new Error('Failed to send OTP');
  }
};

const verifyOTP = async (phone, code) => {
  try {
    if (DEV_MODE) {
      // Development mode - accept dev code
      return { valid: code === DEV_OTP_CODE };
    }

    // Use Twilio Verify to check OTP
    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks
      .create({
        to: phone,
        code: code
      });

    return { valid: check.status === 'approved' };
  } catch (error) {
    console.error('Twilio Verify OTP check error:', error);
    return { valid: false };
  }
};

module.exports = {
  sendOTP,
  verifyOTP
};
