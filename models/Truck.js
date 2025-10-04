const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  controllerId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance'],
    default: 'offline'
  },
  lastHeartbeatAt: {
    type: Date
  },
  uptimeSeconds: {
    type: Number,
    default: 0
  },
  lastAdPlaybackTimestamp: {
    type: Date
  },
  gpsCoordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
      validate: {
        validator: function(v) {
          return v === null || (typeof v === 'number' && !isNaN(v));
        },
        message: 'Latitude must be a valid number between -90 and 90'
      }
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
      validate: {
        validator: function(v) {
          return v === null || (typeof v === 'number' && !isNaN(v));
        },
        message: 'Longitude must be a valid number between -180 and 180'
      }
    },
    timestamp: {
      type: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes are automatically created for unique fields and we can add additional ones if needed
truckSchema.index({ status: 1 });

module.exports = mongoose.model('Truck', truckSchema);
