import requests

def test_google_tts(lang_code, text):
    url = "https://translate.google.com/translate_tts"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    params = {
        "ie": "UTF-8",
        "tl": lang_code,
        "client": "tw-ob",
        "q": text
    }
    try:
        res = requests.get(url, headers=headers, params=params, timeout=10)
        print(f"Code: {lang_code} | Status: {res.status_code} | Content-Type: {res.headers.get('Content-Type')} | Length: {len(res.content)}")
    except Exception as e:
        print(f"Code {lang_code} failed: {e}")

print("Testing Odia:")
test_google_tts("or", "ନମସ୍କାର")
test_google_tts("or-IN", "ନମସ୍କାର")
test_google_tts("ory", "ନମସ୍କାର")

print("\nTesting Assamese:")
test_google_tts("as", "নমস্কাৰ")
test_google_tts("as-IN", "নমস্কাৰ")
test_google_tts("asm", "নমস্কাৰ")
