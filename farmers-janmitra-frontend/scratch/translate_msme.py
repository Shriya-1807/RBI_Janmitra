import json
import os

MSME_MAP = {
    "hindi": "एमएसएमई",
    "tamil": "எம்எஸ்எம்இ",
    "telugu": "ఎమ్‌ఎస్‌ఎమ్‌ఈ",
    "kannada": "ಎಂಎಸ್ಎಂಇ",
    "malayalam": "എംഎസ്എംഇ",
    "bengali": "এমএসএমই",
    "marathi": "एमएसएमई",
    "gujarati": "એમએસએમઈ",
    "punjabi": "ਐੱਮਐੱਸਐੱਮਈ",
    "odia": "ଏମ୍ଏସ୍ଏମ୍ଇ",
    "urdu": "ایم ایس ایم ای",
    "assamese": "এম এছ এম ই"
}

def update_overrides():
    json_path = "../translated_overrides.json"
    if not os.path.exists(json_path):
        json_path = "translated_overrides.json"
    if not os.path.exists(json_path):
        print("Error: translated_overrides.json not found")
        return False

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for lang, trans_dict in data.items():
        if lang == "english" or lang not in MSME_MAP:
            continue
        replacement = MSME_MAP[lang]
        for key, val in trans_dict.items():
            if isinstance(val, str) and "MSME" in val:
                # Replace MSME with the regional script version
                trans_dict[key] = val.replace("MSME", replacement)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("translated_overrides.json updated successfully with regional MSME scripts.")
    return True

def update_translations_ts():
    ts_path = "../artifacts/janmitra/src/lib/translations.ts"
    if not os.path.exists(ts_path):
        ts_path = "artifacts/janmitra/src/lib/translations.ts"
    if not os.path.exists(ts_path):
        ts_path = "../../artifacts/janmitra/src/lib/translations.ts"
    if not os.path.exists(ts_path):
        print("Error: translations.ts not found")
        return False

    with open(ts_path, "r", encoding="utf-8") as f:
        content = f.read()

    # We can split the content by lines or process by sections.
    # Since each language is a root key like '"hindi": {' or '"tamil": {',
    # we can find the start of each language section and replace "MSME" only within that section.
    
    languages_ordered = [
        "english", "hindi", "tamil", "telugu", "kannada", "malayalam",
        "bengali", "marathi", "gujarati", "punjabi", "odia", "urdu", "assamese"
    ]
    
    # Find start indices of all language blocks
    positions = []
    for lang in languages_ordered:
        marker = f'  "{lang}": {{'
        idx = content.find(marker)
        if idx != -1:
            positions.append((lang, idx))
            
    positions.sort(key=lambda x: x[1])
    
    # We will reconstruct the content by replacing "MSME" inside each language block (except English)
    new_content = ""
    last_idx = 0
    for i in range(len(positions)):
        lang, start_idx = positions[i]
        # Find where this block ends (which is the start of the next language block, or farmerOverrides definition)
        if i + 1 < len(positions):
            end_idx = positions[i+1][1]
        else:
            # End of translations object
            end_idx = content.find("const farmerOverrides")
            if end_idx == -1:
                end_idx = len(content)
                
        # Append content before this block
        new_content += content[last_idx:start_idx]
        
        block_content = content[start_idx:end_idx]
        if lang != "english" and lang in MSME_MAP:
            replacement = MSME_MAP[lang]
            block_content = block_content.replace("MSME", replacement)
            
        new_content += block_content
        last_idx = end_idx
        
    new_content += content[last_idx:]
    
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print("translations.ts updated successfully with base regional MSME scripts.")
    return True

def main():
    if update_overrides():
        update_translations_ts()
        # Also run apply_translations to apply overrides
        import apply_translations
        apply_translations.main()

if __name__ == "__main__":
    main()
