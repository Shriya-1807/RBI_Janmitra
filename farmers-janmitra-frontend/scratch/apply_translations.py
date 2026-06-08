import os
import json

def main():
    json_path = "../translated_overrides.json"
    if not os.path.exists(json_path):
        json_path = "translated_overrides.json"
    
    ts_path = "../artifacts/janmitra/src/lib/translations.ts"
    if not os.path.exists(ts_path):
        ts_path = "artifacts/janmitra/src/lib/translations.ts"
    if not os.path.exists(ts_path):
        ts_path = "../" + ts_path

    if not os.path.exists(json_path):
        print(f"Error: {json_path} does not exist!")
        return
        
    if not os.path.exists(ts_path):
        print(f"Error: {ts_path} does not exist!")
        return
        
    # 1. Load JSON data
    with open(json_path, "r", encoding="utf-8") as f:
        overrides_data = json.load(f)
        
    # 2. Format TS object
    overrides_json_str = json.dumps(overrides_data, ensure_ascii=False, indent=2)
    new_overrides_def = f"const farmerOverrides: Record<string, Record<string, string>> = {overrides_json_str};\n"
    
    # 3. Read TS file
    with open(ts_path, "r", encoding="utf-8") as f:
        ts_content = f.read()
        
    # 4. Replace farmerOverrides
    target_start = "const farmerOverrides: Record<string, Record<string, string>> = {"
    start_idx = ts_content.find(target_start)
    if start_idx == -1:
        target_start = "const farmerOverrides: Record<string, string> = {"
        start_idx = ts_content.find(target_start)
        
    if start_idx == -1:
        print("Error: Could not find target_start in TS file!")
        return
        
    # Find the closing }; of farmerOverrides
    end_marker = "};\n"
    end_idx = ts_content.find(end_marker, start_idx)
    if end_idx == -1:
        print("Error: Could not find closing marker }; after start in TS file!")
        return
        
    # Include the end marker in what we replace
    end_idx += len(end_marker)
    
    ts_content_new = ts_content[:start_idx] + new_overrides_def + ts_content[end_idx:]
    
    # 5. Replace getTranslation check
    old_get_trans_check = """export function getTranslation(lang: string, keyPath: string): string {
  if (farmerOverrides[keyPath]) {
    return farmerOverrides[keyPath];
  }"""
  
    new_get_trans_check = """export function getTranslation(lang: string, keyPath: string): string {
  const normalizedLang = lang.toLowerCase();
  if (farmerOverrides[normalizedLang] && farmerOverrides[normalizedLang][keyPath]) {
    return farmerOverrides[normalizedLang][keyPath];
  }
  if (farmerOverrides.english && farmerOverrides.english[keyPath]) {
    return farmerOverrides.english[keyPath];
  }"""

    # Normalize newlines for search and replace
    ts_content_new_normalized = ts_content_new.replace("\r\n", "\n")
    old_get_trans_check_normalized = old_get_trans_check.replace("\r\n", "\n")
    new_get_trans_check_normalized = new_get_trans_check.replace("\r\n", "\n")
    
    if old_get_trans_check_normalized in ts_content_new_normalized:
        ts_content_final = ts_content_new_normalized.replace(
            old_get_trans_check_normalized,
            new_get_trans_check_normalized
        )
        print("Successfully replaced getTranslation signature.")
    else:
        print("Warning: Could not find getTranslation signature in file, attempting alternative substring match...")
        # Try substring match
        alt_target = "if (farmerOverrides[keyPath]) {\n    return farmerOverrides[keyPath];\n  }"
        alt_replacement = "const normalizedLang = lang.toLowerCase();\n  if (farmerOverrides[normalizedLang] && farmerOverrides[normalizedLang][keyPath]) {\n    return farmerOverrides[normalizedLang][keyPath];\n  }\n  if (farmerOverrides.english && farmerOverrides.english[keyPath]) {\n    return farmerOverrides.english[keyPath];\n  }"
        if alt_target in ts_content_new_normalized:
            ts_content_final = ts_content_new_normalized.replace(alt_target, alt_replacement)
            print("Successfully replaced alternate getTranslation body.")
        else:
            print("Notice: getTranslation signature is already updated to regional lookup. Skipping.")
            ts_content_final = ts_content_new_normalized
            
    # Write back to file (use UTF-8)
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write(ts_content_final)
        
    print("translations.ts updated successfully!")

if __name__ == "__main__":
    main()
