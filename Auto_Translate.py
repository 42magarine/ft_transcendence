# -*- coding: utf-8 -*-
import os
import re

INPUT_DIR = "src/frontend"  # Adjust if needed
OUTPUT_FILE = "missing_translations.txt"

TRANSLATION_PATTERN = re.compile(r"window\.ls\.__\(\s*['\"](.+?)['\"]\s*\)")

def find_translation_keys():
    found_keys = set()

    for root, _, files in os.walk(INPUT_DIR):
        for file in files:
            if file.endswith(".ts") or file.endswith(".tsx"):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        matches = TRANSLATION_PATTERN.findall(content)
                        found_keys.update(matches)
                except Exception as e:
                    print(f"⚠️ Could not read {full_path}: {e}")

    return sorted(found_keys)

def write_keys_to_file(keys):
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for key in keys:
            f.write(f"{key}\n")
    print(f"✅ Found {len(keys)} keys. Written to {OUTPUT_FILE}")

def main():
    keys = find_translation_keys()
    write_keys_to_file(keys)

if __name__ == "__main__":
    main()
