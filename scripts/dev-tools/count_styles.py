import re
from collections import Counter

html = open('frontend/index.html', encoding='utf-8').read()
matches = re.findall(r'style="([^"]*)"', html)
print(f"Total style attributes: {len(matches)}")
c = Counter(matches)
for s, count in c.most_common(30):
    print(f"  [{count:2d}x] {s}")
