import requests

SARVAM_API_KEY = "sk_yh1cdbkz_wjfRt5JQspmTKGjWmt182P77"
SARVAM_TRANS_URL = "https://api.sarvam.ai/translate"

def test_model(model_name):
    payload = {
        "input": "Hello",
        "source_language_code": "en-IN",
        "target_language_code": "hi-IN",
        "speaker_gender": "Female",
        "mode": "formal",
        "model": model_name,
        "enable_preprocessing": True,
    }
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    try:
        res = requests.post(SARVAM_TRANS_URL, headers=headers, json=payload, timeout=10)
        print(f"Model {model_name} Status: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Model {model_name} failed: {e}")

test_model("mayura:v1")
test_model("sarvam-translate:v1")
