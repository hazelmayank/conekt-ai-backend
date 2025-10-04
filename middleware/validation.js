const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details[0].message 
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  sendOTP: Joi.object({
    phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required()
  }),
  
  register: Joi.object({
    role: Joi.string().valid('advertiser', 'admin').default('advertiser'),
    name: Joi.string().min(2).max(80).required(),
    phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required()
  }),
  
  verifyRegistration: Joi.object({
    phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required(),
    otp: Joi.string().length(6).required()
  }),
  
  login: Joi.object({
    phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required()
  }),
  
  verifyOTP: Joi.object({
    phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required(),
    otp: Joi.string().length(6).required()
  }),
  
  createCampaign: Joi.object({
    routeId: Joi.string().required(),
    assetId: Joi.string().required(),
    package: Joi.string().valid('7', '15', '30').required(),
    startDate: Joi.date().required()
  }),
  
  checkAvailability: Joi.object({
    routeId: Joi.string().required(),
    package: Joi.string().valid('15', '30').required(),
    startDate: Joi.date().required()
  }),
  
  approveCampaign: Joi.object({
    startDate: Joi.date().required()
  }),
  
  rejectCampaign: Joi.object({
    reason: Joi.string().min(10).max(500).required()
  }),
  
  createPayment: Joi.object({
    campaignId: Joi.string().required(),
    amount: Joi.number().positive().required()
  }),
  
  truckHeartbeat: Joi.object({
    device_id: Joi.string().required(),
    status: Joi.string().valid('online', 'offline').required(),
    uptime_seconds: Joi.number().min(0).required(),
    last_ad_playback_timestamp: Joi.date().optional(),
    gps_coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      timestamp: Joi.date().optional()
    }).optional()
  })
};

module.exports = {
  validateRequest,
  schemas
};
