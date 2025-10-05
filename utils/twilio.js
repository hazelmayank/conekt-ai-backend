const twilio = require('twilio');

const DEV_OTP_CODE = '000000';
const DEV_MODE = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SID || process.env.FORCE_DEV_MODE === 'true';

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map();

let client = null;
if (!DEV_MODE) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Rate limiting function
const checkRateLimit = (phone) => {
  const now = Date.now();
  const key = phone;
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 3; // Max 3 requests per minute
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  
  const requests = rateLimitStore.get(key);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  rateLimitStore.set(key, validRequests);
  
  if (validRequests.length >= maxRequests) {
    const oldestRequest = Math.min(...validRequests);
    const waitTime = Math.ceil((oldestRequest + windowMs - now) / 1000);
    throw new Error(`Too many OTP requests. Please wait ${waitTime} seconds before trying again.`);
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
};

const sendOTP = async (phone) => {
  try {
    // Check rate limit first
    checkRateLimit(phone);
    
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
    
    // Handle specific Twilio errors
    if (error.status === 429) {
      // Rate limit exceeded
      throw new Error('OTP rate limit exceeded. Please wait a few minutes before trying again.');
    } else if (error.status === 400) {
      // Invalid phone number or other validation error
      throw new Error('Invalid phone number format');
    } else if (error.status === 401) {
      // Authentication error
      throw new Error('Twilio authentication failed');
    } else if (error.status === 403) {
      // Permission denied
      throw new Error('Twilio service not available');
    } else {
      // Generic error
      throw new Error('Failed to send OTP. Please try again later.');
    }
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
