import json
import os

def main():
    json_path = "../translated_overrides.json"
    if not os.path.exists(json_path):
        json_path = "translated_overrides.json"
        
    if not os.path.exists(json_path):
        print("Error: translated_overrides.json not found")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    changed_keys = [
        "subTitle",
        "settings.userProfileDesc",
        "hero.sub",
        "hero.title",
        "hero.desc",
        "alerts.title",
        "alerts.alert3",
        "profiles.subtitle",
        "profiles.desc",
        "features.subtitle",
        "features.chat.title",
        "features.chat.desc",
        "features.guidance.desc",
        "works.step2.desc",
        "works.step3.title",
        "works.step3.desc",
        "fraud.title",
        "cta.badge",
        "cta.title",
        "cta.desc",
        "footer.subtitle",
        "footer.disclaimerText",
        "chatbot.introGreeting",
        "chatbot.thinking",
        "chatbot.apiOffline"
    ]

    count = 0
    for lang, keys in data.items():
        if lang == "english":
            continue
        for key in changed_keys:
            if key in keys:
                del keys[key]
                count += 1

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Removed {count} entries from non-English languages in translated_overrides.json to force re-translation.")

if __name__ == "__main__":
    main()
