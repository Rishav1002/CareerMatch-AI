import os
import re
from bs4 import BeautifulSoup

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(ROOT_DIR, "frontend", "index.html")

soup = BeautifulSoup(open(INDEX_PATH, encoding="utf-8"), "html.parser")
views = soup.find_all(lambda tag: tag.has_attr("id") and tag["id"].startswith("view-"))

print(f"{'View ID':<22} | {'Words':<6} | {'Labels/Text':<12} | {'Badges/Chips':<12} | {'Buttons/Links':<14} | {'Cards/Panels':<12}")
print("-" * 90)

for v in views:
    vid = v.get("id", "")
    text = " ".join(v.get_text().split())
    words = len(text.split()) if text else 0
    labels = len(v.find_all(["label", "span", "p", "small"]))
    badges = len(v.find_all(class_=lambda c: c and any(k in str(c) for k in ["badge", "chip", "tag", "pill"])))
    buttons = len(v.find_all(["button", "a"]))
    cards = len(v.find_all(class_=lambda c: c and any(k in str(c) for k in ["card", "panel", "box"])))
    print(f"{vid:<22} | {words:<6} | {labels:<12} | {badges:<12} | {buttons:<14} | {cards:<12}")

print(f"\nTotal views discovered: {len(views)}")
