"use client";

import { useState } from "react";
import Link from "next/link";
import AramcoHeader from "./AramcoHeader";
import Footer from "./Footer";
import { ConsentMap } from "./CookieSettings";
import { LanguageProvider } from "../context/LanguageContext";

const departments = [
  { title: "Sales / Service", name: "Mr. Sanjay Verma", role: "GM Sales and Operations", email: "sales@indiaglobalgroup.com" },
  { title: "General Enquiry / Product QR Scanning", name: "Mr. Mukesh Sharma", role: "GM Quality Assurance (QA)", email: "info@indiaglobalgroup.com" },
  { title: "Accounts / Payments related", name: "Mr Arun Kumar", role: "Head of Accounts", email: "accounts@indiaglobalgroup.com" },
  { title: "Jobs / Careers", name: "Mr. Mohammad Rafi", role: "Human Resources (HR)", email: "hr@indiaglobalgroup.com" },
];
const location = encodeURIComponent("Global Devices, Village Ogli, Nahan Road, Kala-amb, Sirmour, Himachal Pradesh 173030, Near Hotel Black Mango");

export default function ContactPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  return <LanguageProvider>
    <AramcoHeader solid />
    <main className="bg-white pt-[105px] text-gray-900 sm:pt-[121px]">
      <section className="relative bg-neutral-950 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-red-400">Sales - Service - Careers - Talk to us</p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">Connect directly with the right department in no time.</h1>
          <p className="my-7 max-w-3xl text-lg leading-8 text-gray-300">Contact us if you are looking to place an order, seeking a career with us, or just need general questions answered.</p>
          <a href="#contact-directory" className="inline-block bg-red-600 px-7 py-3 font-semibold hover:bg-red-700">Connect with us</a>
          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-white/20 pt-7 text-xl sm:grid-cols-4">{["Sales", "Service", "Payments", "Careers"].map((item) => <span key={item}>{item}</span>)}</div>
        </div>
      </section>
      <section id="contact-directory" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:scroll-mt-28 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="text-3xl font-semibold">Contact Directory</h2>
        <p className="mb-8 mt-3 text-gray-600">Reach out to the right department in no time!</p>
        <div className="grid gap-6 md:grid-cols-2">{departments.map((department) => <article key={department.email} className="border border-gray-200 p-6">
          <h3 className="mb-5 text-lg font-semibold text-red-600">{department.title}</h3>
          <p className="text-xl font-semibold">{department.name}</p>
          <p className="mb-3 mt-1 text-gray-600">{department.role}</p>
          <a className="break-all underline underline-offset-4 hover:text-red-600" href={`mailto:${department.email}`}>{department.email}</a>
        </article>)}</div>
        <div className="mt-8 bg-red-600 p-6 text-white sm:p-8">
          <p className="text-xl">Prefer to rather talk? Call our central helpline number</p>
          <a href="tel:+916200264002" className="mt-2 inline-block text-3xl font-semibold">62002-64002</a>
        </div>
      </section>
      <section aria-labelledby="contact-form-heading" className="bg-gray-50 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="contact-form-heading" className="mb-8 text-center text-3xl font-semibold">Contact Form</h2>
          <form className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-2" onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = Object.fromEntries(new FormData(form));
            setBusy(true); setError(""); setSent(false);
            try {
              const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || "Unable to send your enquiry.");
              setSent(true); form.reset();
            } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send your enquiry. Please try again."); }
            finally { setBusy(false); }
          }}>
            <label className="space-y-2"> <span className="block font-medium">Name</span><input name="name" autoComplete="name" required maxLength={120} className="w-full border border-gray-300 bg-white p-3" /></label>
            <label className="space-y-2"> <span className="block font-medium">Email</span><input name="email" type="email" autoComplete="email" required maxLength={254} className="w-full border border-gray-300 bg-white p-3" /></label>
            <label className="space-y-2"> <span className="block font-medium">Phone</span><input name="phone" type="tel" autoComplete="tel" required maxLength={25} pattern="[+0-9() .\-]{7,25}" className="w-full border border-gray-300 bg-white p-3" /></label>
            <label className="space-y-2"> <span className="block font-medium">You are a</span><select name="role" required defaultValue="" className="w-full border border-gray-300 bg-white p-3"><option value="" disabled>Select an option</option>{["Railway contractor", "Government Official", "Jobseeker", "Other"].map((role) => <option key={role}>{role}</option>)}</select></label>
            <p className="text-sm text-gray-600 sm:col-span-2">Your details will be used to respond to your enquiry. <Link href="/privacy-policy" className="underline">Privacy Policy</Link></p>
            {error && <p role="alert" className="text-red-700 sm:col-span-2">{error}</p>}
            {sent && <p role="status" className="text-green-800 sm:col-span-2">Your enquiry has been sent to our team.</p>}
            <button disabled={busy} className="justify-self-center bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50 sm:col-span-2">{busy ? "Sending…" : "Contact"}</button>
          </form>
        </div>
      </section>
      <section aria-labelledby="visit-heading" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid items-center gap-8 md:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <h2 id="visit-heading" className="mb-6 text-3xl font-semibold tracking-tight">Our location</h2>
            <h3 className="mb-3 text-lg font-semibold">Global Devices</h3>
            <address className="text-base not-italic leading-7 text-gray-600">Village Ogli, Nahan Road,<br />Kala-amb, Dist. Sirmour,<br />Himachal Pradesh - 173030</address>
            <p className="mt-4 text-sm text-gray-500">Landmark: Near Hotel Black Mango</p>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${location}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-3 bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600">Get directions <span aria-hidden="true">&nearr;</span></a>
          </div>
          <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200">
            <ConsentMap src={`https://maps.google.com/maps?q=${location}&output=embed`} />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"><h2 className="mb-6 text-2xl font-semibold">Related Portals</h2><div className="grid gap-5 sm:grid-cols-2"><Link href="/downloads" className="border border-gray-200 p-6 text-xl hover:border-red-600">Downloads →</Link><Link href="/about" className="border border-gray-200 p-6 text-xl hover:border-red-600">About Us →</Link></div></section>
    </main>
    <Footer />
  </LanguageProvider>;
}

