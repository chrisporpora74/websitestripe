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
		
		// Save customer info on the payment-intent
		receipt_email: customer?.email,
		metadata: {
			firstName: customer?.firstName || "",
			lastName: customer?.lastName || "",
			phone: customer?.phone || ""
		}
    });

    res.json({ clientSecret: intent.client_secret });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4242, () => console.log("Stripe server running on http://localhost:4242"));
		