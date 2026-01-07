"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div>
      <h1>Gift Successful 🎉</h1>

      {sessionId ? (
        <p>Payment reference: <strong>{sessionId}</strong></p>
      ) : (
        <p>Your gift purchase was successful.</p>
      )}
    </div>
  );
}
