import requests

def test_google_tts(client, lang, text):
    url = "https://translate.google.com/translate_tts"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    params = {
        "ie": "UTF-8",
        "tl": lang,
        "client": client,
        "q": text
    }
    try:
        res = requests.get(url, headers=headers, params=params, timeout=10)
        print(f"Client: {client} | Lang: {lang} | Status: {res.status_code} | Length: {len(res.content)}")
    except Exception as e:
        print(f"Failed: {e}")

clients = ["tw-ob", "gtx", "t", "webapp", "dict-chrome-ex", "p"]
for client in clients:
    test_google_tts(client, "or", "ନମସ୍କାର")
    test_google_tts(client, "as", "নমস্কাৰ")
