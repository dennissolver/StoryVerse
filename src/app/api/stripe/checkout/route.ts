export const runtime = "nodejs";


export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const body = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: body.items,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gift/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/gift`,
  });

  return NextResponse.json({ url: session.url });
}
