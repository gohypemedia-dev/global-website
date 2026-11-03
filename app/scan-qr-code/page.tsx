"use client";

import { useState } from "react";
import jsQR from "jsqr";
import InformationPage from "../components/InformationPage";

export default function ScanQrCodePage() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function lookup(value: string) {
    const response = await fetch(`/api/catalog/lookup?q=${encodeURIComponent(value.trim())}`);
    const data = await response.json();
    if (!response.ok || !data.product?.public_id) throw new Error(data.error || "No equipment found with this code.");
    window.location.assign(`/p/${encodeURIComponent(data.product.public_id)}`);
  }

  async function scan(file: File) {
    setBusy(true);
    setError("");
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) { bitmap.close(); throw new Error("Image scanning is unavailable in this browser."); }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(pixels.data, pixels.width, pixels.height);
      if (!code) throw new Error("No QR code found. Try a clearer photo or enter the code below.");
      // Generated equipment tags contain a public product URL. Only use its product ID.
      let path = "";
      try { path = new URL(code.data).pathname; } catch { /* Plain machine code. */ }
      const product = path.match(/^\/p\/([a-zA-Z0-9_-]+)\/?$/);
      if (product) window.location.assign(`/p/${product[1]}`);
      else await lookup(code.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to read this image.");
    } finally { setBusy(false); }
  }

  return <InformationPage title="Scan QR Code">
    <p>Scan the QR label on your equipment with your phone camera to open its record, or upload a photo of the label here.</p>
    <label className="block font-medium" htmlFor="qr-photo">QR code photo</label>
    <input id="qr-photo" type="file" accept="image/*" disabled={busy} onChange={(event) => {
      const file = event.target.files?.[0];
      if (file) void scan(file);
      event.target.value = "";
    }} className="block w-full border border-gray-300 p-3" />
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      if (!query.trim()) return;
      setBusy(true); setError("");
      try { await lookup(query); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to look up equipment."); }
      finally { setBusy(false); }
    }}>
      <label className="block font-medium" htmlFor="machine-code">Or enter the QR / machine code</label>
      <input id="machine-code" required value={query} onChange={(event) => setQuery(event.target.value)} className="w-full border border-gray-300 p-3" />
      <button disabled={busy || !query.trim()} className="bg-red-600 px-6 py-3 text-white disabled:opacity-50">{busy ? "Reading…" : "Find Equipment"}</button>
    </form>
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </InformationPage>;
}
