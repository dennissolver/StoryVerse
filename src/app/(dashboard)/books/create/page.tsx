import { Suspense } from "react";
import CreateBookClient from "./create-book-client";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <CreateBookClient />
    </Suspense>
  );
}
