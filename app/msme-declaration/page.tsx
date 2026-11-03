import InformationPage from "../components/InformationPage";
import { MSME_DECLARATION } from "../../lib/company-content";

export const metadata = { title: "MSME Declaration | Global Devices" };

export default function MsmeDeclarationPage() {
  return <InformationPage title="MSME Declaration">
    <p>{MSME_DECLARATION}</p>
    <p>For registration documents and payment-related enquiries, contact <a className="text-red-600 underline" href="mailto:operations@indiaglobalgroup.com">operations@indiaglobalgroup.com</a>.</p>
  </InformationPage>;
}
