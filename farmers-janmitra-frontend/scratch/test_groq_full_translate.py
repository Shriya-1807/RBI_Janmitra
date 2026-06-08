import requests
import json
import time

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
  "features.chat.desc": "Ask agriculture finance and rural banking questions in plain English or your local language.",
  "features.langs.title": "13 Indian Languages",
  "features.langs.desc": "Switch between supported Indian languages for chat, voice, and core app text.",
  "features.voice.title": "Voice Input",
  "features.voice.desc": "Speak your question when typing is inconvenient. The assistant can reply with voice too.",
  "features.guidance.title": "Grounded Guidance",
  "features.guidance.desc": "Answers come from the connected Farmers RAG service instead of the old policy dashboard.",
  "features.impact.title": "Personalized Answers",
  "features.impact.desc": "Choose your profile so JanMitra can explain the answer in a way that fits your context.",
  "features.fraud.title": "Fraud Awareness",
  "features.fraud.desc": "Get practical safety reminders for OTPs, UPI, loan apps, and suspicious calls.",
  "works.subtitle": "Simple Process",
  "works.title": "How JanMitra Works",
  "works.desc": "From question to clear answer in seconds, with no dashboard or statistics screen required.",
  "works.step1.title": "Set Your Profile",
  "works.step1.desc": "Tell us if you are a farmer, student, MSME owner, salaried worker, or general user.",
  "works.step2.title": "Ask Your Question",
  "works.step2.desc": "Type or speak your farming or banking question in English or your regional language.",
  "works.step3.title": "RAG Finds Context",
  "works.step3.desc": "The backend sends your question to the Farmers RAG service for grounded retrieval.",
  "works.step4.title": "Get Clear Answer",
  "works.step4.desc": "Receive a simple explanation with practical next steps.",
  "works.btn": "Start Asking",
  "fraud.subtitle": "Stay Protected",
  "fraud.title": "Rural Banking Safety",
  "cta.badge": "Powered by Farmers RAG",
  "cta.title": "Ask Farming and Banking Questions Clearly",
  "cta.desc": "Use JanMitra to understand rural credit, KCC, subsidies, crop loans, insurance, and safe digital banking in your preferred language.",
  "cta.btn1": "Start Chatting Now",
  "cta.btn2": "Open Chatbot",
  "footer.subtitle": "Helping Farmers Access Financial Guidance",
  "footer.disclaimer": "Information assistant, not official financial advice",
  "footer.disclaimerText": "Answers come from the Farmers RAG service and may need verification with your bank or official sources.",
  "chatbot.introGreeting": "Hello! I am JanMitra, your Farmers RAG assistant. I can help with Kisan Credit Card, crop loans, rural banking, subsidies, insurance, safe UPI use, and practical agriculture finance questions.",
  "chatbot.introInstructions": "Select your profile above so I can customize the answer. You can type or speak your question in English or your preferred regional language.",
  "chatbot.thinking": "JanMitra is checking the Farmers RAG knowledge base...",
  "chatbot.apiOffline": "Could not reach the API server. Make sure the backend is running on port 8080 and the Farmers RAG service is running on port 8000."
}

def translate_half(half_dict, name):
    prompt = (
        f"You are an expert translator. Translate the values of the following JSON object from English into native {name}. "
        "Keep the JSON keys exactly the same. Do not translate or change the keys. Only translate the values. "
        "Ensure that any double quotes inside the translated text values are properly escaped (e.g. \\\" ) or replaced with single quotes so that the JSON remains perfectly valid. "
        "Return ONLY the valid JSON object.\n\n"
        f"JSON to translate:\n{json.dumps(half_dict, ensure_ascii=False, indent=2)}"
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
    
    for attempt in range(5):
        res = requests.post(GROQ_URL, headers=headers, json=data)
        if res.status_code == 200:
            return json.loads(res.json()["choices"][0]["message"]["content"])
        elif res.status_code == 429:
            print(f"Got 429, sleeping 15 seconds (attempt {attempt+1})...")
            time.sleep(15)
        else:
            print(f"Error {res.status_code}: {res.text}")
            time.sleep(3)
    raise Exception("Failed to translate")

# Split overrides
items = list(english_overrides.items())
mid = len(items) // 2
batch1 = dict(items[:mid])
batch2 = dict(items[mid:])

print("Translating Batch 1...")
res1 = translate_half(batch1, "Hindi")
print("Translating Batch 2...")
res2 = translate_half(batch2, "Hindi")

combined = {**res1, **res2}
print(f"Combined translation contains {len(combined)} keys.")
print("Sample translation:")
print(f"nav.frauds -> {combined.get('nav.frauds')}")
print(f"cta.title -> {combined.get('cta.title')}")
