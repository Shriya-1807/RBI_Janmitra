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

LANGUAGES = {
    "hindi": "hi",
    "tamil": "ta",
    "telugu": "te",
    "kannada": "kn",
    "malayalam": "ml",
    "bengali": "bn",
    "marathi": "mr",
    "gujarati": "gu",
    "punjabi": "pa",
    "odia": "or",
    "urdu": "ur",
    "assamese": "as",
}

new_english_vals = {
    "subTitle": "Farmers & MSME Owners Rural Banking Assistant",
    "hero.sub": "Farmers & MSME Owners Chatbot",
    "hero.desc": "JanMitra connects you to a Farmers & MSME Owners RAG knowledge engine for crop loans, Kisan Credit Card queries, rural banking, subsidies, safe digital payments, and practical agriculture and business guidance.",
    "alerts.title": "Farmer & MSME Owner Help Topics",
    "features.subtitle": "Helpful Farmer & MSME Owner Tools",
    "features.chat.title": "Farmers & MSME Owners Chatbot",
    "features.guidance.desc": "Answers come from the connected Farmers & MSME Owners RAG service instead of the old policy dashboard.",
    "works.step3.desc": "The backend sends your question to the Farmers & MSME Owners RAG service for grounded retrieval.",
    "cta.badge": "Powered by Farmers & MSME Owners RAG",
    "footer.subtitle": "Helping Farmers & MSME Owners Access Financial Guidance",
    "footer.disclaimerText": "Answers come from the Farmers & MSME Owners RAG service and may need verification with your bank or official sources.",
    "chatbot.introGreeting": "Hello! I am JanMitra, your Farmers & MSME Owners chatbot. I can help with Kisan Credit Card, crop loans, MSME business schemes, rural banking, subsidies, insurance, safe UPI use, and practical agriculture and business finance questions.",
    "chatbot.thinking": "JanMitra is checking the Farmers & MSME Owners RAG knowledge base...",
    "chatbot.apiOffline": "Could not reach the API server. Make sure the backend is running on port 8080 and the Farmers & MSME Owners RAG service is running on port 8000."
}

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
                time.sleep(2)
        except Exception:
            time.sleep(2)
    raise Exception(f"Google Translate failed for target {target_code}")

def main():
    json_path = "../translated_overrides.json"
    if not os.path.exists(json_path):
        print("Error: translated_overrides.json not found")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        overrides = json.load(f)

    # 1. Update English
    for k, v in new_english_vals.items():
        overrides["english"][k] = v

    # 2. Translate other languages
    for lang, google_code in LANGUAGES.items():
        if lang not in overrides:
            overrides[lang] = {}

        print(f"Translating for {lang}...")
        for k, v in new_english_vals.items():
            try:
                translated = translate_google(v, google_code)
                overrides[lang][k] = translated
                print(f"  {k} -> {translated}")
                time.sleep(0.1)
            except Exception as e:
                print(f"  Failed for {k}: {e}")
                overrides[lang][k] = v

    # 3. Save JSON
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(overrides, f, ensure_ascii=False, indent=2)

    print("translated_overrides.json updated successfully!")

    # 4. Run apply_translations.py
    import apply_translations
    apply_translations.main()
    
    # 5. Update translate_sarvam_with_groq_fallback.py
    py_path = "../translate_sarvam_with_groq_fallback.py"
    if os.path.exists(py_path):
        with open(py_path, "r", encoding="utf-8") as f:
            py_content = f.read()
            
        for k, v in new_english_vals.items():
            # Find the line like "k": "something",
            # We can use simple replacement if we find target patterns
            pass

if __name__ == "__main__":
    main()
