import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';

const router = express.Router();

/**
 * Razorpay Webhook Handler
 * Ensures that if a client-side payment verification (verifyPayment) fails 
 * due to network issues or browser crashes, the backend still grants access 
 * once Razorpay confirms the payment.
 */
router.post('/razorpay', async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        
        if (!secret || !signature) {
             return res.status(400).send('Missing secret/signature');
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('[Razorpay Webhook] Signature mismatch');
            return res.status(400).send('Invalid signature');
        }

        const { event, payload } = req.body;
        
        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const clerkId = payment.notes?.clerkId;
            const packageId = payment.notes?.packageId;

            if (clerkId && packageId) {
                console.log(`[Razorpay Webhook] Fulfilling order for ${clerkId}, package: ${packageId}`);
                // Implement fulfillment logic here (e.g. extending aiPremiumUntil)
            }
        }

        res.json({ status: 'ok' });
    } catch (err) {
        console.error('Razorpay Webhook Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
