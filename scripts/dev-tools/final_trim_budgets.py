import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# dashboard: trim 4 words
html = re.sub(
    r'Practice technical questions to boost interview readiness\.',
    'Practice technical questions\.',
    html
)

# analyzer: trim 16 words
html = re.sub(r'placeholder="Paste full resume text here\.\.\."', 'placeholder="Paste resume text..."', html)
html = re.sub(r'placeholder="Paste custom JD or use standard benchmark requirements\.\.\."', 'placeholder="Paste job description..."', html)
html = re.sub(r'placeholder="e\.g\. Distributed Systems Engineer"', 'placeholder="Role title..."', html)
html = re.sub(r'placeholder="e\.g\. Infosys, TCS, Google, Startup"', 'placeholder="Company name..."', html)
html = re.sub(r'<div class="upload-subtitle[^"]*">PDF, DOCX, TXT</div>', '', html)

# profile: trim 10 words
html = re.sub(r'<span class="text-sm text-secondary">Canonical candidate profile</span>', '', html)
html = re.sub(r'>Full Name<', '>Name<', html)
html = re.sub(r'>Primary Target Role<', '>Role<', html)
html = re.sub(r'>Dream Target Companies<', '>Companies<', html)
html = re.sub(r'>Target CTC Band \(INR / Year\)<', '>Target CTC<', html)
html = re.sub(r'>Profile Completeness<', '>Completeness<', html)

with open('frontend/index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(html)
print("Trimmed final 3 views.")
