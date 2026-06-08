import requests
import json

GROQ_API_KEY = "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"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

english_overrides = {
  "subTitle": "Farmers & Rural Banking Assistant",
  "settings.userProfileDesc": "We use this to tailor farming, rural credit, and banking answers to your situation.",
  "nav.askBtn": "Ask JanMitra",
  "nav.frauds": "Common Frauds",
}

prompt = (
    "You are an expert translator. Translate the values of the following JSON object from English into native Hindi. "
    "Keep the JSON keys exactly the same. Do not translate or change the keys. Only translate the values. "
    "Ensure that any double quotes inside the translated text values are properly escaped (e.g. \\\" ) or replaced with single quotes so that the JSON remains perfectly valid. "
    "Return ONLY the valid JSON object.\n\n"
    f"JSON to translate:\n{json.dumps(english_overrides, ensure_ascii=False, indent=2)}"
)

headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

data = {
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": prompt}],
    "temperature": 0.1,
    "response_format": {"type": "json_object"}
}

res = requests.post(GROQ_URL, headers=headers, json=data)
print(f"Status: {res.status_code}")
print(f"Response: {res.text}")
