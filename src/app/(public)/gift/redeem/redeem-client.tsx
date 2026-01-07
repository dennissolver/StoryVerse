"use client";

import { useSearchParams } from "next/navigation";

export default function RedeemClient() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  return (
    <div>
      <h1>Redeem Gift</h1>
      {code ? (
        <p>Redeeming code: <strong>{code}</strong></p>
      ) : (
        <p>No gift code provided.</p>
      )}
    </div>
  );
}
