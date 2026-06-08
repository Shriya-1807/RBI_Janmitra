import os
import json
import time
import sys
import requests

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass

SARVAM_API_KEY = "sk_85e3szaq_VpWuCMbfqNNq5LMTioHOx7G6"
SARVAM_TRANS_URL = "https://api.sarvam.ai/translate"

LANGUAGES = {
    "hindi": ("hi-IN", "hi"),
    "tamil": ("ta-IN", "ta"),
    "telugu": ("te-IN", "te"),
    "kannada": ("kn-IN", "kn"),
    "malayalam": ("ml-IN", "ml"),
    "bengali": ("bn-IN", "bn"),
    "marathi": ("mr-IN", "mr"),
    "gujarati": ("gu-IN", "gu"),
    "punjabi": ("pa-IN", "pa"),
    "odia": ("od-IN", "or"),  # Google Translate uses 'or' for Odia
    "urdu": ("ur-IN", "ur"),
    "assamese": ("as-IN", "as"),
}

english_overrides = {
  "appName": "JanMitra",
  "subTitle": "Farmers & MSME Owners Rural Banking Assistant",
  "settings.userProfileDesc": "We use this to tailor farming, MSME business, rural credit, and banking answers to your situation.",
  "nav.askBtn": "Ask JanMitra",
  "nav.frauds": "Common Frauds",
  "hero.sub": "Farmers & MSME Owners Chatbot",
  "hero.title": "Get Farming, MSME & Rural Banking Help in Your Language",
  "hero.desc": "JanMitra connects you to a Farmers & MSME Owners chatbot for crop loans, Kisan Credit Card queries, rural banking, subsidies, safe digital payments, and practical agriculture and business guidance.",
  "hero.chatBtn": "Ask the AI Assistant",
  "hero.exploreBtn": "Set Your Profile",
  "alerts.title": "Farmer & MSME Owner Help Topics",
  "alerts.alert1": "Ask about Kisan Credit Card eligibility, limits, repayment, and documentation.",
  "alerts.alert2": "Get plain-language guidance on safe rural banking, UPI, loan apps, and fraud prevention.",
  "alerts.alert3": "Use your language to ask crop-loan, MSME schemes, subsidy, insurance, and agri-credit questions.",
  "profiles.subtitle": "Tailored for Rural & Small Business India",
  "profiles.title": "Who Uses JanMitra?",
  "profiles.desc": "Farmers, MSME owners, students, and households can ask practical questions and receive simple answers tuned to their profile.",
  "profiles.farmer.sub": "Kisan Credit Card, Crop Loans",
  "profiles.farmer.desc": "Understand rural credit, loan paperwork, repayment, insurance, and support schemes in simple terms.",
  "profiles.student.desc": "Learn about student banking, savings accounts, education loans, and safe digital payments.",
  "profiles.msme.desc": "Get guidance on small-business credit, rural enterprises, working capital, and formal banking steps.",
  "profiles.salaried.desc": "Ask about everyday banking, savings, digital payments, and safe borrowing for your household.",
  "features.title": "Everything You Need",
  "features.subtitle": "Helpful Farmer & MSME Owner Tools",
  "features.chat.title": "Farmers & MSME Owners Chatbot",
  "features.chat.desc": "Ask agriculture finance, MSME credit and rural banking questions in plain English or your local language.",
  "features.langs.title": "13 Indian Languages",
  "features.langs.desc": "Switch between supported Indian languages for chat, voice, and core app text.",
  "features.voice.title": "Voice Input",
  "features.voice.desc": "Speak your question when typing is inconvenient. The assistant can reply with voice too.",
  "features.guidance.title": "Grounded Guidance",
  "features.guidance.desc": "Answers come from the connected Farmers & MSME Owners chatbot instead of the old policy dashboard.",
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
  "works.step2.desc": "Type or speak your farming, MSME business, or banking question in English or your regional language.",
  "works.step3.title": "Chatbot Finds Context",
  "works.step3.desc": "The backend sends your question to the Farmers & MSME Owners chatbot service for grounded retrieval.",
  "works.step4.title": "Get Clear Answer",
  "works.step4.desc": "Receive a simple explanation with practical next steps.",
  "works.btn": "Start Asking",
  "fraud.subtitle": "Stay Protected",
  "fraud.title": "Rural & Business Banking Safety",
  "cta.badge": "Powered by Farmers & MSME Owners Chatbot",
  "cta.title": "Ask Farming, MSME and Banking Questions Clearly",
  "cta.desc": "Use JanMitra to understand rural credit, KCC, MSME schemes, subsidies, crop loans, insurance, and safe digital banking in your preferred language.",
  "cta.btn1": "Start Chatting Now",
  "cta.btn2": "Open Chatbot",
  "footer.subtitle": "Helping Farmers & MSME Owners Access Financial Guidance",
  "footer.disclaimer": "Information assistant, not official financial advice",
  "footer.disclaimerText": "Answers come from the Farmers & MSME Owners chatbot service and may need verification with your bank or official sources.",
  "chatbot.introGreeting": "Hello! I am JanMitra, your Farmers & MSME Owners chatbot. I can help with Kisan Credit Card, crop loans, MSME business schemes, rural banking, subsidies, insurance, safe UPI use, and practical agriculture and business finance questions.",
  "chatbot.introInstructions": "Select your profile above so I can customize the answer. You can type or speak your question in English or your preferred regional language.",
  "chatbot.thinking": "JanMitra is checking the Farmers & MSME Owners chatbot knowledge base...",
  "chatbot.apiOffline": "Could not reach the API server. Make sure the backend is running on port 8080 and the Farmers & MSME Owners chatbot service is running on port 8000."
}

