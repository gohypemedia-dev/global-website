import Link from "next/link";
import InformationPage from "../../components/InformationPage";

export const metadata = { title: "Ancillary Items | Global Devices" };

export default function AncillaryItemsPage() {
  return <InformationPage title="Ancillary Items">
    <p>Contact our team for ancillary items for your railway safety equipment. Share your equipment model and requirements so we can assist with compatible items.</p>
    <Link className="inline-block bg-red-600 px-6 py-3 text-white" href="/contact">Contact Us</Link>
  </InformationPage>;
}
