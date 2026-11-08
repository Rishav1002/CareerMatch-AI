from bs4 import BeautifulSoup
import re

content = open('frontend/index.html', encoding='utf-8').read()
soup = BeautifulSoup(content, 'html.parser')

views = soup.find_all(lambda tag: tag.has_attr('id') and (tag['id'].startswith('view-') or tag['id'] == 'landing-view'))
for v in views:
    vid = v.get('id')
    # find where id="vid" appears in content
    pos = content.find(f'id="{vid}"')
    line_no = content[:pos].count('\n') + 1
    print(f"{vid:20s} at line {line_no}")
