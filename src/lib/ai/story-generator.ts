export async function generateStory(payload: any) {
  const res = await fetch("/api/books/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Story generation failed");
  return res.json();
}
