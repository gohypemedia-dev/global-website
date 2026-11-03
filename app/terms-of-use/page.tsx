import type { Metadata } from "next";
import Link from "next/link";
import InformationPage from "../components/InformationPage";
import content from "./content.json";

export const metadata: Metadata = {
  title: "Terms of Service | Global Devices",
  description: "Terms of Service for indiaglobalgroup.com, including website use, intellectual property, privacy, and contact information.",
};

type ContentBlock = { kind: string; text?: string; items?: string[] };

function TermsText({ text }: { text: string }) {
  return text.split(/(operations@indiaglobalgroup\.com|Privacy Policy)/g).map((part, index) => {
    if (part === "operations@indiaglobalgroup.com") {
      return <a key={index} href={`mailto:${part}`} className="break-words text-red-600 underline underline-offset-4">{part}</a>;
    }
    if (part === "Privacy Policy") {
      return <Link key={index} href="/privacy-policy" className="text-red-600 underline underline-offset-4">{part}</Link>;
    }
    return part;
  });
}

function TermsBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return blocks.map((block, index) => {
    if (block.kind === "list") {
      return <ul key={index} className="list-disc space-y-3 pl-6 marker:text-red-600">
        {block.items?.map((item) => <li key={item}><TermsText text={item} /></li>)}
      </ul>;
    }
    if (block.kind === "h3") {
      return <h3 key={index} className="pt-3 text-lg font-semibold text-gray-900">{block.text}</h3>;
    }
    return <p key={index}><TermsText text={block.text ?? ""} /></p>;
  });
}

export default function TermsOfServicePage() {
  return (
    <InformationPage title="Terms of Service" wide>
      <div className="space-y-5"><TermsBlocks blocks={content.intro} /></div>
      <article className="space-y-8 pt-2">
        {content.sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-40">
            <h2 id={`${section.id}-heading`} className="mb-4 text-2xl font-semibold tracking-tight text-gray-900">{section.title}</h2>
            <div className="space-y-4"><TermsBlocks blocks={section.blocks} /></div>
          </section>
        ))}
      </article>
    </InformationPage>
  );
}
