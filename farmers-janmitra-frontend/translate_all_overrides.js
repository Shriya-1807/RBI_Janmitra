const fs = require('fs');
const path = require('path');

const SARVAM_API_KEY = "sk_85e3szaq_VpWuCMbfqNNq5LMTioHOx7G6";
const SARVAM_TRANS_URL = "https://api.sarvam.ai/translate";

const SARVAM_CODES = {
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

const englishOverrides = {
  "appName": "JanMitra",
  "subTitle": "Farmers & Rural Banking Assistant",
  "settings.userProfileDesc": "We use this to tailor farming, rural credit, and banking answers to your situation.",
  "nav.askBtn": "Ask JanMitra",
  "nav.frauds": "Common Frauds",
  "hero.sub": "Farmers RAG Assistant",
  "hero.title": "Get Farming and Rural Banking Help in Your Language",
  "hero.desc": "JanMitra connects you to a Farmers RAG knowledge engine for crop loans, Kisan Credit Card queries, rural banking, subsidies, safe digital payments, and practical agriculture finance guidance.",
  "hero.chatBtn": "Ask the AI Assistant",
  "hero.exploreBtn": "Set Your Profile",
  "alerts.title": "Farmer Help Topics",
  "alerts.alert1": "Ask about Kisan Credit Card eligibility, limits, repayment, and documentation.",
  "alerts.alert2": "Get plain-language guidance on safe rural banking, UPI, loan apps, and fraud prevention.",
  "alerts.alert3": "Use your language to ask crop-loan, subsidy, insurance, and agri-credit questions.",
  "profiles.subtitle": "Tailored for Rural India",
  "profiles.title": "Who Uses JanMitra?",
  "profiles.desc": "Farmers, students, small business owners, and households can ask practical questions and receive simple answers tuned to their profile.",
  "profiles.farmer.sub": "Kisan Credit Card, Crop Loans",
  "profiles.farmer.desc": "Understand rural credit, loan paperwork, repayment, insurance, and support schemes in simple terms.",
  "profiles.student.desc": "Learn about student banking, savings accounts, education loans, and safe digital payments.",
  "profiles.msme.desc": "Get guidance on small-business credit, rural enterprises, working capital, and formal banking steps.",
  "profiles.salaried.desc": "Ask about everyday banking, savings, digital payments, and safe borrowing for your household.",
  "features.title": "Everything You Need",
  "features.subtitle": "Helpful Farmer Tools",
  "features.chat.title": "Farmers RAG Chatbot",
  "features.chat.desc": "Ask agriculture finance and rural banking questions in plain English or your local language.",
  "features.langs.title": "13 Indian Languages",
  "features.langs.desc": "Switch between supported Indian languages for chat, voice, and core app text.",
  "features.voice.title": "Voice Input",
  "features.voice.desc": "Speak your question when typing is inconvenient. The assistant can reply with voice too.",
  "features.guidance.title": "Grounded Guidance",
  "features.guidance.desc": "Answers come from the connected Farmers RAG service instead of the old policy dashboard.",
  "features.impact.title": "Personalized Answers",
  "features.impact.desc": "Choose your profile so JanMitra can explain the answer in a way that fits your context.",
  "features.fraud.title": "Fraud Awareness",
  "features.fraud.desc": "Get practical safety reminders for OTPs, UPI, loan apps, and suspicious calls.",
  "works.subtitle": "Simple Process",
  "works.title": "How JanMitra Works",
  "works.desc": "From question to clear answer in seconds, with no dashboard or statistics screen required.",
  "works.step1.title": "Set Your Profile",
  "works.step1.desc": "Tell us if you are a farmer, student, MSME owner, salaried worker, or general user.",
  "works.step2.title": "Ask Your Question",
  "works.step2.desc": "Type or speak your farming or banking question in English or your regional language.",
  "works.step3.title": "RAG Finds Context",
  "works.step3.desc": "The backend sends your question to the Farmers RAG service for grounded retrieval.",
  "works.step4.title": "Get Clear Answer",
  "works.step4.desc": "Receive a simple explanation with practical next steps.",
  "works.btn": "Start Asking",
  "fraud.subtitle": "Stay Protected",
  "fraud.title": "Rural Banking Safety",
  "cta.badge": "Powered by Farmers RAG",
  "cta.title": "Ask Farming and Banking Questions Clearly",
  "cta.desc": "Use JanMitra to understand rural credit, KCC, subsidies, crop loans, insurance, and safe digital banking in your preferred language.",
  "cta.btn1": "Start Chatting Now",
  "cta.btn2": "Open Chatbot",
  "footer.subtitle": "Helping Farmers Access Financial Guidance",
  "footer.disclaimer": "Information assistant, not official financial advice",
  "footer.disclaimerText": "Answers come from the Farmers RAG service and may need verification with your bank or official sources.",
  "chatbot.introGreeting": "Hello! I am JanMitra, your Farmers RAG assistant. I can help with Kisan Credit Card, crop loans, rural banking, subsidies, insurance, safe UPI use, and practical agriculture finance questions.",
  "chatbot.introInstructions": "Select your profile above so I can customize the answer. You can type or speak your question in English or your preferred regional language.",
  "chatbot.thinking": "JanMitra is checking the Farmers RAG knowledge base...",
  "chatbot.apiOffline": "Could not reach the API server. Make sure the backend is running on port 8080 and the Farmers RAG service is running on port 8000."
};

async function translateText(text, targetLang) {
  const needsSarvamTranslateV1 = targetLang === "ur-IN" || targetLang === "as-IN";
  const payload = {
    input: text,
    source_language_code: "en-IN",
    target_language_code: targetLang,
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
  });

  if (!res.ok) {
    throw new Error(`Status ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.translated_text;
}

async function run() {
  const allTranslations = {
    english: englishOverrides
  };

  for (const [lang, code] of Object.entries(SARVAM_CODES)) {
    console.log(`Translating for ${lang} (${code})...`);
    const langOverrides = {};
    for (const [key, val] of Object.entries(englishOverrides)) {
      // Don't translate names or key items like appName / askBtn where name "JanMitra" should remain
      if (key === "appName") {
        langOverrides[key] = val;
        continue;
      }
      
      try {
        let transVal = await translateText(val, code);
        // Clean up double quotes and newlines
        transVal = transVal.trim();
        langOverrides[key] = transVal;
        console.log(`  ${key} -> ${transVal}`);
        // Small delay to avoid hammering the API
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        console.error(`  Error translating ${key} for ${lang}:`, err.message);
        // Fallback to English value
        langOverrides[key] = val;
      }
    }
    allTranslations[lang] = langOverrides;
    
    // Save checkpoint
    fs.writeFileSync(path.join(__dirname, 'translated_overrides.json'), JSON.stringify(allTranslations, null, 2), 'utf8');
  }

  console.log("Translation process completed!");
}

run();
