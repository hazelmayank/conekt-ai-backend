const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  gateway: {
    type: String,
    enum: ['razorpay'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  gatewayPaymentId: {
    type: String
  },
  gatewayOrderId: {
    type: String
  },
  gatewaySignature: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ campaign: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
