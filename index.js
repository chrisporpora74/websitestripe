import express from "express";
import cors from "cors";
import Stripe from "stripe";

const app = express();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY in environment variables.");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { items, customer } = req.body;

    const amount = items.reduce((sum, i) =>
      sum + Math.round(Number(i.price) * 100) * Number(i.qty)
    , 0);

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: customer?.email,
      shipping: {
        name: `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),
        phone: customer?.phone || "",
        address: {
          line1:       customer?.address || "",
          city:        customer?.city    || "",
          state:       customer?.state   || "",
          postal_code: customer?.zip     || "",
          country:     "US"
        }
      },
      metadata: {
        firstName: customer?.firstName || "",
        lastName:  customer?.lastName  || "",
        phone:     customer?.phone     || "",
        address:   customer?.address   || "",
        city:      customer?.city      || "",
        state:     customer?.state     || "",
        zip:       customer?.zip       || ""
      }
    });

    res.json({ clientSecret: intent.client_secret });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Stripe server running on port ${PORT}`));
