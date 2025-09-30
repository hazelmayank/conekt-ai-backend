const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  durationSec: {
    type: Number,
    required: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  validated: {
    type: Boolean,
    default: false
  },
  validationNotes: {
    type: String
  },
  checksum: {
    type: String
  }
}, {
  timestamps: true
});

// Index for owner
assetSchema.index({ owner: 1 });
assetSchema.index({ validated: 1 });

module.exports = mongoose.model('Asset', assetSchema);
