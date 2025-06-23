# -*- coding: utf-8 -*-
import os
import re
import json
import requests

DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")  # or hardcode here as string
DEEPL_ENDPOINT = "https://api-free.deepl.com/v2/translate"

TARGET_LANGUAGES = ["de", "it", ]  # German, Italian, Malay
INPUT_DIR = "../frontend"  # adjust if needed
TRANSLATION_FILE = "./public/dist/assets/languages/translation.json"

def find_translation_keys():
    pattern = re.compile(r"window\.ls\.__\(\s*['\"](.+?)['\"]\s*\)")
    translation_keys = set()

    for root, _, files in os.walk(INPUT_DIR):
        for filename in files:
            if filename.endswith((".js", ".ts", ".jsx", ".tsx")):
                path = os.path.join(root, filename)
                with open(path, "r") as f:
                    content = f.read()
                    matches = pattern.findall(content)
                    for match in matches:
                        translation_keys.add(match)
    return sorted(list(translation_keys))

def load_existing_translations():
    if not os.path.exists(TRANSLATION_FILE):
        return {}
    with open(TRANSLATION_FILE, "r") as f:
        return json.load(f)

def save_translations(translations):
    dir_path = os.path.dirname(TRANSLATION_FILE)
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
    with open(TRANSLATION_FILE, "w") as f:
        json.dump(translations, f, ensure_ascii=False, indent=2)

def translate(text, target_lang):
    if not DEEPL_API_KEY:
        raise Exception("DEEPL_API_KEY environment variable not set")

    data = {
        "auth_key": DEEPL_API_KEY,
        "text": text,
        "target_lang": target_lang.upper()
    }

    response = requests.post(DEEPL_ENDPOINT, data=data)
    if response.status_code != 200:
        print("Error translating '{}': {}".format(text, response.text))
        return None

    return response.json()["translations"][0]["text"]

def update_translations():
    print("Scanning for translation keys...")
    keys = find_translation_keys()
    existing = load_existing_translations()
    updated = False

    for key in keys:
        if key not in existing:
            existing[key] = {"en_EN": key}
            updated = True

        for lang in TARGET_LANGUAGES:
            lang_code = "{}_{}".format(lang, lang.upper())
            if lang_code not in existing[key]:
                print("Translating '{}' → {}".format(key, lang_code))
                translated = translate(key, lang)
                if translated:
                    existing[key][lang_code] = translated
                    updated = True

    if updated:
        save_translations(existing)
        print("Updated translations saved to {}".format(TRANSLATION_FILE))
    else:
        print("No updates needed. All translations exist.")

if __name__ == "__main__":
    update_translations()
