import re
from bs4 import BeautifulSoup
from collections import Counter

html = open('frontend/index.html', encoding='utf-8').read()
matches = re.findall(r'style="([^"]*)"', html)
print(f"Total inline styles: {len(matches)}")
c = Counter(matches)
for style, count in c.most_common():
    print(f"{count:3d} | {style}")
