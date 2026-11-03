import { DOWNLOAD_CATEGORIES } from "../../../lib/downloads";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Please submit your request from this website." }, { status: 403 });
  }
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 2048) return Response.json({ error: "Request is too large." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request." }, { status: 400 });
  const { email, documentId } = body as Record<string, unknown>;
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const category = DOWNLOAD_CATEGORIES.find((item) => item.documents.some((document) => document.id === documentId));
  const document = category?.documents.find((item) => item.id === documentId);
  if (!document || !category) return Response.json({ error: "Please select an available document." }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  const from = process.env.DOCUMENT_REQUEST_FROM;
  const to = process.env.DOCUMENT_REQUEST_TO;
  if (!key || !from || !to) {
    return Response.json({ error: "Online requests are temporarily unavailable. Please email info@indiaglobalgroup.com with the document name and your email address." }, { status: 503 });
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [to], reply_to: email.trim(),
        subject: `Document request: ${category.title} - ${document.title}`,
        text: `A visitor has requested a document.\n\nEmail: ${email.trim()}\nCategory: ${category.title}\nDocument: ${document.title}\nDocument ID: ${document.id}\n\nPlease verify the visitor's credentials and email the document manually. No file has been sent automatically.`,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Delivery rejected");
    const result = await response.json();
    if (!result.id) throw new Error("Delivery not confirmed");
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Your request could not be sent. Please try again or email info@indiaglobalgroup.com." }, { status: 502 });
  }
}
