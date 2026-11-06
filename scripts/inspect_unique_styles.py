import re
from collections import Counter

html = open('frontend/index.html', encoding='utf-8').read()
matches = re.findall(r'style="([^"]*)"', html)
print(f"Total inline styles: {len(matches)}")
unique_styles = sorted(list(set(matches)))
print(f"Unique inline styles: {len(unique_styles)}")

for s in unique_styles:
    print("STYLE:", repr(s))
