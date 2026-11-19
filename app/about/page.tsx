"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AramcoHeader from "../components/AramcoHeader";
import Footer from "../components/Footer";
import AboutFaqs from "../components/AboutFaqs";
import { LanguageProvider, useLanguage } from "../context/LanguageContext";

function AboutUsContent() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<"vision" | "mission">("vision");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Top Banner Slides: Auto-changing every 3 seconds
  const TOP_BANNER_SLIDES = [
    {
      id: "slide-1",
      image: "/images/boom_barrier_railway.jpg",
      title: "Railway Barrier Automation",
    },
    {
      id: "slide-2",
      image: "/images/earth_leakage_detector_hero.jpg",
      title: "Digital Earth Leakage Detection",
    },
    {
      id: "slide-3",
      image: "/images/eld_engineering_lab.jpg",
      title: "100% Factory Validation Testing",
    },
    {
      id: "slide-4",
      image: "/images/power_distribution_eld.jpg",
      title: "Continuous Power & Substation Safety",
    },
    {
      id: "slide-5",
      image: "/images/crash_barrier_perimeter.jpg",
      title: "Industrial Perimeter Access Protection",
    },
  ];

  // Auto-play timer for top banner (3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TOP_BANNER_SLIDES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [TOP_BANNER_SLIDES.length]);

  const STATS = [
    {
      value: "10,000+",
      label: lang === "hi" ? "इलेक्ट्रिक लिफ्टिंग बैरियर स्थापित" : "Electric Lifting Barriers Installed",
      sub: lang === "hi" ? "भारतीय रेलवे नेटवर्क में" : "Across the Indian Railways network",
    },
    {
      value: "200+",
      label: lang === "hi" ? "कर्मचारी" : "Employees",
      sub: lang === "hi" ? "इन-हाउस ऑन-रोल टीम" : "In-house on-roll team",
    },
    {
      value: "3+",
      label: lang === "hi" ? "देशों में सेवा" : "Countries Served",
      sub: lang === "hi" ? "भारत एवं वैश्विक बाजार" : "India & global markets",
    },
    {
      value: "20",
      label: lang === "hi" ? "वर्षों की सेवा" : "Years of Service",
      sub: lang === "hi" ? "स्था. 2006" : "Estd. 2006",
    },
  ];

  const DISCIPLINES = [
    {
      id: "iso",
      name: "ISO 9001:2015",
      title: lang === "hi" ? "गुणवत्ता प्रबंधन प्रणाली" : "Quality Management System",
      desc: lang === "hi" ? "मानकीकृत प्रक्रियाएं, पूर्ण बैच ट्रेसबिलिटी और निरंतर सुधार।" : "Standardized processes, complete batch traceability, and continuous improvement.",
      image: "/images/eld_engineering_lab.jpg",
    },
    {
      id: "zed",
      name: lang === "hi" ? "MSME सस्टेनेबल (ZED)" : "MSME Sustainable (ZED)",
      title: lang === "hi" ? "ज़ीरो डिफेक्ट, ज़ीरो इफेक्ट" : "Zero Defect, Zero Effect",
      desc: lang === "hi" ? "सूक्ष्म, लघु एवं मध्यम उद्यम मंत्रालय, भारत सरकार।" : "Ministry of Micro, Small & Medium Enterprises, Government of India.",
      image: "/images/power_distribution_eld.jpg",
    },
    {
      id: "rdso",
      name: lang === "hi" ? "RDSO अनुमोदित" : "RDSO Approved",
      title: "RDSO/SPN/208/2012 Ver 2.0",
      desc: lang === "hi" ? "RDSO विनिर्देश के अनुसार इलेक्ट्रिक लिफ्टिंग बैरियर (ELB) के अनुमोदित निर्माता।" : "Approved manufacturers of Electric Lifting Barrier (ELB) as per RDSO Spec.",
      image: "/images/boom_barrier_hero.jpg",
    },
  ];

  const WORKFLOW_STEPS = [
    {
      step: "01",
      title: lang === "hi" ? "फेल-सेफ इलेक्ट्रो-मैकेनिकल डिज़ाइन" : "Fail-Safe Electro-Mechanical Design",
      desc: lang === "hi" ? "सटीक रूप से इंजीनियर किए गए गियरबॉक्स, हाई-टॉर्क मोटर और विश्वसनीय लिमिट-स्विच असेंबली, जो लाखों परेशानी-मुक्त परिचालन चक्रों के लिए इंजीनियर की गई हैं।" : "Precision-engineered gearboxes, high-torque motors, and reliable limit-switch assemblies engineered for hundreds of thousands of trouble-free operating cycles.",
    },
    {
      step: "02",
      title: lang === "hi" ? "सभी मौसमों में टिकाऊपन" : "All-Weather Durability",
      desc: lang === "hi" ? "अत्यधिक गर्मी, धूल और मूसलाधार बारिश को सहने के लिए निर्मित जंग-रोधी एनक्लोज़र और हेवी-ड्यूटी काउंटरवेट।" : "Corrosion-resistant enclosures and heavy-duty counterweights built to withstand extreme heat, dust, and torrential rain.",
    },
    {
      step: "03",
      title: lang === "hi" ? "निर्बाध इंटरलॉकिंग एकीकरण" : "Seamless Interlocking Integration",
      desc: lang === "hi" ? "रूट रिले इंटरलॉकिंग (RRI), सॉलिड स्टेट इंटरलॉकिंग (SSI) और इलेक्ट्रॉनिक इंटरलॉकिंग (EI) प्रणालियों के साथ पूर्ण संगतता, आपातकालीन बिजली हानि के लिए मैनुअल क्रैंकिंग फेल-सेफ सहित।" : "Full compatibility with Route Relay Interlocking (RRI), Solid State Interlocking (SSI), and Electronic Interlocking (EI) systems, complete with manual cranking fail-safes for emergency power loss.",
    },
    {
      step: "04",
      title: lang === "hi" ? "एंड-टू-एंड निष्पादन" : "End-to-End Execution",
      desc: lang === "hi" ? "विनिर्माण के अतिरिक्त, हम फैक्ट्री एक्सेप्टेंस टेस्टिंग (FAT), साइट इंस्टॉलेशन पर्यवेक्षण, कमीशनिंग सहायता और असली स्पेयर पार्ट्स की आपूर्ति में सहयोग प्रदान करते हैं।" : "Beyond manufacturing, we provide support with factory acceptance testing (FAT), site installation supervision, commissioning assistance, and genuine spare parts supply.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#ff3131] selection:text-white relative">
      {/* 1. Header */}
      <AramcoHeader />

      {/* 
        =======================================================================
        1. TOP BANNER (Clean, Fresh & Bright 3-Second Visual Slideshow)
        =======================================================================
      */}
      <section className="relative w-full h-[50vh] sm:h-[65vh] min-h-[380px] sm:min-h-[480px] overflow-hidden bg-slate-100 select-none border-b border-slate-200">
        {TOP_BANNER_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <div
              className={`w-full h-full bg-cover bg-center transition-transform duration-[4000ms] ease-out ${
                idx === currentSlide ? "scale-105" : "scale-100"
              }`}
              style={{
                backgroundImage: `url(${slide.image})`,
              }}
            />
          </div>
        ))}

        {/* Slide Indicators at bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2 bg-white/80 backdrop-blur-xs px-3 py-1.5 border border-slate-300">
          {TOP_BANNER_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 transition-all cursor-pointer ${
                idx === currentSlide ? "w-6 bg-[#ff3131]" : "w-2 bg-slate-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 
        =======================================================================
        2. MAIN ABOUT US OVERVIEW SECTION (RED & WHITE THEME)
        =======================================================================
      */}
      <section className="relative w-full py-16 sm:py-24 bg-white text-slate-800 overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7">
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight leading-[1.18] text-slate-900 mb-5 font-sans">
                {lang === "hi" ? (
                  <>
                    परिचय <br />
                    <span className="text-red-600">रेलवे की सेवा में 20 वर्ष (स्था. 2006)</span>
                  </>
                ) : (
                  <>
                    Introduction <br />
                    <span className="text-red-600">20 Years of Service to the Railways (Estd. 2006)</span>
                  </>
                )}
              </h1>

              {/* Narrative Summary */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mb-4 font-normal">
                {lang === "hi"
                  ? "Global में, हम भारतीय रेलवे नेटवर्क के लिए विशेष रूप से इंजीनियर किए गए हेवी-ड्यूटी इंटरलॉक्ड इलेक्ट्रिक लिफ्टिंग बैरियर (ELB) के डिज़ाइन, निर्माण और कमीशनिंग में विशेषज्ञता रखते हैं। अनुसंधान अभिकल्प एवं मानक संगठन (RDSO) के विनिर्देशों के कड़ाई से अनुपालन में निर्मित, हमारे सिग्नलिंग और लेवल-क्रॉसिंग समाधान मजबूत यांत्रिक विश्वसनीयता और आधुनिक फेल-सेफ ऑटोमेशन के बीच की दूरी को पाटते हैं।"
                  : "At Global, we specialize in the design, manufacturing, and commissioning of heavy-duty interlocked Electric Lifting Barriers (ELBs) engineered specifically for the Indian Railways network. Built in strict compliance with Research Designs and Standards Organisation (RDSO) specifications, our signaling and level-crossing solutions bridge the gap between rugged mechanical reliability and modern fail-safe automation."}
              </p>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mb-4 font-normal">
                {lang === "hi"
                  ? "हमारी कंपनी के पास 1 लाख वर्ग फुट से अधिक की विनिर्माण सुविधाएं हैं, जो आधुनिक CNC मशीनिंग सेंटर, सटीक गियर-कटिंग यूनिट, स्वचालित पाउडर-कोटिंग लाइनों और समर्पित इलेक्ट्रिकल असेंबली बे से सुसज्जित हैं।"
                  : "Our company boasts of over 1 Lakh Square Feet of manufacturing facilities equipped with modern CNC machining centers, precision gear-cutting units, automated powder-coating lines, and dedicated electrical assembly bays."}
              </p>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mb-8 font-normal">
                {lang === "hi"
                  ? "उच्च-घनत्व वाले माल ढुलाई कॉरिडोर से लेकर दूरस्थ क्षेत्रीय जंक्शनों तक, हम रेलवे ज़ोन, EPC ठेकेदारों और इंफ्रास्ट्रक्चर डेवलपर्स के साथ मिलकर जीवन की रक्षा करने, रेल-सड़क यातायात को सुव्यवस्थित करने और भारत के रेल इंफ्रास्ट्रक्चर का आधुनिकीकरण करने के लिए कार्य करते हैं।"
                  : "From high-density freight corridors to remote regional junctions, we partner with railway zones, EPC contractors, and infrastructure developers to safeguard lives, streamline rail-road traffic, and modernize India’s rail infrastructure."}
              </p>

              {/* Key Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-xl">
                <div className="flex items-start space-x-2.5 p-3.5 bg-slate-50 border border-slate-200">
                  <div className="w-5 h-5 bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-red-600 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {lang === "hi" ? "RDSO अनुमोदित निर्माता" : "RDSO Approved Manufacturer"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {lang === "hi" ? "इलेक्ट्रिक लिफ्टिंग बैरियर (ELB) - RDSO/SPN/208/2012 Ver 2.0" : "Electric Lifting Barrier (ELB) - RDSO/SPN/208/2012 Ver 2.0"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3.5 bg-slate-50 border border-slate-200">
                  <div className="w-5 h-5 bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-red-600 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {lang === "hi" ? "ISO 9001:2015 एवं ZED प्रमाणित" : "ISO 9001:2015 & ZED Certified"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {lang === "hi" ? "MSME सस्टेनेबल (ZED) प्रमाणन, भारत सरकार" : "MSME Sustainable (ZED) Certification, Government of India"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
                <Link
                  href="/products/railway-barrier-system"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-red-600/20 cursor-pointer"
                >
                  <span>{lang === "hi" ? "हमारे उत्पाद देखें" : "Explore Safety Solutions"}</span>
                  <span>→</span>
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-xs cursor-pointer"
                >
                  <span>{lang === "hi" ? "इंजीनियरिंग टीम से बात करें" : "Talk to Engineering"}</span>
                </Link>
              </div>
            </div>

            {/* Right Media Composition with Sharp Straight Borders */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white p-2 border border-slate-200 shadow-xs">
                <div className="w-full h-[280px] sm:h-[400px] overflow-hidden border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/boom_barrier_railway.jpg"
                    alt="GLOBAL Railway Barrier System"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
                <div className="p-3 bg-white border-t border-slate-100">
                  <span className="text-xs text-red-600 font-bold uppercase tracking-wider block font-mono">
                    {lang === "hi" ? "रेलवे की सेवा में 20 वर्ष" : "20 Years of Service to the Railways"}
                  </span>
                  <span className="text-xs text-slate-600">
                    {lang === "hi"
                      ? "स्था. 2006 - काला-अंब औद्योगिक क्षेत्र, हिमाचल प्रदेश"
                      : "Estd. 2006 - Kala-amb Industrial Area, Himachal Pradesh"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        =======================================================================
        3. ENTERPRISE METRICS (4 Stat Counters)
        =======================================================================
      */}
      <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map((stat, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-5 sm:p-6 bg-white border border-slate-200 hover:border-red-300 transition-all shadow-xs group"
              >
                <div className="text-3xl sm:text-5xl font-bold font-mono tracking-tight mb-2 text-red-600 group-hover:scale-105 transition-transform">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 text-center mb-1">
                  {stat.label}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 text-center font-normal">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        =======================================================================
        4. MANUFACTURING & ENGINEERING EXCELLENCE (Railway & ELD Systems Profile)
        =======================================================================
      */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Core Products Showcase (Sharp Straight Rectangles) */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
                
                {/* 1. Tall Left: Railway Barrier */}
                <div className="col-span-6 border border-slate-200 bg-white p-1.5 shadow-xs h-[360px] sm:h-[460px]">
                  <div className="w-full h-full overflow-hidden bg-slate-100 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/boom_barrier_railway.jpg"
                      alt="GLOBAL Railway Barrier & Signaling Mechanism"
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                </div>

                {/* Right Stack: Digital ELD + Lab Validation */}
                <div className="col-span-6 flex flex-col gap-3.5 sm:gap-4 h-[360px] sm:h-[460px]">
                  <div className="flex-1 border border-slate-200 bg-white p-1.5 shadow-xs">
                    <div className="w-full h-full overflow-hidden bg-slate-100 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/earth_leakage_detector_hero.jpg"
                        alt="GLOBAL Digital Earth Leakage Detector Machine"
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                  </div>

                  <div className="flex-1 border border-slate-200 bg-white p-1.5 shadow-xs">
                    <div className="w-full h-full overflow-hidden bg-slate-100 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/eld_engineering_lab.jpg"
                        alt="GLOBAL 100% Factory Validation Lab"
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Detailed Corporate Manufacturing Copy */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-[1.18] font-sans">
                {lang === "hi" ? (
                  <>
                    हमारी <span className="text-red-600">कहानी</span>
                  </>
                ) : (
                  <>
                    Our <span className="text-red-600">Story</span>
                  </>
                )}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === "hi"
                  ? "2006 में हिमाचल प्रदेश के काला-अंब औद्योगिक क्षेत्र में स्थापित, Global Devices ने एक स्पष्ट उद्देश्य के साथ शुरुआत की: स्वदेशी, उच्च-परिशुद्धता इंजीनियरिंग के माध्यम से पुराने, मैन्युअल रूप से संचालित लेवल क्रॉसिंग की कमज़ोरियों को समाप्त करना। भारतीय रेल नेटवर्क की कठिन पर्यावरणीय और परिचालन वास्तविकताओं—अत्यधिक मानसूनी नमी से लेकर 24/7 भारी-चक्र संचालन तक—को समझते हुए, हमारी टीम ने ऐसे लिफ्टिंग बैरियर बनाने का लक्ष्य रखा जिन्हें न्यूनतम रखरखाव की आवश्यकता हो और जो बिना किसी समझौते के सुरक्षा प्रदान करें।"
                  : "Founded in 2006 in the Kala-amb Industrial Area of Himachal Pradesh , Global Devices began with a clear objective: to eliminate the vulnerabilities of aging, manually operated level crossings through indigenous, high-precision engineering. Recognizing the demanding environmental and operational realities of the Indian rail network—ranging from extreme monsoon humidity to 24/7 heavy-cycle operations—our team set out to build lifting barriers that require minimal maintenance while delivering uncompromising safety."}
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === "hi"
                  ? "पिछले 20 वर्षों में, हम एक विशेष फैब्रिकेशन यूनिट से बढ़कर एक विश्वसनीय रेलवे उपकरण निर्माता बन गए हैं। हमारे द्वारा निर्मित प्रत्येक बैरियर मैकेनिज़्म, कंट्रोल कंसोल और बूम असेंबली दशकों की धातुकर्म विशेषज्ञता, कठोर फील्ड परीक्षण और मेक इन इंडिया पहल के प्रति गहरी प्रतिबद्धता को दर्शाती है।"
                  : <>Over the past 20 years, we have grown from a specialized fabrication unit into a trusted railway equipment manufacturer. Every barrier mechanism, control console, and boom assembly we produce reflects decades of metallurgical expertise, rigorous field testing, and a deep commitment to the <em>Make in India</em> initiative.</>}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 
        =======================================================================
        5. TWO CORE DOMAINS (Interactive Deep Dive)
        =======================================================================
      */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 font-sans">
                {lang === "hi" ? "हमारा विज़न और मिशन" : "Our Vision and Mission"}
              </h2>
            </div>

            {/* Vision / Mission Switcher Tabs */}
            <div className="flex items-center space-x-2 mt-6 md:mt-0 p-1 bg-white border border-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab("vision")}
                className={`px-5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "vision"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {lang === "hi" ? "हमारा विज़न" : "Our Vision"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("mission")}
                className={`px-5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "mission"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {lang === "hi" ? "हमारा मिशन" : "Our Mission"}
              </button>
            </div>
          </div>

          {/* Tab 1: Vision */}
          {activeTab === "vision" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center animate-in fade-in duration-300">
              <div className="lg:col-span-6 space-y-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans leading-tight">
                  {lang === "hi" ? "हमारा विज़न" : "Our Vision"}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  {lang === "hi"
                    ? "स्वदेशी नवाचार और इंजीनियरिंग उत्कृष्टता के माध्यम से शून्य-दुर्घटना रेल-सड़क चौराहों को साकार करते हुए, रेलवे लेवल-क्रॉसिंग ऑटोमेशन में भारत का सबसे विश्वसनीय मानदंड बनना।"
                    : "To be India’s most trusted benchmark in railway level-crossing automation, driving zero-accident rail-road intersections through indigenous innovation and engineering excellence."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { en: "State of the art Manufacturing", hi: "अत्याधुनिक विनिर्माण" },
                    { en: "Innovative Solutions", hi: "नवोन्मेषी समाधान" },
                    { en: "Quality Assurance", hi: "गुणवत्ता आश्वासन" },
                    { en: "Commitment to Safety", hi: "सुरक्षा के प्रति प्रतिबद्धता" },
                  ].map((f, idx) => (
                    <div key={idx} className="p-3.5 bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 flex items-center space-x-2.5">
                      <span className="text-red-600 font-bold text-xs">✓</span>
                      <span>{lang === "hi" ? f.hi : f.en}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    href="/products/railway-barrier-system"
                    className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer group"
                  >
                    <span>{lang === "hi" ? "इलेक्ट्रिक लिफ्टिंग बैरियर देखें" : "View Electric Lifting Barriers"}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="bg-white p-2 border border-slate-200 shadow-xs">
                  <div className="w-full h-[320px] sm:h-[420px] overflow-hidden bg-slate-100 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/boom_barrier_hero.jpg"
                      alt="Electric Lifting Barrier"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Mission */}
          {activeTab === "mission" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center animate-in fade-in duration-300">
              <div className="lg:col-span-6 space-y-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans leading-tight">
                  {lang === "hi" ? "हमारा मिशन" : "Our Mission"}
                </h3>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  {[
                    {
                      en: "To manufacture robust, 100% RDSO-compliant Electric Lifting Barriers that perform reliably under the harshest climatic and operational conditions.",
                      hi: "मजबूत, 100% RDSO-अनुपालक इलेक्ट्रिक लिफ्टिंग बैरियर का निर्माण करना जो सबसे कठोर जलवायु और परिचालन परिस्थितियों में भी विश्वसनीय रूप से कार्य करें।",
                    },
                    {
                      en: "To continually refine fail-safe electro-mechanical designs that reduce lifecycle maintenance costs for Indian Railways.",
                      hi: "फेल-सेफ इलेक्ट्रो-मैकेनिकल डिज़ाइनों को निरंतर परिष्कृत करना जो भारतीय रेलवे के लिए जीवनचक्र रखरखाव लागत को कम करें।",
                    },
                    {
                      en: "To uphold uncompromising quality assurance, ethical business practices, and on-time project delivery for every public and private sector partner.",
                      hi: "प्रत्येक सार्वजनिक और निजी क्षेत्र के भागीदार के लिए बिना समझौते के गुणवत्ता आश्वासन, नैतिक व्यावसायिक प्रथाओं और समय पर परियोजना डिलीवरी को बनाए रखना।",
                    },
                  ].map((f, idx) => (
                    <div key={idx} className="p-3.5 bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 flex items-center space-x-2.5">
                      <span className="text-red-600 font-bold text-xs">✓</span>
                      <span>{lang === "hi" ? f.hi : f.en}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    href="/products/railway-barrier-system"
                    className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer group"
                  >
                    <span>{lang === "hi" ? "इलेक्ट्रिक लिफ्टिंग बैरियर देखें" : "View Electric Lifting Barriers"}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="bg-white p-2 border border-slate-200 shadow-xs">
                  <div className="w-full h-[320px] sm:h-[420px] overflow-hidden bg-slate-100 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/boom_barrier_railway.jpg"
                      alt="Railway Level Crossing Barrier"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 
        =======================================================================
        6. OPERATIONAL WORKFLOW (4-Step Pipeline)
        =======================================================================
      */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 font-sans leading-tight">
              {lang === "hi" ? "मुख्य क्षमताएं एवं RDSO अनुपालन" : "Core Capabilities and RDSO Compliance"}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 font-normal">
              {lang === "hi"
                ? "रेलवे सिग्नलिंग में त्रुटि की कोई गुंजाइश नहीं होती। हमारी विनिर्माण प्रक्रियाएं और उत्पाद संरचनाएं नवीनतम RDSO तकनीकी विनिर्देशों और संबंधित संशोधनों के अनुरूप हैं, ताकि मौजूदा इंटरलॉकिंग और ब्लॉक-वर्किंग प्रणालियों के साथ निर्बाध एकीकरण सुनिश्चित हो सके।"
                : "Railway signaling leaves zero margin for error. Our manufacturing processes and product architectures are aligned with the latest RDSO technical specifications and relevant amendments to ensure seamless integration with existing interlocking and block-working systems."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step) => (
              <div
                key={step.step}
                className="p-6 sm:p-7 bg-slate-50 border border-slate-200 hover:border-red-300 transition-all flex flex-col justify-between shadow-xs group"
              >
                <div>
                  <div className="text-3xl sm:text-4xl font-mono font-bold text-red-600 mb-4 tracking-tight">
                    {step.step}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 font-sans group-hover:text-red-600 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 
        =======================================================================
        7. ENGINEERING DISCIPLINES & EXPERTISE
        =======================================================================
      */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 sm:mb-16">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 font-sans">
                {lang === "hi" ? "प्रमाणित उत्कृष्टता: ISO 9001 एवं ZED मानक" : "Certified Excellence: ISO 9001 & ZED Standards"}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-3 font-normal max-w-3xl leading-relaxed">
                {lang === "hi"
                  ? "गुणवत्ता और स्थिरता हमारी शॉप-फ्लोर संस्कृति में समाहित हैं। Global Devices कड़ाई से ऑडिट की गई ISO 9001:2015 गुणवत्ता प्रबंधन प्रणाली के अंतर्गत कार्य करता है, जो डिज़ाइन, फैब्रिकेशन और असेंबली के प्रत्येक चरण में मानकीकृत प्रक्रियाएं, पूर्ण बैच ट्रेसबिलिटी और निरंतर सुधार सुनिश्चित करती है। इसके अतिरिक्त, हमें भारत सरकार के सूक्ष्म, लघु एवं मध्यम उद्यम मंत्रालय से MSME सस्टेनेबल (ZED) प्रमाणन प्राप्त होने पर गर्व है। ज़ीरो डिफेक्ट, ज़ीरो इफेक्ट सिद्धांतों का पालन करते हुए, हम सुनिश्चित करते हैं कि हमारी सुविधा से निकलने वाला प्रत्येक इलेक्ट्रिक लिफ्टिंग बैरियर बिना समझौते के विश्वसनीयता मानकों को पूरा करे, साथ ही संसाधन-कुशल, स्वच्छ विनिर्माण प्रथाओं के माध्यम से हमारे पर्यावरणीय प्रभाव को न्यूनतम रखे।"
                  : <>Quality and sustainability are embedded into our shop-floor culture. <strong>Global Devices</strong> operates under a strictly audited <strong>ISO 9001:2015</strong> Quality Management System, ensuring standardized processes, complete batch traceability, and continuous improvement across every stage of design, fabrication, and assembly. Furthermore, we are proud to hold the <strong>MSME Sustainable (ZED) Certification</strong> from the Ministry of Micro, Small &amp; Medium Enterprises, Government of India. By adhering to <em>Zero Defect, Zero Effect</em> principles, we guarantee that every Electric Lifting Barrier leaving our facility meets uncompromising reliability benchmarks while minimizing our environmental footprint through resource-efficient, clean manufacturing practices.</>}
              </p>
            </div>

            <Link
              href="/contact"
              className="mt-6 sm:mt-0 inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-md shadow-red-600/20 self-start sm:self-auto cursor-pointer"
            >
              {lang === "hi" ? "संपर्क करें" : "Contact Us"}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {DISCIPLINES.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-slate-200 hover:border-red-300 transition-all shadow-xs group flex flex-col justify-between"
              >
                <div className="w-full h-48 overflow-hidden relative bg-slate-100 border-b border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.image}
                    alt={d.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="p-5 text-start flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors mb-1">
                      {d.name}
                    </h3>
                    <div className="text-xs font-semibold text-red-600 mb-2 font-mono">
                      {d.title}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {d.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 
        =======================================================================
        8. DIRECT CONSULTATION CTA BANNER
        =======================================================================
      */}
      <section className="py-16 sm:py-24 bg-white text-slate-900 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-5 font-sans">
            {lang === "hi"
              ? "आइए मिलकर सुरक्षित इंफ्रास्ट्रक्चर बनाएं"
              : "Let’s Build Safer Infrastructure Together"}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8 font-normal">
            {lang === "hi"
              ? "चाहे आप टर्नकी रेलवे विद्युतीकरण परियोजना निष्पादित कर रहे हों, मानवयुक्त लेवल क्रॉसिंग को अपग्रेड कर रहे हों, या RDSO-अनुपालक सिग्नलिंग हार्डवेयर की खरीद कर रहे हों, हमारी इंजीनियरिंग टीम तकनीकी डेटाशीट और परियोजना कोटेशन में सहायता के लिए तैयार है।"
              : "Whether you are executing a turnkey railway electrification project, upgrading manned level crossings, or sourcing RDSO-compliant signaling hardware, our engineering team is ready to assist with technical datasheets and project quotes."}
          </p>

          <div className="flex flex-col xs:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="w-full xs:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-center text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-red-600/20 cursor-pointer"
            >
              {lang === "hi" ? "संपर्क करें" : "Contact Us"}
            </Link>
            <Link
              href="/contact/engineering-team"
              className="w-full xs:w-auto px-8 py-4 border border-slate-300 hover:border-slate-400 bg-slate-50 text-slate-800 font-semibold text-center text-xs sm:text-sm tracking-wide transition-all cursor-pointer"
            >
              {lang === "hi" ? "इंजीनियरिंग टीम से संपर्क करें" : "Contact Engineering Team"}
            </Link>
          </div>

        </div>
      </section>


      <AboutFaqs />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function AboutPage() {
  return (
    <LanguageProvider>
      <AboutUsContent />
    </LanguageProvider>
  );
}
