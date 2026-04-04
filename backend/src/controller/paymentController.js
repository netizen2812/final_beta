import User from '../models/User.js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import Razorpay from 'razorpay';
import crypto from 'crypto';

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
    const userId = req.auth?.userId;
    const guestEmail = req.body.email?.toLowerCase();
    
    let user;
    if (userId) {
        user = await User.findOne({ clerkId: userId });
    } else if (guestEmail) {
        user = await User.findOne({ email: guestEmail });
    }

    if (!user && guestEmail) {
        // GUEST FLOW: Create user by email if not exists
        console.log(`🎁 Creating guest user for payment: ${guestEmail}`);
        user = await User.create({
            email: guestEmail,
            role: 'parent',
            features: { liveAccess: false, aiPremiumUntil: null }
        });
    }
    
    // SELF-HEALING: If Clerk user missing from DB but we have their ID
    if (!user && userId) {
        console.log(`🛠️ Self-healing missing user during payment verification: ${userId}`);
        try {
            const clerkUser = await clerkClient.users.getUser(userId);
            const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
            const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
            
            user = await User.create({
                clerkId: userId,
                email,
                name,
                role: 'parent',
                features: { liveAccess: false, aiPremiumUntil: null }
            });
        } catch (clerkErr) {
            console.error("Clerk sync failed in payment verification:", clerkErr.message);
            return res.status(404).json({ message: "User not found and sync recovery failed" });
        }
    }

    if (!user) {
        return res.status(400).json({ message: "No user found or email provided for guest payment" });
    }

    // Update User using findOneAndUpdate for atomicity & reliability
    let updateFields = {};
    if (planType === 'AI_MONTHLY') {
       const thirtyDaysFromNow = new Date();
       thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
       updateFields = { "features.aiPremiumUntil": thirtyDaysFromNow };
    } else if (planType === 'TARBIYAH_LIFETIME') {
       updateFields = { 
           "features.liveAccess": true,
           role: 'parent' 
       };
    }
    
    const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { 
            $set: updateFields,
            $addToSet: { processedPayments: razorpay_payment_id }
        },
        { new: true }
    );
    
    if (!updatedUser) {
        return res.status(500).json({ message: "Error updating user after verification" });
    }

    res.json({ message: "Payment successful" });

  } catch (err) {
    console.error("Verify payment exception:", err);
    res.status(500).json({ message: err.message });
  }
};

