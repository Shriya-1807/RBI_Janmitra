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

// Backend TTS language codes
// Odia and Assamese are handled by AI4Bharat Indic Parler-TTS via the backend proxy.
// All others use Sarvam Bulbul.
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
  odia: "or-IN",
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

let _activeSpeechSessionId = 0;
const _activeAudios = new Set<HTMLAudioElement>();

export function cancelSpeech() {
  if (typeof window === "undefined") return;
  _activeSpeechSessionId++;
  stopKeepAlive();
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  
  // Clean up and stop all active Audio objects
  _activeAudios.forEach(audio => {
    try {
      audio.pause();
      audio.src = "";
    } catch (_) { }
  });
  _activeAudios.clear();

  if ((window as any)._activeAudio) {
    try {
      (window as any)._activeAudio.pause();
      (window as any)._activeAudio.src = "";
    } catch (_) { }
    (window as any)._activeAudio = null;
  }
}

export function pauseSpeech() {
  if (typeof window === "undefined") return;
  _activeAudios.forEach(audio => {
    try {
      audio.pause();
    } catch (_) { }
  });
  if (window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech() {
  if (typeof window === "undefined") return;
  _activeAudios.forEach(audio => {
    try {
      audio.play().catch(() => {});
    } catch (_) { }
  });
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

let _cachedVoices: SpeechSynthesisVoice[] = [];

// Load voices, waiting for them if needed
function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([]);
  }
  if (_cachedVoices.length > 0) {
    return Promise.resolve(_cachedVoices);
  }
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      _cachedVoices = voices;
      resolve(voices);
      return;
    }
    const onChanged = () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", onChanged);
      const v = window.speechSynthesis.getVoices();
      _cachedVoices = v;
      resolve(v);
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChanged);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", onChanged);
      const v = window.speechSynthesis.getVoices();
      _cachedVoices = v;
      resolve(v);
    }, 500);
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
  sessionId: number,
  onEnd?: () => void,
  onError?: (failedIndex: number) => void
) {
  let index = 0;

  const playNext = async () => {
    if (sessionId !== _activeSpeechSessionId || index >= chunks.length) {
      if (sessionId === _activeSpeechSessionId && onEnd) onEnd();
      return;
    }

    const chunk = chunks[index];
    const sarvamLang = SARVAM_LANG_CODES[lang] ?? "hi-IN";

    let url = "";
    let audio: HTMLAudioElement | null = null;
    let handled = false;

    const handleFailure = () => {
      if (handled) return;
      handled = true;

      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      }
      if (audio) {
        try {
          audio.onended = null;
          audio.onerror = null;
          audio.pause();
        } catch (_) {}
        _activeAudios.delete(audio);
      }
      if ((window as any)._activeAudio === audio) {
        (window as any)._activeAudio = null;
      }
      if (sessionId === _activeSpeechSessionId && onError) {
        onError(index);
      }
    };

    const handleSuccess = () => {
      if (handled) return;
      handled = true;

      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      }
      if (audio) {
        try {
          audio.onended = null;
          audio.onerror = null;
        } catch (_) {}
        _activeAudios.delete(audio);
      }
      if ((window as any)._activeAudio === audio) {
        (window as any)._activeAudio = null;
      }
      index++;
      playNext();
    };

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${baseUrl}/api/chat/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk, language: sarvamLang }),
      });

      if (sessionId !== _activeSpeechSessionId) return;

      if (!res.ok) {
        console.error(`Sarvam TTS error: ${res.status}`);
        handleFailure();
        return;
      }

      const blob = await res.blob();
      if (sessionId !== _activeSpeechSessionId) return;

      url = URL.createObjectURL(blob);
      audio = new Audio(url);
      _activeAudios.add(audio);
      (window as any)._activeAudio = audio;

      audio.onended = handleSuccess;
      audio.onerror = handleFailure;

      if (sessionId !== _activeSpeechSessionId) {
        handleFailure();
        return;
      }

      await audio.play();

      if (sessionId !== _activeSpeechSessionId) {
        handleFailure();
        return;
      }
    } catch (e) {
      console.error("Sarvam TTS fetch failed:", e);
      handleFailure();
    }
  };

  playNext();
}

