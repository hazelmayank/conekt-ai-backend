const mongoose = require('mongoose');

const playlistItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'image'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  checksum: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  loop: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const playlistSchema = new mongoose.Schema({
  truck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  items: [playlistItemSchema],
  pushedAt: {
    type: Date
  },
  pushStatus: {
    type: String,
    enum: ['pending', 'pushed', 'failed'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
playlistSchema.index({ truck: 1, date: 1 });
playlistSchema.index({ pushStatus: 1 });

module.exports = mongoose.model('Playlist', playlistSchema);
