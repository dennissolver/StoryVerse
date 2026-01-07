"use client";

import { useSearchParams } from "next/navigation";

export default function SubscriptionSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div>
      <h1>Subscription Activated</h1>

      {sessionId ? (
        <p>Stripe session ID: <strong>{sessionId}</strong></p>
      ) : (
        <p>Your subscription is now active.</p>
      )}
    </div>
  );
}
