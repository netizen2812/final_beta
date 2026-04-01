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

    // Update User using findOneAndUpdate for atomicity & reliability
    let updateFields = {};
    if (planType === 'AI_MONTHLY') {
       const thirtyDaysFromNow = new Date();
       thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
       updateFields = { 
           "features.aiPremiumUntil": thirtyDaysFromNow 
       };
    } else if (planType === 'TARBIYAH_LIFETIME') {
       updateFields = { 
           "features.liveAccess": true,
           role: 'parent' // Ensure they have parent permissions to add children
       };
    }
    
    const updatedUser = await User.findOneAndUpdate(
        { clerkId: userId },
        { 
            $set: updateFields,
            $addToSet: { processedPayments: razorpay_payment_id }
        },
        { new: true }
    );
    
    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Payment successful" });

  } catch (err) {
    console.error("Verify payment exception:", err);
    res.status(500).json({ message: err.message });
  }
};

