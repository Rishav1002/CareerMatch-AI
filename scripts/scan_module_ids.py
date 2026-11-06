import os, re

modules = os.listdir('frontend/js/modules')
for m in sorted(modules):
    if not m.endswith('.js'): continue
    path = os.path.join('frontend/js/modules', m)
    content = open(path, encoding='utf-8').read()
    ids = re.findall(r'getElementById\([\"\']([^\"\']+)[\"\']\)', content)
    qs = re.findall(r'querySelector\([\"\']#([^\"\']+)[\"\']\)', content)
    all_ids = sorted(list(set(ids + qs)))
    print(f"{m:15s} ({len(all_ids)} IDs): {', '.join(all_ids[:8])}{'...' if len(all_ids)>8 else ''}")
