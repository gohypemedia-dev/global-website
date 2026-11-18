"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { DOWNLOAD_CATEGORIES } from "../../lib/downloads";
import InformationPage from "./InformationPage";

export default function DownloadsPage({ categorySlug }: { categorySlug?: string }) {
  const category = DOWNLOAD_CATEGORIES.find((item) => item.slug === categorySlug);
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<{ id: string; title: string } | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  return <InformationPage title={category?.title ?? "Downloads"} wide>
    <nav aria-label="Document categories" className="flex flex-wrap gap-3 text-sm">
      <Link href="/downloads" aria-current={category ? undefined : "page"} className={`border px-4 py-2 ${category ? "hover:border-red-600" : "border-red-600 bg-red-600 text-white"}`}>All Downloads</Link>
      {DOWNLOAD_CATEGORIES.map((item) => <Link key={item.slug} href={`/downloads/${item.slug}`} aria-current={category?.slug === item.slug ? "page" : undefined} className={`border px-4 py-2 ${category?.slug === item.slug ? "border-red-600 bg-red-600 text-white" : "hover:border-red-600"}`}>{item.title}</Link>)}
    </nav>
    <p>Click on the desired file and you will receive the files on the submitted Email ID.</p>
    {category ? <>
      <section className="space-y-5 bg-neutral-950 p-6 text-white sm:p-10">
        <p className="text-sm font-semibold text-red-400">{category.specification}</p>
        <h2 className="whitespace-pre-line text-2xl font-semibold sm:text-3xl">{category.headline}</h2>
        <p className="whitespace-pre-line text-gray-300">{category.description.split("info@indiaglobalgroup.com")[0]}{category.description.includes("info@indiaglobalgroup.com") && <a className="underline" href="mailto:info@indiaglobalgroup.com">info@indiaglobalgroup.com</a>}</p>
        <a href="#document-library" className="inline-block bg-red-600 px-5 py-2 text-white">Request Documents →</a>
      </section>
      {category.warning && <p className="border-l-4 border-amber-500 bg-amber-50 p-5 text-amber-950">{category.warning}</p>}
      <section id="document-library" aria-label="Available documents" className="grid scroll-mt-40 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {category.documents.map((document) => <article key={document.id} className="flex flex-col border border-gray-200 p-6">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">{document.title}</h2>
          <p className="mb-6 text-sm leading-6">{document.description}</p>
          <button className="mt-auto self-start bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700" onClick={() => {
            setSelected(document); setError(""); setSent(false); setEmail(""); dialog.current?.showModal();
          }}>Request<span className="sr-only"> {document.title}</span></button>
        </article>)}
      </section>
    </> : <div className="grid gap-6 md:grid-cols-3">
      {DOWNLOAD_CATEGORIES.map((item) => <Link href={`/downloads/${item.slug}`} key={item.slug} className="border border-gray-200 p-7 hover:border-red-600">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">{item.title}</h2>
        <p className="text-sm">{item.documents.map((document) => document.title).join(" · ")}</p>
        <span className="mt-6 block font-semibold text-red-600">View Documents →</span>
      </Link>)}
    </div>}
    <dialog ref={dialog} aria-labelledby="request-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto border border-gray-200 bg-white p-6 text-gray-900 shadow-xl backdrop:bg-black/60 sm:p-8">
      <button type="button" aria-label="Close document request" className="float-right px-3 text-2xl" onClick={() => dialog.current?.close()}>×</button>
      <h2 id="request-title" className="mb-3 text-2xl font-semibold">Request {selected?.title}</h2>
      <p className="mb-5 text-sm">{category?.title}</p>
      {sent ? <p role="status">Your request has been sent to our team. We will verify your credentials and email the document manually.</p> : <form className="space-y-4" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError("");
        try {
          const response = await fetch("/api/document-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, documentId: selected?.id }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Unable to submit your request.");
          setSent(true);
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to submit your request. Please try again."); }
        finally { setBusy(false); }
      }}>
        <label className="block text-sm font-medium" htmlFor="request-email">Your email address</label>
        <input id="request-email" name="email" type="email" autoComplete="email" autoFocus required maxLength={254} disabled={busy} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-gray-300 p-3" />
        <p className="text-sm">We use your email to review and respond to this document request. <Link href="/privacy-policy" className="text-red-600 underline">Privacy Policy</Link></p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="bg-red-600 px-6 py-3 text-white disabled:opacity-50">{busy ? "Sending…" : "Send Request"}</button>
      </form>}
    </dialog>
  </InformationPage>;
}