def safe_print(msg):
    try:
        print(msg)
        sys.stdout.flush()
    except Exception:
        try:
            enc = sys.stdout.encoding or 'utf-8'
            print(msg.encode(enc, errors='replace').decode(enc))
            sys.stdout.flush()
        except Exception:
            try:
                print(msg.encode('ascii', errors='replace').decode('ascii'))
                sys.stdout.flush()
            except Exception:
                pass

def translate_sarvam(text, target_code):
    needs_v1 = target_code in ["ur-IN", "as-IN"]
    payload = {
        "input": text,
        "source_language_code": "en-IN",
        "target_language_code": target_code,
        "speaker_gender": "Female",
        "mode": "formal",
        "model": "sarvam-translate:v1" if needs_v1 else "mayura:v1",
        "enable_preprocessing": True,
    }
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    res = requests.post(SARVAM_TRANS_URL, headers=headers, json=payload, timeout=10)
    if res.status_code == 200:
        return res.json()["translated_text"].strip()
    else:
        raise Exception(f"Sarvam HTTP {res.status_code}: {res.text}")

def translate_google(text, target_code):
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": "en",
        "tl": target_code,
        "dt": "t",
        "q": text
    }
    
    for attempt in range(5):
        try:
            res = requests.get(url, params=params, timeout=10)
            if res.status_code == 200:
                data = res.json()
                translated = "".join([part[0] for part in data[0] if part[0]])
                return translated.strip()
            else:
                safe_print(f"    [Google HTTP Error] Attempt {attempt+1}: Status {res.status_code}, retrying in 2s...")
                time.sleep(2)
        except Exception as e:
            safe_print(f"    [Google Request Exception] Attempt {attempt+1}: {e}, retrying in 2s...")
            time.sleep(2)
            
    raise Exception(f"Google Translate failed after 5 attempts.")

def main():
    output_path = "translated_overrides.json"
    
    if os.path.exists(output_path):
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                all_translations = json.load(f)
        except Exception as e:
            safe_print(f"Error reading {output_path}, starting fresh: {e}")
            all_translations = {"english": english_overrides}
    else:
        all_translations = {"english": english_overrides}
        
    all_translations["english"] = english_overrides

    sarvam_active = True

    for lang, (sarvam_code, google_code) in LANGUAGES.items():
        if lang not in all_translations:
            all_translations[lang] = {}
            
        lang_dict = all_translations[lang]
        
        # Verify if it's already translated
        is_done = True
        for key, val in english_overrides.items():
            if key not in lang_dict:
                is_done = False
                break
            if key != "appName" and lang_dict[key] == val:
                is_done = False
                break
                
        if is_done:
            safe_print(f"Skipping {lang}, already translated.")
            continue
            
        safe_print(f"Translating for {lang} (Sarvam: {sarvam_code} / Google: {google_code})...")
        
        for key, val in english_overrides.items():
            if key == "appName":
                lang_dict[key] = val
                continue
                
            # Skip if already translated correctly
            if key in lang_dict and lang_dict[key] is not None and lang_dict[key] != val:
                continue
                
            translated = None
            # 1. Try Sarvam
            if sarvam_active:
                try:
                    translated = translate_sarvam(val, sarvam_code)
                    safe_print(f"  [Sarvam] {key} -> {translated}")
                    time.sleep(0.05)
                except Exception as se:
                    safe_print(f"  [Sarvam Failed] {key} error: {str(se)}")
                    if "402" in str(se) or "insufficient_quota" in str(se) or "credits" in str(se):
                        safe_print("  [Sarvam Disabled] Insufficient quota / no credits. Disabling Sarvam for this session.")
                        sarvam_active = False
            
            if translated is None:
                # 2. Fallback to Google Translate
                try:
                    translated = translate_google(val, google_code)
                    safe_print(f"  [Google Fallback] {key} -> {translated}")
                    time.sleep(0.05)
                except Exception as ge:
                    safe_print(f"  [Google Failed] {key} error: {str(ge)}")
                    # 3. Fallback to English
                    translated = val
                    safe_print(f"  [English Fallback] {key} -> {translated}")
            
            lang_dict[key] = translated
            
            # Save progress key-by-key
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(all_translations, f, ensure_ascii=False, indent=2)
                
    safe_print("All translations completed successfully!")

if __name__ == "__main__":
    main()
