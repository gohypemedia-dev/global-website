"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export const COOKIE_KEY = "global-cookie-preferences-v1";
export function mapsAllowed() {
  try { return JSON.parse(localStorage.getItem(COOKIE_KEY) || "null")?.maps === true; } catch { return false; }
}
export function openCookieSettings() { window.dispatchEvent(new Event("open-cookie-settings")); }

export default function CookieSettings() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [maps, setMaps] = useState(false);
  useEffect(() => {
    try { setOpen(!localStorage.getItem(COOKIE_KEY)); } catch { setOpen(true); }
    setMaps(mapsAllowed());
    const show = () => { setMaps(mapsAllowed()); setPreferences(true); setOpen(true); };
    window.addEventListener("open-cookie-settings", show);
    return () => window.removeEventListener("open-cookie-settings", show);
  }, []);
  function save(allow: boolean) {
    try { localStorage.setItem(COOKIE_KEY, JSON.stringify({ maps: allow })); } catch { /* Preferences remain essential-only if storage is unavailable. */ }
    window.dispatchEvent(new Event("cookie-preferences-changed"));
    setOpen(false);
  }
  if (!open) return null;
  return <section aria-labelledby="cookie-heading" className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-2xl sm:p-7">
    <h2 id="cookie-heading" className="mb-3 text-xl font-semibold">Cookie settings</h2>
    <p className="text-sm leading-6 text-gray-600">We use essential cookies for secure sign-in. With your permission, we also load Google Maps, which may use third-party cookies. You can change your choice at any time. <Link href="/cookies" className="underline">Cookie declaration</Link></p>
    {preferences && <div className="my-4 space-y-3 text-sm"><p>Essential cookies — always active</p><label className="flex items-center gap-3"><input type="checkbox" checked={maps} onChange={e => setMaps(e.target.checked)} />Allow Google Maps</label></div>}
    <div className="mt-5 flex flex-wrap gap-3 text-sm">
      <button onClick={() => save(false)} className="border border-gray-300 px-4 py-2">Essential only</button>
      <button onClick={() => preferences ? save(maps) : setPreferences(true)} className="border border-gray-300 px-4 py-2">{preferences ? "Save preferences" : "Change preferences"}</button>
      <button onClick={() => save(true)} className="bg-red-600 px-4 py-2 text-white">Accept all</button>
    </div>
  </section>;
}

export function CookiePreferencesButton() {
  return <button type="button" onClick={openCookieSettings} className="underline underline-offset-4 hover:text-red-600">Change cookie settings</button>;
}

export function ConsentMap({ src }: { src: string }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const sync = () => setAllowed(mapsAllowed());
    sync();
    window.addEventListener("cookie-preferences-changed", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("cookie-preferences-changed", sync); window.removeEventListener("storage", sync); };
  }, []);
  return allowed ? <iframe title="Global Devices location on Google Maps" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="block h-72 w-full border-0 sm:h-80" /> : <div className="flex h-72 flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center sm:h-80"><p className="text-sm text-gray-600">Allow Google Maps in cookie settings to view the interactive map.</p><CookiePreferencesButton /></div>;
}
