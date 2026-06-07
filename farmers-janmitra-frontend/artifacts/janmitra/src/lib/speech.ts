export const LANG_CODES: Record<string, string> = {
  english: "en-IN",
  hindi: "hi-IN",
  tamil: "ta-IN",
  telugu: "te-IN",
  kannada: "kn-IN",
  malayalam: "ml-IN",
  bengali: "bn-IN",
  marathi: "mr-IN",
  gujarati: "gu-IN",
  punjabi: "pa-IN",
  odia: "or-IN",
  urdu: "ur-IN",
  assamese: "as-IN",
};

export const LANG_LABELS: Record<string, string> = {
  english: "English",
  hindi: "हिन्दी",
  tamil: "தமிழ்",
  telugu: "తెలుగు",
  kannada: "ಕನ್ನಡ",
  malayalam: "മലയാളം",
  bengali: "বাংলা",
  marathi: "मराठी",
  gujarati: "ગુજરાતી",
  punjabi: "ਪੰਜਾਬੀ",
  odia: "ଓଡ଼ିଆ",
  urdu: "اردو",
  assamese: "অসমীয়া",
};

// Sarvam language codes for TTS API
const SARVAM_LANG_CODES: Record<string, string> = {
  hindi: "hi-IN",
  tamil: "ta-IN",
  telugu: "te-IN",
  kannada: "kn-IN",
  malayalam: "ml-IN",
  bengali: "bn-IN",
  marathi: "mr-IN",
  gujarati: "gu-IN",
  punjabi: "pa-IN",
  odia: "od-IN",
  urdu: "ur-IN",
  assamese: "as-IN",
  english: "en-IN",
};

export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\#\*\_`~\-]/g, " ")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Chrome bug: speechSynthesis silently pauses after ~15s — keep it alive
let _keepAliveInterval: ReturnType<typeof setInterval> | null = null;

function startKeepAlive() {
  stopKeepAlive();
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  _keepAliveInterval = setInterval(() => {
    if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, 10000);
}

function stopKeepAlive() {
  if (_keepAliveInterval !== null) {
    clearInterval(_keepAliveInterval);
    _keepAliveInterval = null;
  }
}

export function cancelSpeech() {
  if (typeof window === "undefined") return;
  stopKeepAlive();
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if ((window as any)._activeAudio) {
    try {
      (window as any)._activeAudio.pause();
      (window as any)._activeAudio.src = "";
    } catch (_) { }
    (window as any)._activeAudio = null;
  }
  (window as any)._speechCancelled = true;
}

export function pauseSpeech() {
  if (typeof window === "undefined") return;
  if ((window as any)._activeAudio) {
    (window as any)._activeAudio.pause();
  } else if (window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech() {
  if (typeof window === "undefined") return;
  if ((window as any)._activeAudio) {
    (window as any)._activeAudio.play();
  } else if (window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

// Load voices, waiting for them if needed
function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    const onChanged = () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", onChanged);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChanged);
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 2500);
  });
}

// Find best matching voice for a language
async function getBestVoice(lang: string): Promise<SpeechSynthesisVoice | null> {
  const targetLang = LANG_CODES[lang] ?? "en-IN";
  const prefix = targetLang.slice(0, 2).toLowerCase();
  const voices = await getVoicesAsync();
  return (
    voices.find(v => v.lang.toLowerCase().replace("_", "-") === targetLang.toLowerCase()) ||
    voices.find(v => v.lang.toLowerCase().startsWith(prefix)) ||
    voices.find(v => v.name.toLowerCase().includes(lang.toLowerCase())) ||
    null
  );
}

function splitIntoChunks(text: string, maxLen = 200): string[] {
  const sentences = text.match(/[^.!?\n।]+[.!?\n।]*|.+/g) || [text];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length <= maxLen) {
      current += (current ? " " : "") + s;
    } else {
      if (current) chunks.push(current);
      if (s.length <= maxLen) {
        current = s;
      } else {
        const words = s.split(/\s+/);
        current = "";
        for (const w of words) {
          if ((current + " " + w).length <= maxLen) {
            current += (current ? " " : "") + w;
          } else {
            if (current) chunks.push(current);
            current = w;
          }
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// Play audio chunks via Sarvam AI backend proxy
function playSarvamChunks(
  chunks: string[],
  lang: string,
  onEnd?: () => void,
  onError?: () => void
) {
  (window as any)._speechCancelled = false;
  let index = 0;

  const playNext = async () => {
    if ((window as any)._speechCancelled || index >= chunks.length) {
      if (!(window as any)._speechCancelled && onEnd) onEnd();
      return;
    }

    const chunk = chunks[index];
    const sarvamLang = SARVAM_LANG_CODES[lang] ?? "hi-IN";

    try {
      const res = await fetch("/api/chat/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk, language: sarvamLang }),
      });

      if ((window as any)._speechCancelled) return;

      if (!res.ok) {
        console.error(`Sarvam TTS error: ${res.status}`);
        index++;
        playNext();
        return;
      }

      const blob = await res.blob();
      if ((window as any)._speechCancelled) return;

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      (window as any)._activeAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        (window as any)._activeAudio = null;
        index++;
        playNext();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        (window as any)._activeAudio = null;
        index++;
        playNext();
      };

      await audio.play();
    } catch (e) {
      console.error("Sarvam TTS fetch failed:", e);
      if (onError) onError();
    }
  };

  playNext();
}

// Play chunks via browser Web Speech API
function playWebSpeechChunks(
  chunks: string[],
  lang: string,
  voice: SpeechSynthesisVoice | null,
  onEnd?: () => void
) {
  const targetLang = LANG_CODES[lang] ?? "en-IN";
  (window as any)._speechCancelled = false;
  let index = 0;

  const speakNext = () => {
    if ((window as any)._speechCancelled || index >= chunks.length) {
      stopKeepAlive();
      if (!(window as any)._speechCancelled && onEnd) onEnd();
      return;
    }

    const utt = new SpeechSynthesisUtterance(chunks[index]);
    utt.lang = targetLang;
    utt.rate = 0.9;
    utt.pitch = 1;
    utt.volume = 1;
    if (voice) utt.voice = voice;

    utt.onend = () => { index++; speakNext(); };
    utt.onerror = (e) => {
      const err = (e as any).error;
      if (err === "interrupted" || err === "canceled") {
        stopKeepAlive();
        return;
      }
      console.warn("Web speech error:", err);
      index++;
      speakNext();
    };

    window.speechSynthesis.speak(utt);
  };

  startKeepAlive();
  speakNext();
}

export async function speakText(
  text: string,
  lang: string,
  onEnd?: () => void,
  onError?: () => void
) {
  if (typeof window === "undefined") return;
  cancelSpeech();

  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) { if (onEnd) onEnd(); return; }

  const chunks = splitIntoChunks(cleanedText);
  playSarvamChunks(chunks, lang, onEnd, onError);
}

// Pre-load voices on startup
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
}
