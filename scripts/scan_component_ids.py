import os, re

components = os.listdir('frontend/js/components')
for c in sorted(components):
    if not c.endswith('.js'): continue
    path = os.path.join('frontend/js/components', c)
    content = open(path, encoding='utf-8').read()
    ids = re.findall(r'getElementById\([\"\']([^\"\']+)[\"\']\)', content)
    qs = re.findall(r'querySelector\([\"\']#([^\"\']+)[\"\']\)', content)
    all_ids = sorted(list(set(ids + qs)))
    print(f"{c:20s} ({len(all_ids)} IDs): {', '.join(all_ids[:8])}{'...' if len(all_ids)>8 else ''}")
