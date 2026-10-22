const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // or native fetch if using newer Node versions

// 1. Create Checkout Session Route
router.post('/create-checkout', async (req, res) => {
    try {
        const { amount, referenceNumber } = req.body; // amount in centavos (e.g., ₱100 = 10000)
        const secretKey = process.env.PAYMONGO_SECRET_KEY;

        const response = await fetch('https://api.paymongo.com/v2/checkout_sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(secretKey + ':').toString('base64')
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        line_items: [{
                            name: 'Chick N Pastil Order',
                            amount: amount || 10000,
                            currency: 'PHP',
                            quantity: 1
                        }],
                        payment_method_types: ['gcash'],
                        success_url: 'http://localhost:3000/pos/payment.html?status=success',
                        cancel_url: 'http://localhost:3000/pos/ordering.html',
                        reference_number: referenceNumber || 'POS-ORDER-001'
                    }
                }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(500).json({ error: data.errors || 'Failed to create checkout session' });
        }

        res.json({ checkout_url: data.data.attributes.checkout_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Webhook Listener Route (Receives events from ngrok -> PayMongo)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sigHeader = req.headers['paymongo-signature'];
    // TODO: Verify signature using process.env.PAYMONGO_WEBHOOK_SECRET and update order in MySQL db.js
    
    const event = req.body;
    console.log("Webhook received:", event);

    res.status(200).json({ received: true });
});

module.exports = router;