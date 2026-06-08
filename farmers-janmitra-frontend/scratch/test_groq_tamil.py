import requests
import json

GROQ_API_KEY = "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"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

english_overrides = {
  "subTitle": "Farmers & Rural Banking Assistant",
  "settings.userProfileDesc": "We use this to tailor farming, rural credit, and banking answers to your situation.",
  "nav.askBtn": "Ask JanMitra",
  "nav.frauds": "Common Frauds",
  "hero.sub": "Farmers RAG Assistant",
  "hero.title": "Get Farming and Rural Banking Help in Your Language",
  "hero.desc": "JanMitra connects you to a Farmers RAG knowledge engine for crop loans, Kisan Credit Card queries, rural banking, subsidies, safe digital payments, and practical agriculture finance guidance.",
  "hero.chatBtn": "Ask the AI Assistant",
  "hero.exploreBtn": "Set Your Profile",
  "alerts.title": "Farmer Help Topics",
  "alerts.alert1": "Ask about Kisan Credit Card eligibility, limits, repayment, and documentation.",
  "alerts.alert2": "Get plain-language guidance on safe rural banking, UPI, loan apps, and fraud prevention.",
  "alerts.alert3": "Use your language to ask crop-loan, subsidy, insurance, and agri-credit questions.",
  "profiles.subtitle": "Tailored for Rural India",
  "profiles.title": "Who Uses JanMitra?",
  "profiles.desc": "Farmers, students, small business owners, and households can ask practical questions and receive simple answers tuned to their profile.",
  "profiles.farmer.sub": "Kisan Credit Card, Crop Loans",
  "profiles.farmer.desc": "Understand rural credit, loan paperwork, repayment, insurance, and support schemes in simple terms.",
  "profiles.student.desc": "Learn about student banking, savings accounts, education loans, and safe digital payments.",
  "profiles.msme.desc": "Get guidance on small-business credit, rural enterprises, working capital, and formal banking steps.",
  "profiles.salaried.desc": "Ask about everyday banking, savings, digital payments, and safe borrowing for your household.",
  "features.title": "Everything You Need",
  "features.subtitle": "Helpful Farmer Tools",
  "features.chat.title": "Farmers RAG Chatbot",
  "features.chat.desc": "Ask agriculture finance and rural banking questions in plain English or your local language."
}

prompt = (
    "You are a translation assistant. Translate the values of the following JSON object from English into native Tamil.\n"
    "RULES:\n"
    "1. Keep the JSON keys exactly the same. Do not translate, change, or modify the keys.\n"
    "2. Only translate the values.\n"
    "3. You must return every single key present in the input JSON. Do not omit any keys.\n"
    "4. Escaped double quotes inside translated string values should use \\\" or single quotes so that the JSON structure is preserved.\n"
    "5. Return ONLY the valid JSON object, with no explanations and no formatting tags.\n\n"
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
    "max_tokens": 2048,
    "response_format": {"type": "json_object"}
}

res = requests.post(GROQ_URL, headers=headers, json=data)
print(f"Status: {res.status_code}")
print(f"Response: {res.text}")
