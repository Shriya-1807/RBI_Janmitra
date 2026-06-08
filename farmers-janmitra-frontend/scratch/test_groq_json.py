import requests
import json

GROQ_API_KEY = "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"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

data = {
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "Return a JSON object with a key 'hello' and value 'world'."}],
    "temperature": 0.1,
    "response_format": {"type": "json_object"}
}

res = requests.post(GROQ_URL, headers=headers, json=data)
print(f"Status: {res.status_code}")
print(f"Response: {res.text}")
