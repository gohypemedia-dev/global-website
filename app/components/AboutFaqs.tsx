"use client";

import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";

const faqs = [
  {
    questionEn: "What are the products that your company manufactures?",
    questionHi: "आपकी कंपनी कौन-कौन से उत्पाद बनाती है?",
    answerEn:
      "We are RDSO Approved manufacturers of Electric Lifting Barrier (ELB) as per RDSO Spec No. RDSO/SPN/208/2012 Ver 2.0 or Latest. This also includes ancillary and associated products such as GI Boom, Lock Post, Pedestal, and Gear boxes",
    answerHi:
      "हम RDSO विनिर्देश संख्या RDSO/SPN/208/2012 Ver 2.0 या नवीनतम के अनुसार इलेक्ट्रिक लिफ्टिंग बैरियर (ELB) के RDSO अनुमोदित निर्माता हैं। इसमें GI बूम, लॉक पोस्ट, पेडस्टल और गियर बॉक्स जैसे सहायक एवं संबद्ध उत्पाद भी शामिल हैं।",
  },
  {
    questionEn: "Post the sales, what support do you provide?",
    questionHi: "बिक्री के बाद, आप कौन सी सहायता प्रदान करते हैं?",
    answerEn:
      "We have an in-house dedicated on-roll team of field engineers at the beck and call of the end user. We provide complete guidance for installation and also support the commissioning and CRS process.",
    answerHi:
      "हमारे पास फील्ड इंजीनियरों की एक समर्पित इन-हाउस ऑन-रोल टीम है जो अंतिम उपयोगकर्ता की सेवा में सदैव तत्पर रहती है। हम स्थापना के लिए पूर्ण मार्गदर्शन प्रदान करते हैं और कमीशनिंग तथा CRS प्रक्रिया में भी सहयोग करते हैं।",
  },
  {
    questionEn: "What happens during a power failure at a level crossing?",
    questionHi: "लेवल क्रॉसिंग पर बिजली गुल होने पर क्या होता है?",
    answerEn:
      "Safety is built into the mechanism. In the event of a power outage or control circuit failure, our barriers feature a fail-safe manual cranking arrangement with an integrated safety cut-off switch. Gatekeepers can smoothly raise or lower the boom manually while ensuring electrical isolation prevents sudden motor restart during operation.",
    answerHi:
      "सुरक्षा मैकेनिज़्म में ही अंतर्निहित है। बिजली कटौती या कंट्रोल सर्किट विफलता की स्थिति में, हमारे बैरियर में एकीकृत सेफ्टी कट-ऑफ स्विच के साथ फेल-सेफ मैनुअल क्रैंकिंग व्यवस्था होती है। गेटकीपर बूम को मैन्युअल रूप से आसानी से ऊपर या नीचे कर सकते हैं, जबकि विद्युत आइसोलेशन संचालन के दौरान मोटर को अचानक पुनः चालू होने से रोकता है।",
  },
  {
    questionEn: "What voltage ratings are compatible with your ELB?",
    questionHi: "आपके ELB के साथ कौन सी वोल्टेज रेटिंग संगत हैं?",
    answerEn:
      "Our ELBs work on all voltages as per RDSO Spec, including 110 V AC as well as 24V DC / 110 V DC (With and Without Hand Generator)",
    answerHi:
      "हमारे ELB, RDSO विनिर्देश के अनुसार सभी वोल्टेज पर कार्य करते हैं, जिनमें 110 V AC के साथ-साथ 24V DC / 110 V DC (हैंड जनरेटर सहित और रहित) शामिल हैं।",
  },
  {
    questionEn: "What quality certifications does your company hold?",
    questionHi: "आपकी कंपनी के पास कौन से गुणवत्ता प्रमाणन हैं?",
    answerEn:
      "We are an ISO 9001:2015 certified manufacturer and hold the MSME Sustainable (ZED) Certification from the Government of India. These certifications verify our standardized quality management systems, complete raw material traceability, and zero-defect, environmentally responsible manufacturing practices.",
    answerHi:
      "हम ISO 9001:2015 प्रमाणित निर्माता हैं और भारत सरकार से MSME सस्टेनेबल (ZED) प्रमाणन प्राप्त हैं। ये प्रमाणन हमारी मानकीकृत गुणवत्ता प्रबंधन प्रणालियों, कच्चे माल की पूर्ण ट्रेसबिलिटी, और शून्य-दोष, पर्यावरण के प्रति उत्तरदायी विनिर्माण प्रथाओं की पुष्टि करते हैं।",
  },
];

export default function AboutFaqs() {
  const { lang } = useLanguage();
  return <section id="faqs-section" className="border-t border-gray-200 bg-gray-50 px-6 py-16 text-gray-900">
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-8 text-3xl font-semibold">{lang === "hi" ? "अक्सर पूछे जाने वाले प्रश्न" : "FAQ"}</h2>
      <div className="space-y-4">{faqs.map((faq) => <details key={faq.questionEn} className="border border-gray-200 bg-white p-5">
        <summary className="cursor-pointer font-semibold">{lang === "hi" ? faq.questionHi : faq.questionEn}</summary>
        <p className="mt-4 text-sm leading-7 text-gray-600">{lang === "hi" ? faq.answerHi : faq.answerEn}</p>
      </details>)}</div>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">
          {lang === "hi"
            ? "अभी भी कोई संदेह है? हमारे मैनुअल, डेटाशीट आदि डाउनलोड करें, या बेझिझक हमसे संपर्क करें"
            : "Still have doubts ? Download our manuals, datasheets etc.. Or feel free to contact us"}
        </p>
        <div className="flex flex-col xs:flex-row gap-4">
          <Link
            href="/downloads"
            className="w-full xs:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-center text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-red-600/20 cursor-pointer"
          >
            {lang === "hi" ? "डाउनलोड" : "Downloads"}
          </Link>
          <Link
            href="/contact"
            className="w-full xs:w-auto px-8 py-4 border border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-semibold text-center text-xs sm:text-sm tracking-wide transition-all cursor-pointer"
          >
            {lang === "hi" ? "संपर्क करें" : "Contact"}
          </Link>
        </div>
      </div>
    </div>
  </section>;
}
