import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUserPreferences } from "@/lib/store";
import { getTranslation } from "@/lib/translations";
import { ChatMessageRequestLanguage } from "@workspace/api-client-react";
import PageIconGuide from "@/components/PageIconGuide";
import {
  ShieldAlert, BookOpen, MessageSquare,
  ArrowRight, Languages, Mic, Users, TrendingUp,
  BadgeCheck, AlertTriangle, Phone, Globe, ChevronRight,
  Building2, Scale, Landmark, ChevronLeft,
  Sprout, Lock
} from "lucide-react";

const LANGUAGES_LIST = [
  { code: "english", name: "English", native: "English" },
  { code: "hindi", name: "Hindi", native: "हिन्दी" },
  { code: "tamil", name: "Tamil", native: "தமிழ்" },
  { code: "telugu", name: "Telugu", native: "తెలుగు" },
  { code: "kannada", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "malayalam", name: "Malayalam", native: "മലയാളം" },
  { code: "bengali", name: "Bengali", native: "বাংলা" },
  { code: "marathi", name: "Marathi", native: "मराठी" },
  { code: "gujarati", name: "Gujarati", native: "ગુજરાતી" },
  { code: "punjabi", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "odia", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "urdu", name: "Urdu", native: "اردو" },
  { code: "assamese", name: "Assamese", native: "অসমীয়া" },
];

