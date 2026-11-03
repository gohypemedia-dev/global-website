import type { Metadata } from "next";
import InformationPage from "../components/InformationPage";
import content from "./content.json";

export const metadata: Metadata = {
  title: "Privacy Policy | Global Devices",
  description: "How Global Devices collects, uses, and protects information, including cookies, data retention, your rights, and privacy enquiries.",
};

type ContentBlock = { kind: string; text?: string; items?: string[] };

function PolicyText({ text }: { text: string }) {
  const email = "operations@indiaglobalgroup.com";
  if (!text.includes(email)) return <>{text}</>;
  const [before, after] = text.split(email);
  return <>{before}<a href={`mailto:${email}`} className="break-words text-red-600 underline underline-offset-4">{email}</a>{after}</>;
}

function PolicyBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return blocks.map((block, index) => {
    if (block.kind === "list") {
      return <ul key={index} className="list-disc space-y-3 pl-6 marker:text-red-600">
        {block.items?.map((item) => <li key={item}><PolicyText text={item} /></li>)}
      </ul>;
    }
    if (block.kind === "h3") {
      return <h3 key={index} className="pt-3 text-lg font-semibold text-gray-900">{block.text}</h3>;
    }
    return <p key={index}><PolicyText text={block.text ?? ""} /></p>;
  });
}

export default function PrivacyPolicyPage() {
  return (
    <InformationPage title="Privacy Policy" wide>
      <div className="space-y-5"><PolicyBlocks blocks={content.intro} /></div>
      <article className="space-y-8 pt-2">
        {content.sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-40">
            <h2 id={`${section.id}-heading`} className="mb-4 text-2xl font-semibold tracking-tight text-gray-900">{section.title}</h2>
            <div className="space-y-4"><PolicyBlocks blocks={section.blocks} /></div>
          </section>
        ))}
      </article>
    </InformationPage>
  );
}
