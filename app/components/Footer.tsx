"use client";

import React from "react";
import { CookiePreferencesButton } from "./CookieSettings";
import { useLanguage } from "../context/LanguageContext";
import Link from "next/link";
import { MSME_DECLARATION } from "../../lib/company-content";

const PRODUCTS_LINKS_EN = [
  { name: "Electric Lifting Barrier (ELB)", href: "/products/railway-barrier" },
  { name: "Earth Leakage Detector (ELD)", href: "/products/earth-leakage" },
  { name: "Ancillary Items", href: "/products/ancillary-items" },
];
const PRODUCTS_LINKS_HI = [
  { name: "इलेक्ट्रिक लिफ्टिंग बैरियर (ELB)", href: "/products/railway-barrier" },
  { name: "अर्थ लीकेज डिटेक्टर (ELD)", href: "/products/earth-leakage" },
  { name: "सहायक उपकरण", href: "/products/ancillary-items" },
];
const COMPANY_LINKS_EN = [
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
  { name: "Downloads", href: "/downloads" },
  { name: "MSME Declaration", href: "/msme-declaration" },
];
const COMPANY_LINKS_HI = [
  { name: "हमारे बारे में", href: "/about" },
  { name: "संपर्क करें", href: "/contact" },
  { name: "डाउनलोड", href: "/downloads" },
  { name: "MSME घोषणा", href: "/msme-declaration" },
];
const LEGAL_SUPPORT_LINKS_EN = [
  { name: "Login", href: "/login" },
  { name: "Scan QR Code", href: "/scan-qr-code" },
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Use", href: "/terms-of-use" },
];
const LEGAL_SUPPORT_LINKS_HI = [
  { name: "लॉगिन", href: "/login" },
  { name: "QR कोड स्कैन करें", href: "/scan-qr-code" },
  { name: "गोपनीयता नीति", href: "/privacy-policy" },
  { name: "उपयोग की शर्तें", href: "/terms-of-use" },
];
export default function Footer() {
  const { lang, t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const productLinks = lang === "hi" ? PRODUCTS_LINKS_HI : PRODUCTS_LINKS_EN;
  const companyLinks = lang === "hi" ? COMPANY_LINKS_HI : COMPANY_LINKS_EN;
  const legalSupportLinks = lang === "hi" ? LEGAL_SUPPORT_LINKS_HI : LEGAL_SUPPORT_LINKS_EN;

  return (
    <footer className="w-full bg-white text-gray-900 pt-16 sm:pt-20 pb-12 border-t border-gray-200 font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Brand Summary Banner */}
        <div className="mb-12 pb-10 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight font-sans">
              GLOBAL DEVICES
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#ff3131] tracking-wider uppercase mt-0.5">
              {lang === "hi" ? "रेलवे सुरक्षा के लिए इंजीनियरिंग" : "Engineering for Railway Safety"}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 font-light max-w-2xl mt-2 leading-relaxed">
              {lang === "hi"
                ? "सुरक्षित रेलवे क्रॉसिंग, ऑनलाइन केबल इन्सुलेशन निगरानी और अन्य महत्वपूर्ण बुनियादी ढांचे के लिए व्यावहारिक समाधानों की इंजीनियरिंग।"
                : "Engineering practical solutions for safer railway crossings, online cable insulation monitoring and other critical infrastructure"}
            </p>
          </div>

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3">
            <Link
              href="/scan-qr-code"
              className="px-5 py-2.5 rounded-none bg-red-600 hover:bg-[#d62828] text-white text-center text-xs sm:text-sm font-medium transition-all shadow-md"
            >
              {lang === "hi" ? "QR कोड स्कैन करें" : "Scan QR Code"}
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-none border border-gray-300 hover:border-gray-900 text-gray-800 text-center text-xs sm:text-sm font-medium transition-all"
            >
              {lang === "hi" ? "संपर्क करें" : "Contact Us"}
            </Link>
          </div>
        </div>

        {/* Main Columns Grid: 3 Clean Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 pb-12 sm:pb-16">

          {/* Column 1: PRODUCTS */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 tracking-wider uppercase mb-4 sm:mb-6">
              {lang === "hi" ? "उत्पाद" : "Products"}
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-[13px] text-gray-700 hover:text-[#ff3131] transition-colors leading-relaxed block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: COMPANY */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 tracking-wider uppercase mb-4 sm:mb-6">
              {lang === "hi" ? "कंपनी" : "Company"}
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-[13px] text-gray-700 hover:text-[#ff3131] transition-colors leading-relaxed block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: LEGAL & SUPPORT */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 tracking-wider uppercase mb-4 sm:mb-6">
              {lang === "hi" ? "उपयोगी लिंक" : "Useful Links"}
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {legalSupportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-[13px] text-gray-700 hover:text-[#ff3131] transition-colors leading-relaxed block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 sm:pt-10 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 text-center sm:text-left">

          <div className="text-xs text-gray-600 order-3 sm:order-1 font-normal">
            {t.footer.copyright}
            <div className="mt-3 flex flex-wrap gap-4"><Link href="/cookies">Cookie declaration</Link><CookiePreferencesButton /></div>
          </div>

          <div className="order-1 sm:order-2">
            <button
              onClick={scrollToTop}
              className="w-10 h-10 rounded-full bg-[#ff3131] hover:bg-[#d62828] border border-[#ff3131] flex items-center justify-center text-white transition-all shadow-md shadow-red-500/30 cursor-pointer group"
              aria-label="Scroll to top"
              title="Back to top"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:-translate-y-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>

          <div className="order-2 sm:order-3 flex items-center">
            <p className="max-w-xl text-xs leading-relaxed text-gray-600">
              {MSME_DECLARATION}{" "}
              <Link href="/msme-declaration" className="text-red-600 underline underline-offset-4">
                {lang === "hi" ? "और पढ़ें" : "Read more"}
              </Link>
            </p>
          </div>

        </div>

      </div>
    </footer>
  );
}
