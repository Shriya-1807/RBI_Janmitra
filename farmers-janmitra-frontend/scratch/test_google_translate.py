import requests

GOOGLE_CODES = {
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

def translate_google(text, target_code):
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": "en",
        "tl": target_code,
        "dt": "t",
        "q": text
    }
    res = requests.get(url, params=params, timeout=10)
    if res.status_code == 200:
        data = res.json()
        translated = "".join([part[0] for part in data[0] if part[0]])
        return translated.strip()
    else:
        raise Exception(f"Google Translate HTTP {res.status_code}: {res.text}")

print("Testing Google Translate:")
print("Hindi:", translate_google("Hello, how are you?", "hi"))
print("Tamil:", translate_google("Hello, how are you?", "ta"))
print("Odia:", translate_google("Hello, how are you?", "or"))
print("Assamese:", translate_google("Hello, how are you?", "as"))
