import os
import json
import time
import requests

GROQ_API_KEY = "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"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

LANGUAGES = {
    "hindi": "Hindi",
    "tamil": "Tamil",
    "telugu": "Telugu",
    "kannada": "Kannada",
    "malayalam": "Malayalam",
    "bengali": "Bengali",
    "marathi": "Marathi",
    "gujarati": "Gujarati",
    "punjabi": "Punjabi",
    "odia": "Odia",
    "urdu": "Urdu",
    "assamese": "Assamese",
}

english_overrides = {
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
}

def translate_text(text, target_lang):
    if text == "JanMitra":
        return "JanMitra"
    
    prompt = f"Translate the following English text into native {target_lang}. Return ONLY the direct translation, with no explanation, no quotation marks, no greetings, and no intro. Maintain the tone and formatting:\n\n{text}"
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1
    }
    
    for attempt in range(3):
        try:
            res = requests.post(GROQ_URL, headers=headers, json=data, timeout=15)
            if res.status_code == 200:
                result = res.json()
                translated = result["choices"][0]["message"]["content"].strip()
                # Remove starting and ending quotes if LLM added them
                if translated.startswith('"') and translated.endswith('"'):
                    translated = translated[1:-1].strip()
                elif translated.startswith("'") and translated.endswith("'"):
                    translated = translated[1:-1].strip()
                return translated
            else:
                print(f"      Attempt {attempt+1} failed with status {res.status_code}: {res.text}")
        except Exception as e:
            print(f"      Attempt {attempt+1} failed with error: {str(e)}")
        time.sleep(2)
        
    return text

def main():
    output_path = "translated_overrides.json"
    if os.path.exists(output_path):
        with open(output_path, "r", encoding="utf-8") as f:
            all_translations = json.load(f)
    else:
        all_translations = {"english": english_overrides}
        
    for lang, name in LANGUAGES.items():
        if lang in all_translations and len(all_translations[lang]) == len(english_overrides):
            print(f"Skipping {lang}, already translated.")
            continue
            
        print(f"Translating for {lang} ({name})...")
        lang_overrides = {}
        for key, val in english_overrides.items():
            translated = translate_text(val, name)
            lang_overrides[key] = translated
            print(f"  {key} -> {translated}")
            time.sleep(0.5)
            
        all_translations[lang] = lang_overrides
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_translations, f, ensure_ascii=False, indent=2)
            
    print("Translation finished completely!")

if __name__ == "__main__":
    main()
