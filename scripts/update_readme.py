import re

with open('README.md', 'r', encoding='utf-8') as f:
    c = f.read()

old_test_section = """```bash
# Run unit, route architecture, and endpoint tests:
python scripts/run_tests.py

# Run automated WCAG 2.1 AA color-contrast audits:
python scripts/check_contrast.py
```"""

new_test_section = """```bash
# Run unit, route architecture, and endpoint tests:
python scripts/run_tests.py

# Run frontend ES module and end-to-end smoke tests:
node scripts/smoke_frontend.mjs

# Run automated WCAG 2.1 AA color-contrast audits:
python scripts/check_contrast.py

# Run view text density and word budget audit:
python scripts/audit_views_text.py
```"""

c = c.replace(old_test_section, new_test_section)

with open('README.md', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)

print("Updated README.md test section")
