const SARVAM_API_KEY = process.env.SARVAM_API_KEY || "sk_se8o8sxe_gl83yTsDbjQLw66ZSuOYvVml";
const SARVAM_TRANS_URL = "https://api.sarvam.ai/translate";

const SARVAM_CODES: Record<string, string> = {
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
  odia: "od-IN",
  urdu: "ur-IN",
  assamese: "as-IN",
};

const NLLB_CODES: Record<string, string> = {
  english:   "eng_Latn",
  hindi:     "hin_Deva",
  tamil:     "tam_Taml",
  bengali:   "ben_Beng",
  marathi:   "mar_Deva",
  telugu:    "tel_Telu",
  gujarati:  "guj_Gujr",
  kannada:   "kan_Knda",
  malayalam: "mal_Mlym",
  punjabi:   "pan_Guru",
  odia:      "ory_Orya",
  urdu:      "urd_Arab",
  assamese:  "asm_Beng",
};

const HF_API = "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M";

async function callSarvamTranslate(text: string, srcLang: string, tgtLang: string): Promise<string> {
  const needsSarvamTranslateV1 = 
    srcLang === "ur-IN" || tgtLang === "ur-IN" || 
    srcLang === "as-IN" || tgtLang === "as-IN";

  const payload = {
    input: text,
    source_language_code: srcLang,
    target_language_code: tgtLang,
    speaker_gender: "Female",
    mode: "formal",
    model: needsSarvamTranslateV1 ? "sarvam-translate:v1" : "mayura:v1",
    enable_preprocessing: true,
  };

  const res = await fetch(SARVAM_TRANS_URL, {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Sarvam Translation error ${res.status}`);
  const data = await res.json() as { translated_text: string };
  return data.translated_text || text;
}

async function callNLLB(text: string, srcLang: string, tgtLang: string): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;

  const res = await fetch(HF_API, {
    method: "POST",
    headers,
    body: JSON.stringify({
      inputs: text,
      parameters: { src_lang: srcLang, tgt_lang: tgtLang },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HF API error ${res.status}`);
  const data = await res.json() as Array<{ translation_text: string }>;
  if (!Array.isArray(data) || !data[0]?.translation_text) throw new Error("Unexpected HF response");
  return data[0].translation_text;
}

async function translateToEnglishHelper(text: string, fromLang: string): Promise<string> {
  if (fromLang === "english") return text;
  
  const sarvamSrc = SARVAM_CODES[fromLang];
  if (sarvamSrc) {
    try {
      return await callSarvamTranslate(text, sarvamSrc, "en-IN");
    } catch (e) {
      console.error("Sarvam translation to English failed, falling back to NLLB:", e);
    }
  }

  const src = NLLB_CODES[fromLang];
  if (!src) return text;
  try {
    return await callNLLB(text, src, "eng_Latn");
  } catch {
    return text;
  }
}

export async function translateToEnglish(text: string, fromLang: string): Promise<string> {
  if (text.length <= 800) {
    return translateToEnglishHelper(text, fromLang);
  }

  const lines = text.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of lines) {
    if ((currentChunk + "\n" + line).length > 800) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = line;
    } else {
      if (currentChunk) {
        currentChunk += "\n" + line;
      } else {
        currentChunk = line;
      }
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  const translatedChunks: string[] = [];
  for (const chunk of chunks) {
    try {
      const translated = await translateToEnglishHelper(chunk, fromLang);
      translatedChunks.push(translated);
    } catch (err) {
      console.error("Failed to translate chunk to English:", err);
      translatedChunks.push(chunk);
    }
  }
  return translatedChunks.join("\n");
}

async function translateFromEnglishHelper(text: string, toLang: string): Promise<string> {
  if (toLang === "english") return text;

  const sarvamTgt = SARVAM_CODES[toLang];
  if (sarvamTgt) {
    try {
      return await callSarvamTranslate(text, "en-IN", sarvamTgt);
    } catch (e) {
      console.error("Sarvam translation from English failed, falling back to NLLB:", e);
    }
  }

  const tgt = NLLB_CODES[toLang];
  if (!tgt) return text;
  try {
    return await callNLLB(text, "eng_Latn", tgt);
  } catch {
    return text;
  }
}

export async function translateFromEnglish(text: string, toLang: string): Promise<string> {
  if (text.length <= 800) {
    return translateFromEnglishHelper(text, toLang);
  }

  const lines = text.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of lines) {
    if ((currentChunk + "\n" + line).length > 800) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = line;
    } else {
      if (currentChunk) {
        currentChunk += "\n" + line;
      } else {
        currentChunk = line;
      }
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  const translatedChunks: string[] = [];
  for (const chunk of chunks) {
    try {
      const translated = await translateFromEnglishHelper(chunk, toLang);
      translatedChunks.push(translated);
    } catch (err) {
      console.error("Failed to translate chunk from English:", err);
      translatedChunks.push(chunk);
    }
  }
  return translatedChunks.join("\n");
}
