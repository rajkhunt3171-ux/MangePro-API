import stripe from "../config/stripe.js";

import paypal from "../config/paypal.js";
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

export const createPaymentStripeIntent = async (req, res) => {
    try {
        const { amount } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: "inr",
            automatic_payment_methods: {
                enabled: true,
            },
        });
        res.json({
            clientSecret: paymentIntent.client_secret
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

//do order with paypal 
export const createPaymentPaypalIntent = async (req, res) => {
    try {
        const { amount } = req.body;

        const request = new paypal.checkoutNodeJssdk.orders.OrdersCreateRequest();

        request.prefer("return=representation");

        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: amount
                    }
                }
            ]
        });

        const order = await paypal.client.execute(request);
        res.json({
            orderID: order.result.id
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

//get order and return paypal
export const captureOrder = async (req, res) => {

    try {
        const { orderID } = req.body;

        const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);

        request.requestBody({});

        const capture = await paypal.execute(request);
        res.json(capture.result);
    }
    catch (err) {
        res.status(500).json(err);
    }
};
