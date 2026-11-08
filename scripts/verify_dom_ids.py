import os
import re

def main():
    with open('frontend/index.html', encoding='utf-8') as f:
        html_content = f.read()

    declared_html_ids = set(re.findall(r'\bid=["\']([^"\']+)["\']', html_content))
    print(f"Declared IDs in index.html: {len(declared_html_ids)}")

    # Gather dynamically generated IDs in JS templates (e.g., in innerHTML)
    dynamic_ids = set()
    js_files = []
    for root, _, files in os.walk('frontend/js'):
        for f in files:
            if f.endswith('.js'):
                js_files.append(os.path.join(root, f))

    for jf in js_files:
        with open(jf, encoding='utf-8') as f:
            content = f.read()
        for m in re.findall(r'\bid=["\']([^"\']+)["\']', content):
            dynamic_ids.add(m)

    all_valid_ids = declared_html_ids | dynamic_ids

    # Scan references
    missing = {}
    total_refs = 0
    for jf in js_files:
        with open(jf, encoding='utf-8') as f:
            content = f.read()
        # Find getElementById and querySelector(#...)
        refs = re.findall(r'getElementById\(["\']([^"\'$\+]+)["\']\)', content)
        refs += re.findall(r'querySelector\(["\']#([^"\'\s\.:\[>,\$\+]+)["\']\)', content)
        total_refs += len(refs)
        for ref in set(refs):
            # Exclude known runtime dynamic patterns or template variables
            if "${" in ref or "item-" in ref or "card-" in ref:
                continue
            if ref not in all_valid_ids:
                if jf not in missing:
                    missing[jf] = []
                missing[jf].append(ref)

    print(f"Scanned {len(js_files)} JS files with {total_refs} ID references.")
    if missing:
        print("\nFound unresolved DOM ID references:")
        for f, ids in missing.items():
            print(f"  {f}:")
            for i in ids:
                print(f"    - #{i}")
    else:
        print("\nPASS: All referenced DOM IDs exist in HTML or dynamic templates!")

if __name__ == "__main__":
    main()