// Play chunks via browser Web Speech API
function playWebSpeechChunks(
  chunks: string[],
  lang: string,
  voice: SpeechSynthesisVoice | null,
  sessionId: number,
  onEnd?: () => void
) {
  const targetLang = LANG_CODES[lang] ?? "en-IN";
  let index = 0;

  const speakNext = () => {
    if (sessionId !== _activeSpeechSessionId || index >= chunks.length) {
      stopKeepAlive();
      if (sessionId === _activeSpeechSessionId && onEnd) onEnd();
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

// Play chunks via Google Translate TTS (free, high quality, client-side, no key required)
function playGoogleTTSChunks(
  chunks: string[],
  lang: string,
  sessionId: number,
  onEnd?: () => void,
  onError?: () => void,
  startIndex = 0
) {
  let index = startIndex;

  const playNext = () => {
    if (sessionId !== _activeSpeechSessionId || index >= chunks.length) {
      if (sessionId === _activeSpeechSessionId && onEnd) onEnd();
      return;
    }

    const chunk = chunks[index];
    // Google Translate supports 2-letter codes or standard locales
    const rawCode = LANG_CODES[lang] ?? "en-IN";
    const langCode = rawCode.split("-")[0]; // e.g. "ta", "hi", "te"

    let audio: HTMLAudioElement | null = null;
    let handled = false;

    const handleNext = () => {
      if (handled) return;
      handled = true;

      if (audio) {
        try {
          audio.onended = null;
          audio.onerror = null;
        } catch (_) {}
        _activeAudios.delete(audio);
      }
      if ((window as any)._activeAudio === audio) {
        (window as any)._activeAudio = null;
      }
      index++;
      playNext();
    };

    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      audio = new Audio(url);

      if (sessionId !== _activeSpeechSessionId) return;

      _activeAudios.add(audio);
      (window as any)._activeAudio = audio;

      audio.onended = handleNext;
      audio.onerror = (e) => {
        console.warn("Google TTS chunk play failed, trying next", e);
        handleNext();
      };

      audio.play().then(() => {
        if (sessionId !== _activeSpeechSessionId) {
          if (audio) {
            try {
              audio.pause();
            } catch (_) {}
          }
          if (handled) return;
          handled = true;
          if (audio) {
            _activeAudios.delete(audio);
          }
          if ((window as any)._activeAudio === audio) {
            (window as any)._activeAudio = null;
          }
        }
      }).catch(err => {
        console.warn("Audio playback blocked or failed:", err);
        handleNext();
      });
    } catch (e) {
      console.error("Google TTS failed:", e);
      if (audio) {
        _activeAudios.delete(audio);
      }
      if (sessionId === _activeSpeechSessionId && onError) onError();
    }
  };

  playNext();
}

// Languages routed through the backend /api/chat/tts endpoint.
// Odia and Assamese use AI4Bharat Indic Parler-TTS (proxied via backend).
// All others use Sarvam Bulbul (also proxied via backend).
const SARVAM_SUPPORTED_LANGS = new Set([
  "hindi", "tamil", "telugu", "kannada", "malayalam", "bengali", "marathi", "gujarati", "punjabi",
  "odia", "assamese"
]);

export async function speakText(
  text: string,
  lang: string,
  onEnd?: () => void,
  onError?: () => void
) {
  if (typeof window === "undefined") return;
  cancelSpeech();

  _activeSpeechSessionId++;
  const mySessionId = _activeSpeechSessionId;

  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) { if (onEnd) onEnd(); return; }

  const chunks = splitIntoChunks(cleanedText);

  if (lang === "english") {
    try {
      const voice = await getBestVoice(lang);
      playWebSpeechChunks(chunks, lang, voice, mySessionId, onEnd);
    } catch (e) {
      console.error("Web Speech synthesis failed", e);
      playGoogleTTSChunks(chunks, lang, mySessionId, onEnd, onError);
    }
  } else if (SARVAM_SUPPORTED_LANGS.has(lang)) {
    // Try cloud-based Sarvam TTS (Bulbul model) first
    playSarvamChunks(
      chunks,
      lang,
      mySessionId,
      onEnd,
      async (failedIndex) => {
        console.warn(`Sarvam TTS failed at index ${failedIndex}, falling back to Web Speech or Google TTS`);
        try {
          const voice = await getBestVoice(lang);
          if (voice) {
            playWebSpeechChunks(chunks.slice(failedIndex), lang, voice, mySessionId, onEnd);
          } else {
            playGoogleTTSChunks(chunks, lang, mySessionId, onEnd, onError, failedIndex);
          }
        } catch (e) {
          console.error("Web Speech fallback failed, using Google Translate TTS", e);
          playGoogleTTSChunks(chunks, lang, mySessionId, onEnd, onError, failedIndex);
        }
      }
    );
  } else {
    // Urdu, etc. - try Web Speech first, then Google Translate TTS
    try {
      const voice = await getBestVoice(lang);
      if (voice) {
        playWebSpeechChunks(chunks, lang, voice, mySessionId, onEnd);
      } else {
        playGoogleTTSChunks(chunks, lang, mySessionId, onEnd, onError);
      }
    } catch (e) {
      console.error("Web Speech fallback failed for regional, using Google Translate TTS", e);
      playGoogleTTSChunks(chunks, lang, mySessionId, onEnd, onError);
    }
  }
}

// Pre-load voices on startup
if (typeof window !== "undefined" && window.speechSynthesis) {
  const loadVoices = () => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) {
      _cachedVoices = v;
    }
  };
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}
