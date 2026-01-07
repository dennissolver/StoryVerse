export async function cloneVoice(formData: FormData) {
  const res = await fetch("/api/voice/clone", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Voice clone failed");
  return res.json();
}
