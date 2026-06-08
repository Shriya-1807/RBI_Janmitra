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
    "hero.sub": "Farmers Chatbot",
    "chatbot.introGreeting": "Hello! I am JanMitra, your Farmers chatbot. I can help with Kisan Credit Card, crop loans, rural banking, subsidies, insurance, safe UPI use, and practical agriculture finance questions."
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

    # Update English
    for k, v in new_english_vals.items():
        overrides["english"][k] = v

    # Translate other languages
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

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(overrides, f, ensure_ascii=False, indent=2)

    print("translated_overrides.json updated successfully!")

    # Now run apply_translations.py
    import apply_translations
    apply_translations.main()

if __name__ == "__main__":
    main()
