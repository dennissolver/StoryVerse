import { Suspense } from "react";
import RedeemClient from "./redeem-client";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <RedeemClient />
    </Suspense>
  );
}
