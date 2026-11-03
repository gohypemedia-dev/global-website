import InformationPage from "../components/InformationPage";
import { CookiePreferencesButton } from "../components/CookieSettings";
export const metadata = { title: "Cookie Declaration | Global Devices", description: "Cookies and local storage used by the Global Devices website, and how to manage your preferences." };
export default function Page() {
  return <InformationPage title="Cookie Declaration" wide>
    <p>Cookies are small files stored by your browser. This website uses an essential sign-in cookie and stores your cookie preferences locally on your device.</p>
    <h2 className="text-2xl font-semibold">Essential storage</h2>
    <p>The catalog_session cookie keeps signed-in users authenticated. It expires after eight hours and is removed on sign-out. It is required for authenticated features.</p>
    <p>The global-cookie-preferences-v1 local storage entry remembers whether you allow Google Maps. It remains until you update your choice or clear your browser storage.</p>
    <h2 className="text-2xl font-semibold">Google Maps</h2>
    <p>The embedded map on our Contact page loads only if you allow it. Google may then receive your device and network information and use its own cookies. You can use the external directions link without enabling the embedded map.</p>
    <h2 className="text-2xl font-semibold">Your choice</h2>
    <p>You can change your preferences below or in the footer. Withdrawing map permission stops the embedded map from loading; cookies already set by Google can be removed through your browser settings. Blocking essential cookies may prevent sign-in from working.</p>
    <CookiePreferencesButton />
  </InformationPage>;
}
