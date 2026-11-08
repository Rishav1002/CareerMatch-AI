import re
from bs4 import BeautifulSoup

def trim_views():
    with open('frontend/index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. view-landing: shorten footer text and scene captions
    # Replace scene captions
    html = re.sub(
        r'<div class="scene-caption[^"]*"[^>]*>Parse skills with deterministic evidence</div>',
        '<div class="scene-caption opacity-1">Parse skills with proof</div>',
        html
    )
    html = re.sub(
        r'<div class="scene-caption[^"]*"[^>]*>Pinpoint gaps across live benchmarks</div>',
        '<div class="scene-caption opacity-0">Pinpoint skill gaps</div>',
        html
    )
    html = re.sub(
        r'<div class="scene-caption[^"]*"[^>]*>Follow an adaptive weekly roadmap</div>',
        '<div class="scene-caption opacity-0">Follow adaptive roadmaps</div>',
        html
    )
    html = re.sub(
        r'<div class="scene-caption[^"]*"[^>]*>Connect with verified hiring pipelines</div>',
        '<div class="scene-caption opacity-0">Connect to tech jobs</div>',
        html
    )
    # Shorten steps description
    html = re.sub(
        r'Deterministic, zero-hallucination analysis backed by verifiable text anchors\.',
        'Deterministic analysis backed by verifiable evidence.',
        html
    )
    html = re.sub(
        r'Drop your PDF or DOCX resume, or paste plain text\. Private transient sessions are always supported—nothing saved without consent\.',
        'Drop PDF or paste text. Private transient sessions with zero retention.',
        html
    )
    html = re.sub(
        r'Deterministic semantic parsing checks requirements against live Indian and global job descriptions with exact evidence quotes\.',
        'Semantic parsing checks requirements against live benchmarks with exact proof quotes.',
        html
    )
    html = re.sub(
        r'Close skill gaps with structured weekly study roadmaps, ATS formatting fixes, coding challenges, and mock interview practice\.',
        'Close skill gaps with weekly roadmaps, ATS fixes, coding labs, and mock interviews.',
        html
    )
    # Shorten footer summary
    html = re.sub(
        r'Deterministic, evidence-grounded career intelligence for engineering students and tech professionals\.',
        'Evidence-grounded career intelligence for engineering students.',
        html
    )
    html = re.sub(
        r'Live job feeds aggregated from Arbeitnow, Remotive, Adzuna, and verified Indian tech benchmark datasets\.',
        'Live job feeds aggregated from verified Indian tech benchmarks.',
        html
    )

    # 2. view-login: shorten guest description
    html = re.sub(
        r'Scoped guest mode keeps all your analyses safely stored in private browser memory\. You can link your account at any time\.',
        'Guest sessions save locally in private browser storage.',
        html
    )

    # 3. view-dashboard: remove seeded mock data from initial template
    html = re.sub(
        r'<tr>\s*<td><strong>Data Engineer</strong></td>\s*<td>NexusCloud Commerce India</td>\s*<td>Today</td>\s*<td class="num"><span class="score-pill high">83\.2%</span></td>\s*</tr>',
        '<tr><td colspan="4" class="text-center text-tertiary">No past analyses recorded.</td></tr>',
        html
    )
    # Replace action tips
    html = re.sub(
        r'<ul class="list-unstyled[^"]*" id="actionTipsList">[\s\S]*?</ul>',
        '<ul class="list-unstyled d-flex flex-col gap-sm text-sm p-0" id="actionTipsList"><li class="p-1 bg-sunken rounded-sm border-subtle">Review roadmap milestones to close top skill gaps.</li></ul>',
        html
    )
    # Replace next action desc
    html = re.sub(
        r'Your lowest category is Technical Rubric \(72%\)\. A 15-minute mock interview will boost your confidence for upcoming rounds\.',
        'Practice technical questions to boost interview readiness.',
        html
    )

    # 4. view-analyzer: simplify targetRoleSelect to top standard roles (analyzer.js dynamically loads all 41)
    target_role_options = """<select class="form-select" id="targetRoleSelect">
                        <option disabled="" selected="" value="">Select a target role...</option>
                        <option value="Full Stack Developer">Full Stack Developer</option>
                        <option value="Data Engineer">Data Engineer</option>
                        <option value="Python Backend Developer">Python Backend Developer</option>
                        <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                        <option value="Cloud / DevOps Engineer">Cloud / DevOps Engineer</option>
                        <option value="Other">Other (Custom Role)...</option>
                      </select>"""
    html = re.sub(
        r'<select class="form-select" id="targetRoleSelect">[\s\S]*?</select>',
        target_role_options,
        html
    )
    # Remove slop from analyzer
    html = re.sub(
        r'<div class="text-xs text-tertiary">\s*Deterministic evidence parsing · Supports PDF, DOCX, TXT\s*</div>',
        '<div class="text-xs text-tertiary">Supports PDF, DOCX, TXT</div>',
        html
    )
    html = re.sub(
        r'Run Explainable Match Analysis →',
        'Run Match Analysis →',
        html
    )

    # 5. view-interview: replace placeholder question with concise prompt
    html = re.sub(
        r'Topic: Distributed Data Pipelines &amp; Indexing',
        'Topic: Core Technical Concepts',
        html
    )
    html = re.sub(
        r'How do you diagnose and resolve performance bottlenecks in high-volume PostgreSQL table partition scans\?',
        'Select round and difficulty, then start session.',
        html
    )
    html = re.sub(
        r'Real-time speech or text answers with immediate rubric evaluation',
        'Real-time answers with instant rubric evaluation',
        html
    )

    # 6. view-assessment: tighten headers and empty state
    html = re.sub(
        r'Deterministic verification: 4 MCQs \+ 1 Sandboxed Code Challenge',
        'Verify skills with 4 MCQs and a code lab',
        html
    )
    html = re.sub(
        r'<h4 class="text-base mb-1">Assessment History</h4>',
        '',
        html
    )
    html = re.sub(
        r'No test sessions completed yet\.',
        'No test sessions yet.',
        html
    )

    # 7. view-jobs: tighten subhead and headers
    html = re.sub(
        r'Hiring matrices for Indian tech hubs \(Bengaluru, Hyderabad, Pune, Gurugram\)',
        'Live hiring matrices across Indian tech hubs',
        html
    )
    html = re.sub(
        r'High-Demand Skills in Current Openings',
        'In-Demand Skills',
        html
    )
    html = re.sub(
        r'Company Hiring Matrix',
        'Hiring Matrix',
        html
    )

    # 8. view-career: tighten subhead
    html = re.sub(
        r'Transition bridges, required skill investments, and Indian tech CTC percentiles',
        'Role bridges and Indian tech salary benchmarks',
        html
    )
    html = re.sub(
        r'All Engineering Roles Salary Matrix \(India\)',
        'Engineering Salary Matrix',
        html
    )

    # 9. view-pri: tighten labels and disclaimer
    html = re.sub(
        r'Placement Readiness Index is computed using deterministic scoring rules and verified text/code proof\.',
        'PRI evaluates verified evidence across 6 pillars.',
        html
    )
    html = re.sub(
        r'Customize 6-Pillar PRI Weights',
        'Custom Weights',
        html
    )

    # 10. view-profile: tighten descriptions and subheads
    html = re.sub(
        r'Canonical profile used for explainable matching, skill verification, and roadmap benchmarks',
        'Profile used for match scoring and roadmap milestones',
        html
    )
    html = re.sub(
        r'Target Role &amp; Aspirations',
        'Target Role',
        html
    )

    # 11. view-settings: tighten description
    html = re.sub(
        r'Manage appearance, local data export, and session privacy\.',
        'Configure theme, backups, and privacy.',
        html
    )
    html = re.sub(
        r'Switch between light paper and dark liquid-glass themes\.',
        'Switch between light paper and dark theme.',
        html
    )
    html = re.sub(
        r'Download a copy of your stored resumes, analyses, and roadmap\.',
        'Download your stored analyses and roadmaps.',
        html
    )
    html = re.sub(
        r'Delete all local analyses, parsed resumes, and assessments from this browser\.',
        'Delete local data from this browser.',
        html
    )

    with open('frontend/index.html', 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)
    print("Trimmed view budgets.")

trim_views()
