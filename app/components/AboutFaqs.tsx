"use client";

import { SUPPORT_SUBPAGES } from "../data/subpagesEnhancedData";
import { useLanguage } from "../context/LanguageContext";

const faqs = Array.from(new Map(Object.values(SUPPORT_SUBPAGES).flatMap((page) => page.faqs).map((faq) => [faq.questionEn, faq])).values());

export default function AboutFaqs() {
  const { lang } = useLanguage();
  return <section id="faqs-section" className="border-t border-gray-200 bg-gray-50 px-6 py-16 text-gray-900">
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-8 text-3xl font-semibold">{lang === "hi" ? "अक्सर पूछे जाने वाले प्रश्न" : "Frequently Asked Questions"}</h2>
      <div className="space-y-4">{faqs.map((faq) => <details key={faq.questionEn} className="border border-gray-200 bg-white p-5">
        <summary className="cursor-pointer font-semibold">{lang === "hi" ? faq.questionHi : faq.questionEn}</summary>
        <p className="mt-4 text-sm leading-7 text-gray-600">{lang === "hi" ? faq.answerHi : faq.answerEn}</p>
      </details>)}</div>
    </div>
  </section>;
}
