import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

export const createOrder = async (req, res) => {
  try {
    const { planType } = req.body;
    let amount = 0;
    
    if (planType === 'AI_MONTHLY') {
      amount = 79 * 100; // Rs 79 in paise
    } else if (planType === 'TARBIYAH_LIFETIME') {
      amount = 699 * 100; // Rs 699 in paise
    } else {
      return res.status(400).json({ message: 'Invalid plan type' });
    }
    
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Razorpay keys missing from .env' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}_${planType}`
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({ message: 'Error creating order' });
    }

    res.json({ ...order, planType });
  } catch (err) {
    console.error("Create order exception:", err);
    res.status(500).json({ message: err.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planType
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!secret) return res.status(500).json({ message: 'Razorpay secret missing' });
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid Signature" });
    }

    // Grant Access
    const userId = req.auth.userId;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (planType === 'AI_MONTHLY') {
       // Unlock for exactly 30 days
       const thirtyDaysFromNow = new Date();
       thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
       
       user.features = user.features || {};
       user.features.aiPremiumUntil = thirtyDaysFromNow;
       user.markModified('features');
    } else if (planType === 'TARBIYAH_LIFETIME') {
       user.features = user.features || {};
       user.features.liveAccess = true;
       user.markModified('features');
    }
    
    await user.save();

    res.json({ message: "Payment successful" });

  } catch (err) {
    console.error("Verify payment exception:", err);
    res.status(500).json({ message: err.message });
  }
};
