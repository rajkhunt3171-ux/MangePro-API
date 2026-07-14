import express from 'express';
import { createPaymentStripeIntent, createPaymentPaypalIntent } from "../controllers/payment.js";

const router = express.Router();

//stripe 
router.post("/create-stripe-payment-intent", createPaymentStripeIntent);

//paypal 
router.post("/create-paypal-payment-intent", createPaymentPaypalIntent);


export default router;
