"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CreateBookClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId");

  return (
    <div>
      <h1>Create Book</h1>

      {childId ? (
        <p>Creating a book for child ID: <strong>{childId}</strong></p>
      ) : (
        <p>No child selected.</p>
      )}

      <button onClick={() => router.push("/books")}>
        Back to Books
      </button>
    </div>
  );
}
