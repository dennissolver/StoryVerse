import { Suspense } from "react";
import SubscriptionSuccessClient from "./subscription-success-client";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <SubscriptionSuccessClient />
    </Suspense>
  );
}
