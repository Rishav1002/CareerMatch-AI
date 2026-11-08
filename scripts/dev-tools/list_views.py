from bs4 import BeautifulSoup

soup = BeautifulSoup(open('frontend/index.html', encoding='utf-8').read(), 'html.parser')
views = soup.find_all(lambda tag: tag.has_attr('id') and (tag['id'].startswith('view-') or tag['id'] == 'landing-view'))
print(f"Total views: {len(views)}")
for v in views:
    h = v.find(['h1', 'h2', 'h3'])
    htxt = h.get_text(strip=True) if h else 'No heading'
    print(f"{v.get('id'):20s} | {htxt}")
