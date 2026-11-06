import re

with open('frontend/css/tokens.css', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '--font-display: "Newsreader", Georgia, "Times New Roman", serif;',
    '--font-display: "Newsreader", "Noto Serif Devanagari", Georgia, serif;'
)
content = content.replace(
    '--font-ui: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;',
    '--font-ui: "Plus Jakarta Sans", "Noto Sans Devanagari", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;'
)

if '[lang="hi"]' not in content:
    content += """

/* ==========================================================================
   BILINGUAL & DEVANAGARI TYPOGRAPHY
   ========================================================================== */
[lang="hi"] {
  font-family: "Noto Sans Devanagari", var(--font-ui);
}

[lang="hi"] h1,
[lang="hi"] h2,
[lang="hi"] h3,
[lang="hi"] h4,
[lang="hi"] .font-serif {
  font-family: "Noto Serif Devanagari", var(--font-display);
}
"""

with open('frontend/css/tokens.css', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("Updated tokens.css with Devanagari typography")
