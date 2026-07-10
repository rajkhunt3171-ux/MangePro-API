import stripe from "../config/stripe.js";

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