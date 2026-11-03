"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "../context/LanguageContext";
import AramcoHeader from "./AramcoHeader";
import Footer from "./Footer";

export default function InformationPage({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <LanguageProvider>
      <AramcoHeader />
      <main className="min-h-[60vh] bg-white px-6 pb-20 pt-40 text-gray-900">
        <div className={wide ? "mx-auto w-full max-w-7xl" : "mx-auto max-w-4xl"}>
          {!wide && <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-red-600">Global Devices</p>}
          <h1 className="mb-10 text-3xl font-semibold sm:text-5xl">{title}</h1>
          <div className="space-y-6 text-base leading-8 text-gray-700">{children}</div>
        </div>
      </main>
      <Footer />
    </LanguageProvider>
  );
}
