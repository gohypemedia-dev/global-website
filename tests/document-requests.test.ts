import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/document-requests/route";
import { DOWNLOAD_CATEGORIES } from "../lib/downloads";

const request = (body: unknown) => new Request("http://localhost/api/document-requests", {
  method: "POST", headers: { "Content-Type": "application/json", origin: "http://localhost" }, body: JSON.stringify(body),
});

test("document requests validate input and only report confirmed email delivery", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { key: process.env.RESEND_API_KEY, from: process.env.DOCUMENT_REQUEST_FROM, to: process.env.DOCUMENT_REQUEST_TO };
  const restore = (key: string, value: string | undefined) => { if (value === undefined) delete process.env[key]; else process.env[key] = value; };
  try {
    assert.equal((await POST(request({ email: "invalid", documentId: "x" }))).status, 400);
    assert.equal((await POST(request({ email: "visitor@example.com", documentId: "unknown" }))).status, 400);
    assert.equal((await POST(new Request("http://localhost/api/document-requests", { method: "POST", body: "{" }))).status, 400);
    assert.equal((await POST(new Request("http://localhost/api/document-requests", { method: "POST", headers: { origin: "https://other.example" }, body: "{}" }))).status, 403);
    delete process.env.RESEND_API_KEY;
    const documentId = DOWNLOAD_CATEGORIES[0].documents[0].id;
    assert.equal((await POST(request({ email: "visitor@example.com", documentId }))).status, 503);
    process.env.RESEND_API_KEY = "test-key";
    process.env.DOCUMENT_REQUEST_FROM = "website@example.com";
    process.env.DOCUMENT_REQUEST_TO = "team@example.com";
    let calls = 0;
    globalThis.fetch = async (_url, init) => {
      calls++;
      const message = JSON.parse(String(init?.body));
      assert.deepEqual(message.to, ["team@example.com"]);
      assert.equal(message.reply_to, "visitor@example.com");
      assert.ok(message.text.includes("visitor@example.com"));
      assert.ok(message.text.includes("Document ID:"));
      assert.equal(message.attachments, undefined);
      return Response.json({ id: "mock-email-id" });
    };
    for (const category of DOWNLOAD_CATEGORIES) {
      for (const document of category.documents) {
        const response = await POST(request({ email: "visitor@example.com", documentId: document.id }));
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { success: true });
      }
    }
    assert.equal(calls, 17);
    globalThis.fetch = async () => Response.json({ error: "rejected" }, { status: 500 });
    assert.equal((await POST(request({ email: "visitor@example.com", documentId }))).status, 502);
    globalThis.fetch = async () => { throw new Error("network failure"); };
    assert.equal((await POST(request({ email: "visitor@example.com", documentId }))).status, 502);
  } finally {
    globalThis.fetch = originalFetch;
    restore("RESEND_API_KEY", originalEnv.key);
    restore("DOCUMENT_REQUEST_FROM", originalEnv.from);
    restore("DOCUMENT_REQUEST_TO", originalEnv.to);
  }
});
