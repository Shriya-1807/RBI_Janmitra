import requests

SARVAM_API_KEY = "sk_yh1cdbkz_wjfRt5JQspmTKGjWmt182P77"
url = "https://api.sarvam.ai/text-to-speech"

payload = {
    "inputs": ["ନମସ୍କାର"],
    "target_language_code": "od-IN",
    "speaker": "neha",
    "pace": 1.0,
    "speech_sample_rate": 8000,
    "enable_preprocessing": True,
    "model": "bulbul:v3"
}

headers = {
    "api-subscription-key": SARVAM_API_KEY,
    "Content-Type": "application/json"
}

try:
    res = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text[:300]}")
except Exception as e:
    print(f"Request failed: {e}")
