import re
from bs4 import BeautifulSoup

html = open('frontend/index.html', encoding='utf-8').read()
soup = BeautifulSoup(html, 'html.parser')

# Find views
views = soup.find_all(lambda tag: tag.has_attr('id') and (tag['id'].startswith('view-') or tag['id'] == 'landing-view'))
print(f"Total views found: {len(views)}")
for v in views:
    vid = v.get('id')
    text = v.get_text()
    words = len(re.findall(r"\b[a-zA-Z0-9_\-']+\b", text))
    print(f"  {vid}: {words} words")
