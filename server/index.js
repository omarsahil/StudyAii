const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Use VITE_RAZORPAY_KEY_ID if available (for Vite frontend compatibility), otherwise fallback to RAZORPAY_KEY_ID
const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// Note: Only the Key ID should ever be exposed to the frontend. The Key Secret must remain backend-only and never be sent to the client.

app.post("/api/create-subscription", async (req, res) => {
  const { planId } = req.body;
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // 12 months
    });
    res.json({ subscriptionId: subscription.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
