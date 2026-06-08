import { ReactNode, useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Landmark, LogOut, Volume2, VolumeX } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useUserPreferences } from "@/lib/store";
import { getTranslation } from "@/lib/translations";
import { speakText, cancelSpeech } from "@/lib/speech";
import { toast } from "@/hooks/use-toast";

function getPageTextToRead(lang: string): string {
  const texts: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === 3) { // Text Node
      const text = node.textContent?.trim();
      if (text && text.length > 1) {
        const parent = node.parentElement;
        if (parent) {
          const tagName = parent.tagName.toLowerCase();
          const isButton = parent.closest("button") || (parent.closest("a") && parent.closest("aside"));
          if (
            tagName !== "script" &&
            tagName !== "style" &&
            !isButton &&
            !text.startsWith("₹") &&
            !text.includes("%") &&
            !text.includes("http") &&
            !text.toLowerCase().includes("read page") &&
            !text.toLowerCase().includes("stop reading")
          ) {
            texts.push(text);
          }
        }
      }
    } else if (node.nodeType === 1) { // Element Node
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();
      // Skip scripts, styles, buttons, and settings selectors (which are often empty or raw codes)
      if (
        tagName !== "script" &&
        tagName !== "style" &&
        tagName !== "button" &&
        !el.classList.contains("sr-only")
      ) {
        for (let i = 0; i < el.childNodes.length; i++) {
          walk(el.childNodes[i]);
        }
      }
    }
  };

  // 1. Walk sidebar links
  const sidebarEl = document.querySelector("aside");
  if (sidebarEl) {
    const sidebarIntro = lang === "hindi" ? "नेविगेशन मेनू: " : "Navigation menu: ";
    texts.push(sidebarIntro);
    const links = Array.from(sidebarEl.querySelectorAll("a"));
    links.forEach(link => {
      const txt = link.textContent?.trim();
      if (txt && !txt.toLowerCase().includes("back") && !txt.toLowerCase().includes("exit")) {
        texts.push(txt);
      }
    });
    texts.push(". ");
  }

  // 2. Walk main page content
  const mainEl = document.querySelector("main");
  if (mainEl) {
    walk(mainEl);
  }

  return texts.join(". ");
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { language } = useUserPreferences();
  const t = (key: string) => getTranslation(language, key);
  const [isReadingPage, setIsReadingPage] = useState(false);

  useEffect(() => {
    cancelSpeech();
    setIsReadingPage(false);
  }, [location]);

  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, []);

  const handleToggleReadPage = () => {
    if (isReadingPage) {
      cancelSpeech();
      setIsReadingPage(false);
    } else {
      const text = getPageTextToRead(language);
      if (text.trim()) {
        setIsReadingPage(true);
        speakText(
          text,
          language,
          () => setIsReadingPage(false),
          () => {
            setIsReadingPage(false);
            if (language === "odia" || language === "assamese") {
              toast({
                title: "Speech Reading Unsupported",
                description: `Text-to-speech voice reading is not supported for ${language.toUpperCase()} in this browser. Please use a browser like Microsoft Edge which has native ${language.toUpperCase()} voices, or ensure the Sarvam API has active credits.`,
                variant: "destructive"
              });
            } else {
              toast({
                title: "Speech Reading Failed",
                description: "Failed to play audio reading for this page. Please try again or switch language.",
                variant: "destructive"
              });
            }
          }
        );
      }
    }
  };

  const handleExit = () => {
    localStorage.removeItem("janmitra-lang-selected");
    localStorage.removeItem("janmitra-preferences");
    window.location.href = "/";
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-[hsl(224,65%,13%)] px-4 justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10" />
            <div className="h-5 w-px bg-white/15" />
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#FF9933] flex items-center justify-center">
                <Landmark className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-sm text-white">{t("appName")}</span>
            </Link>
            <span className="text-white/30 text-xs hidden sm:block ml-1">— {t("subTitle")}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {(location === "/" || location === "/frauds") && (
              <button
                onClick={handleToggleReadPage}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all focus:outline-none ${
                  isReadingPage
                    ? "bg-[#FF9933] text-white border-[#FF9933] animate-pulse"
                    : "text-white/70 hover:text-white hover:bg-white/10 border-white/15"
                }`}
              >
                {isReadingPage ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isReadingPage ? t("nav.stopReading") : t("nav.readPage")}
              </button>
            )}
            <button 
              onClick={handleExit}
              className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all px-3 py-1.5 rounded-lg border border-white/15 focus:outline-none"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t("nav.back")}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
