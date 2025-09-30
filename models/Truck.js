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