export default function Home() {
  const { language, setLanguage } = useUserPreferences();
  const [showLangModal, setShowLangModal] = useState(false);
  const [alertIndex, setAlertIndex] = useState(1);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preferencesSaved = localStorage.getItem("janmitra-preferences");
    const selected = localStorage.getItem("janmitra-lang-selected");
    if (!selected && !preferencesSaved) {
      setShowLangModal(true);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setAlertIndex(prev => (prev === 3 ? 1 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectLanguage = (lang: string) => {
    setLanguage(lang as ChatMessageRequestLanguage);
    localStorage.setItem("janmitra-lang-selected", "true");
    setShowLangModal(false);
  };

  const handleExit = () => {
    localStorage.removeItem("janmitra-lang-selected");
    setShowLangModal(true);
  };

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 240;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const t = (key: string) => getTranslation(language, key);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">

      {/* ── Language Selection Carousel Modal ── */}
      {showLangModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
          <div className="bg-card w-full max-w-2xl rounded-3xl border shadow-2xl p-8 relative overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Indian Flag Stripe decoration inside modal */}
            <div className="absolute top-0 left-0 w-full h-1.5 flex">
              <div className="flex-1 bg-[#FF9933]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-[#138808]" />
            </div>

            <div className="text-center mb-6 pt-4">
              <Languages className="w-12 h-12 text-[#FF9933] mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Language</h2>
              <p className="text-sm text-muted-foreground">अपनी पसंदीदा भाषा चुनें | உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்</p>
            </div>

            {/* Horizontal Carousel */}
            <div className="relative flex items-center group my-6 px-8">
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 w-10 h-10 rounded-full border bg-background hover:bg-muted flex items-center justify-center shadow transition-all focus:outline-none"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>

              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto py-2 px-1 scrollbar-none snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {LANGUAGES_LIST.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className="flex-shrink-0 w-40 h-28 bg-muted hover:bg-[#FF9933]/15 hover:border-[#FF9933] active:scale-95 border-2 rounded-2xl flex flex-col items-center justify-center p-4 snap-start transition-all cursor-pointer shadow-sm"
                  >
                    <span className="text-lg font-bold text-foreground mb-1">{lang.native}</span>
                    <span className="text-xs text-muted-foreground capitalize">{lang.name}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => scroll("right")}
                className="absolute right-0 w-10 h-10 rounded-full border bg-background hover:bg-muted flex items-center justify-center shadow transition-all focus:outline-none"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <div className="text-center mt-4">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted font-semibold rounded-full"
                onClick={() => handleSelectLanguage("english")}
              >
                Continue in English
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="hero-gradient relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-white/[0.03] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#FF9933]/[0.06] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          {/* Ashoka Chakra watermark */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
            <svg viewBox="0 0 200 200" className="w-80 h-80" fill="white">
              <circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="8"/>
              <circle cx="100" cy="100" r="12" fill="white"/>
              {Array.from({length: 24}).map((_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                const x1 = 100 + 14 * Math.cos(angle);
                const y1 = 100 + 14 * Math.sin(angle);
                const x2 = 100 + 88 * Math.cos(angle);
                const y2 = 100 + 88 * Math.sin(angle);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2.5"/>;
              })}
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
            <div className="max-w-3xl">
              {/* Flag stripe */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-1.5 w-24 overflow-hidden rounded-full">
                  <div className="flex-1 bg-[#FF9933]" />
                  <div className="flex-1 bg-white" />
                  <div className="flex-1 bg-[#138808]" />
                </div>
                <span className="text-white/60 text-sm font-medium tracking-widest uppercase">{t("hero.sub")}</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                {t("hero.title")}
              </h1>

              <p className="text-lg md:text-xl text-white/65 max-w-2xl mb-10 leading-relaxed">
                {t("hero.desc")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/chatbot">
                  <Button size="lg" className="bg-[#FF9933] hover:bg-[#e88800] text-white border-0 font-semibold gap-2 text-base h-13 px-8 shadow-xl">
                    <MessageSquare className="w-5 h-5" />
                    {t("hero.chatBtn")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button size="lg" variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/15 font-medium gap-2 text-base h-13 px-8">
                    <Users className="w-5 h-5" />
                    {t("settings.userProfileTitle")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
            <svg viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 64 L0 32 Q360 0 720 32 Q1080 64 1440 32 L1440 64 Z" fill="hsl(210, 33%, 98%)" />
            </svg>
          </div>
        </section>

        {/* ── Live Alerts Carousel ── */}
        <section className="bg-[hsl(210,33%,98%)] pt-8 pb-4 px-6">
          <div className="max-w-7xl mx-auto bg-card border-2 border-[#FF9933]/30 rounded-3xl p-7 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
            <div className="absolute top-0 left-0 h-full w-2 bg-[#FF9933]" />
            <div className="flex items-center gap-3.5 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#FF9933]/15 flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-5 h-5 text-[#FF9933]" />
              </div>
              <span className="text-sm font-bold text-[#FF9933] uppercase tracking-wider whitespace-nowrap">
                {t("alerts.title")}
              </span>
            </div>
            
            <div className="h-px md:h-12 w-full md:w-px bg-border flex-shrink-0" />
            
            <div className="flex-1 overflow-hidden relative min-h-[60px] flex items-center gap-4">
              {/* Dynamic Alert Icon based on context */}
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all duration-300 bg-muted/20">
                {alertIndex === 1 && <Landmark className="w-6 h-6 text-blue-600" />}
                {alertIndex === 2 && <Lock className="w-6 h-6 text-red-600" />}
                {alertIndex === 3 && <Sprout className="w-6 h-6 text-green-600" />}
              </div>
              <div className="w-full animate-in fade-in duration-300">
                <p className="text-base font-semibold text-foreground/90 italic leading-relaxed">
                  "{t(`alerts.alert${alertIndex}`)}"
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button 
                onClick={() => setAlertIndex(prev => prev === 1 ? 3 : prev - 1)}
                className="w-9 h-9 rounded-full border bg-background hover:bg-muted flex items-center justify-center shadow-sm transition-all focus:outline-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <button 
                onClick={() => setAlertIndex(prev => prev === 3 ? 1 : prev + 1)}
                className="w-9 h-9 rounded-full border bg-background hover:bg-muted flex items-center justify-center shadow-sm transition-all focus:outline-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        </section>

        {/* Page Icon Guide Bar */}
        <section className="px-6 py-2">
          <div className="max-w-7xl mx-auto">
            <PageIconGuide page="home" />
          </div>
        </section>

        {/* ── Stats Bar ── */}
        {/* ── Who It Helps ── */}
        <section className="py-20 px-6 bg-muted/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold tracking-widest uppercase text-[#FF9933] mb-3">{t("profiles.subtitle")}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("profiles.title")}</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{t("profiles.desc")}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                {
                  title: t("profiles.farmer.title"),
                  subtitle: t("profiles.farmer.sub"),
                  Icon: Users,
                  color: "bg-[hsl(145,63%,95%)] border-[hsl(145,63%,80%)]",
                  iconBg: "bg-[hsl(145,63%,28%)]",
                  textColor: "text-[hsl(145,63%,28%)]",
                  desc: t("profiles.farmer.desc")
                },
                {
                  title: t("profiles.msme.title"),
                  subtitle: t("profiles.msme.sub"),
                  Icon: TrendingUp,
                  color: "bg-orange-50 border-orange-200",
                  iconBg: "bg-[#FF9933]",
                  textColor: "text-[#e88800]",
                  desc: t("profiles.msme.desc")
                },
              ].map((card) => (
                <div key={card.title} className={`p-6 rounded-2xl border card-glow cursor-default transition-all ${card.color}`}>
                  <div className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
                    <card.Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold mb-1 ${card.textColor}`}>{card.title}</h3>
                  <p className="text-xs font-medium text-muted-foreground mb-3">{card.subtitle}</p>
                  <p className="text-sm text-foreground/70 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Core Features ── */}
        <section className="py-20 px-6 bg-background">
          <div className="max-w-7xl mx-auto border-b pb-16">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold tracking-widest uppercase text-[#FF9933] mb-3">{t("features.subtitle")}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("features.title")}</h2>
            </div>
            
            <div className="space-y-8">
              {/* Row 1: Chat, Languages, Voice */}
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: MessageSquare,
                    title: t("features.chat.title"),
                    desc: t("features.chat.desc"),
                    accent: "bg-[hsl(224,65%,23%)]",
                  },
                  {
                    icon: Languages,
                    title: t("features.langs.title"),
                    desc: t("features.langs.desc"),
                    accent: "bg-[#FF9933]",
                  },
                  {
                    icon: Mic,
                    title: t("features.voice.title"),
                    desc: t("features.voice.desc"),
                    accent: "bg-[hsl(145,63%,28%)]",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all group card-glow flex flex-col h-full">
                    <div className={`w-12 h-12 ${feature.accent} rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed flex-1">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Row 2: Personalized Impact, Fraud Alerts */}
              <div className="flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto">
                {[
                  {
                    icon: Users,
                    title: t("features.impact.title"),
                    desc: t("features.impact.desc"),
                    accent: "bg-[#FF9933]",
                  },
                  {
                    icon: ShieldAlert,
                    title: t("features.fraud.title"),
                    desc: t("features.fraud.desc"),
                    accent: "bg-red-600",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="w-full md:w-[calc(50%-1rem)] p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all group card-glow flex flex-col h-full">
                    <div className={`w-12 h-12 ${feature.accent} rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed flex-1">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-20 px-6 bg-[hsl(224,65%,13%)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]">
            <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#FF9933]" />
            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white" />
          </div>
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold tracking-widest uppercase text-[#FF9933] mb-3">{t("works.subtitle")}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("works.title")}</h2>
              <p className={`text-white/60 max-w-xl mx-auto ${language === 'gujarati' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>{t("works.desc")}</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "01", icon: Users, title: t("works.step1.title"), desc: t("works.step1.desc") },
                { step: "02", icon: MessageSquare, title: t("works.step2.title"), desc: t("works.step2.desc") },
                { step: "03", icon: Scale, title: t("works.step3.title"), desc: t("works.step3.desc") },
                { step: "04", icon: BookOpen, title: t("works.step4.title"), desc: t("works.step4.desc") },
              ].map((step, i) => (
                <div key={step.step} className="relative">
                  {i < 3 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-white/10 z-0">
                      <ChevronRight className="absolute -right-2 -top-2.5 text-white/20 w-5 h-5" />
                    </div>
                  )}
                  <div className="relative z-10 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="text-[#FF9933] text-xs font-bold tracking-widest mb-4">{step.step}</div>
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">{step.title}</h4>
                    <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link href="/chatbot">
                <Button size="lg" className="bg-[#FF9933] hover:bg-[#e88800] text-white border-0 font-semibold gap-2 text-base px-10 shadow-xl">
                  {t("works.btn")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Fraud Awareness ── */}
        <section className="py-20 px-6 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">{t("fraud.subtitle")}</p>
                <h2 className="text-3xl font-bold text-foreground">{t("fraud.title")}</h2>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Phone,
                  title: t("fraud.alert1.title"),
                  body: t("fraud.alert1.body"),
                  tag: t("fraud.alert1.tag"),
                  tagColor: "bg-red-100 text-red-700",
                  border: "border-l-4 border-l-red-500",
                },
                {
                  icon: AlertTriangle,
                  title: t("fraud.alert2.title"),
                  body: t("fraud.alert2.body"),
                  tag: t("fraud.alert2.tag"),
                  tagColor: "bg-orange-100 text-orange-700",
                  border: "border-l-4 border-l-orange-400",
                },
                {
                  icon: Globe,
                  title: t("fraud.alert3.title"),
                  body: t("fraud.alert3.body"),
                  tag: t("fraud.alert3.tag"),
                  tagColor: "bg-yellow-100 text-yellow-700",
                  border: "border-l-4 border-l-yellow-400",
                },
              ].map((alert) => (
                <div key={alert.title} className={`p-6 bg-card rounded-xl border shadow-sm ${alert.border}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <alert.icon className="w-5 h-5 text-red-600" />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${alert.tagColor}`}>{alert.tag}</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2 text-foreground">{alert.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{alert.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-20 px-6 bg-gradient-to-r from-[hsl(224,65%,18%)] to-[hsl(224,55%,28%)]">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#FF9933]/20 border border-[#FF9933]/30 rounded-full px-4 py-1.5 text-sm font-medium text-[#FF9933] mb-6">
              <Building2 className="w-4 h-4" />
              {t("cta.badge")}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t("cta.title")}
            </h2>
            <p className="text-white/65 text-lg mb-10 max-w-2xl mx-auto">
              {t("cta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/chatbot">
                <Button size="lg" className="bg-[#FF9933] hover:bg-[#e88800] text-white border-0 font-semibold gap-2 text-base h-13 px-8 shadow-xl">
                  <MessageSquare className="w-5 h-5" />
                  {t("cta.btn2")}
                </Button>
              </Link>
            </div>
            <div className="mt-12">
              <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-4">Supported Languages</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {LANGUAGES_LIST.map((lang) => (
                  <span key={lang.code} className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/20 transition-colors">
                    {lang.native} ({lang.name})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Contact Us ── */}
      <section className="py-12 bg-card border-t">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">{t("contact.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("contact.desc")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 text-sm font-semibold text-foreground/80">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#FF9933]" />
              <span>+91 1800 425 4999 (Toll-Free)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#FF9933]" />
              <span>support@janmitra.gov.in</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[hsl(224,65%,9%)] text-white/50 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF9933] flex items-center justify-center">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">{t("appName")}</span>
            <span className="text-white/30 text-sm">{t("subTitle")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#FF9933]" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-[#138808]" />
            <span className="ml-3 text-sm">{t("footer.subtitle")}</span>
          </div>
          <p className="text-xs text-white/30">{t("footer.disclaimer")}</p>
        </div>
      </footer>
    </div>
  );
}
