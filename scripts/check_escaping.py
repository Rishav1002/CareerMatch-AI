import os, re

modules = os.listdir('frontend/js/modules')
for m in sorted(modules):
    if not m.endswith('.js'): continue
    path = os.path.join('frontend/js/modules', m)
    content = open(path, encoding='utf-8').read()
    has_escape = 'escapeHtml' in content or 'escape' in content
    inner_html_count = len(re.findall(r'\.innerHTML\s*=', content))
    print(f"{m:15s} | has_escape: {str(has_escape):5s} | innerHTML occurrences: {inner_html_count}")
