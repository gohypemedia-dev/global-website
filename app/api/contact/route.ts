export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Please use the contact form on our website." }, { status: 403 });
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 4096) return Response.json({ error: "Request is too large." }, { status: 413 });
    body = JSON.parse(text);
  } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request." }, { status: 400 });
  const { name, email, phone, role } = body as Record<string, unknown>;
  if (typeof name !== "string" || !name.trim() || name.length > 120 || /[\r\n]/.test(name) ||
      typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof phone !== "string" || !/^[+\d() .-]{7,25}$/.test(phone) || phone.replace(/\D/g, "").length < 7 ||
      typeof role !== "string" || !["Railway contractor", "Government Official", "Jobseeker", "Other"].includes(role)) {
    return Response.json({ error: "Please provide your name, valid email, phone number and visitor type." }, { status: 400 });
  }
  const key = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM || process.env.DOCUMENT_REQUEST_FROM;
  const to = process.env.CONTACT_TO;
  if (!key || !from || !to) return Response.json({ error: "Online enquiries are temporarily unavailable. Please email the relevant department above or call 62002-64002." }, { status: 503 });
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: email.trim(), subject: `Contact enquiry: ${role}`, text: `Name: ${name.trim()}\nEmail: ${email.trim()}\nPhone: ${phone.trim()}\nVisitor type: ${role}` }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok || !(await response.json()).id) throw new Error("Delivery not confirmed");
    return Response.json({ success: true });
  } catch { return Response.json({ error: "Your enquiry could not be sent. Please try again or contact the department directly." }, { status: 502 }); }
}
