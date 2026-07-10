import express from 'express';
import { createPaymentStripeIntent } from "../controllers/payment.js";

const router = express.Router();

router.post("/create-stripe-payment-intent", createPaymentStripeIntent);

export default router;
