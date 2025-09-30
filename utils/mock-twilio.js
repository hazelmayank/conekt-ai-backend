// Mock Twilio for development testing
const sendOTP = async (phone) => {
  // Generate a predictable OTP for testing
  const otp = '123456'; // Fixed OTP for development
  
  console.log(`[MOCK] OTP for ${phone}: ${otp}`);
  console.log(`[MOCK] In production, this would be sent via SMS`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return otp;
};

module.exports = {
  sendOTP
};
