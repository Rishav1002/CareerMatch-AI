import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'<div class="text-xs text-tertiary">Supports PDF, DOCX, TXT</div>', '', html)
html = re.sub(r'<strong class="text-base" id="parsedCandidateName">Candidate Profile</strong>', '<strong class="text-base" id="parsedCandidateName"></strong>', html)
html = re.sub(r'<span class="score-pill" id="parsedSkillsCountBadge">9 Skills Found</span>', '<span class="score-pill" id="parsedSkillsCountBadge"></span>', html)
html = re.sub(r'<div class="text-xs text-tertiary" id="miniCardCandidate">Candidate Profile</div>', '<div class="text-xs text-tertiary" id="miniCardCandidate"></div>', html)
html = re.sub(r'<div class="text-xs text-secondary" id="miniCardCandidateSub">candidate@example\.com</div>', '<div class="text-xs text-secondary" id="miniCardCandidateSub"></div>', html)
html = re.sub(r'<div class="text-xs font-semibold" id="miniCardRole">Data Engineer</div>', '<div class="text-xs font-semibold" id="miniCardRole"></div>', html)
html = re.sub(r'<div class="text-xs text-tertiary" id="miniCardCompany">NexusCloud India</div>', '<div class="text-xs text-tertiary" id="miniCardCompany"></div>', html)
html = re.sub(r'Select a target role\.\.\.', 'Select role...', html)
html = re.sub(r'Other \(Custom Role\)\.\.\.', 'Other...', html)

with open('frontend/index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(html)
print("Trimmed analyzer.")
