const express = require('express');
const Payment = require('../models/Payment');
const Campaign = require('../models/Campaign');
const { createOrder, verifyPayment } = require('../utils/razorpay');
const { authenticateToken, requireAdvertiser } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Create payment order
router.post('/create', authenticateToken, requireAdvertiser, validateRequest(schemas.createPayment), async (req, res) => {
  try {
    const { campaignId, amount } = req.body;

    // Verify campaign ownership
    const campaign = await Campaign.findOne({ 
      _id: campaignId, 
      advertiser: req.user._id 
    });

    if (!campaign) {
      return res.status(400).json({ error: 'Campaign not found' });
    }

    if (campaign.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Campaign already paid' });
    }

    // Create Razorpay order
    const order = await createOrder(amount, 'INR', `campaign_${campaignId}`);

    // Create payment record
    const payment = new Payment({
      campaign: campaignId,
      gateway: 'razorpay',
      amount,
      gatewayOrderId: order.id
    });

    await payment.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Verify payment
router.post('/verify', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, campaignId } = req.body;

    // Verify payment signature
    const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update payment record
    const payment = await Payment.findOne({ 
      campaign: campaignId, 
      gatewayOrderId: razorpayOrderId 
    });

    if (!payment) {
      return res.status(400).json({ error: 'Payment not found' });
    }

    payment.status = 'paid';
    payment.gatewayPaymentId = razorpayPaymentId;
    payment.gatewaySignature = razorpaySignature;
    await payment.save();

    // Update campaign payment status
    await Campaign.findByIdAndUpdate(campaignId, { 
      paymentStatus: 'paid' 
    });

    res.json({ message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Get payment for campaign
router.get('/:campaignId', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const { campaignId } = req.params;

    const payment = await Payment.findOne({ campaign: campaignId })
      .select('amount status gatewayPaymentId createdAt');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

module.exports = router;
