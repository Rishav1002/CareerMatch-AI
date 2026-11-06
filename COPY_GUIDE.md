# CareerMatch AI: Copy & Editorial Style Guide
**Direction:** Calm Editorial Career Field Guide for Indian Engineering Students & Developers  
**Version:** 4.0.0 (Redesign Edition)

---

## 1. Product Voice & Principles

CareerMatch AI is an explainable career-readiness field guide. Our audience consists of Indian engineering undergraduates, tier-2/3 college graduates, and early-career software developers navigating placements and job searches.

### The Three Voice Pillars:
1. **Calm & Evidence-Grounded:** We do not sell dreams; we provide verified text quotes, deterministic matching scores, and reproducible gap analysis. If a skill is missing, we state the gap plainly.
2. **Peer-to-Peer Technical Respect:** We speak like an experienced tech lead or senior mentor doing a code review. No cheerleading, no scolding, no patronizing corporate jargon.
3. **Information Density over Decorative Fluff:** Every sentence must convey actionable intelligence. If a word can be deleted without losing meaning, delete it.

---

## 2. Banned Phrases & Prescribed Alternatives

AI-generated copy tends to default to empty superlatives, corporate buzzwords, and dramatic marketing filler. The following terms are strictly forbidden across all app copy, documentation, and error toasts:

| Banned AI-Slop Phrase | Why It Is Banned | Prescribed Alternative |
|---|---|---|
| *"Unlock your potential"* | Vague motivational platitude | *"Evaluate your readiness"* / *"Review skill gaps"* |
| *"Supercharge your career"* | Hyperbolic hype | *"Prepare for technical interviews"* |
| *"AI-powered / Revolutionary"* | Tech-washing empty claim | *"Deterministic semantic matching"* |
| *"Seamlessly"* | Filler adverb | Drop entirely (e.g. *"Upload and match"*) |
| *"Game-changing / 10x"* | Tech bro hyperbole | State concrete metrics (e.g. *"+12% match"*)|
| *"Delve into / In today's competitive landscape"* | AI writing tells | Get straight to the subject |
| *"Foster / Leverage / Synergize"* | Corporate consultant jargon | *"Use"*, *"Build"*, *"Practice"* |
| *"Guaranteed job placement"* | False promise / Legal liability | *"Placement Readiness Index"* / *"Benchmark score"* |

---

## 3. Standard Action Verbs (CTAs)

Buttons and actions must begin with clear, imperative verbs that describe the exact action the user triggers:

- **Analyze:** Used for parsing resumes and calculating match scores (`Analyze resume`, `Run match analysis`).
- **Verify:** Used for checking evidence against GitHub or code repositories (`Verify GitHub repos`).
- **Practice:** Used for mock interview questions and active recall (`Start mock interview`, `Practice question`).
- **Test:** Used for coding challenges and MCQ skill labs (`Start skill test`, `Submit test`).
- **Track:** Used for application kanban boards (`Track application`).
- **Export:** Used for generating PDFs or downloading JSON data (`Export PDF`, `Export JSON`).
- **Save / Reset:** Used for configuration and tuning (`Save profile`, `Reset defaults`).

---

## 4. Bilingual Translation Standards (English & Hindi)

CareerMatch AI supports full English and Hindi (Devanagari) localization via `frontend/js/i18n.js`.

### Hindi Translation Rules:
1. **Dignified Standard Hindi with Devanagari Script:** Use clear Devanagari typography (`Noto Sans Devanagari` for body text, `Noto Serif Devanagari` for editorial display headings).
2. **Keep Universal Tech Terms Intact:** Do not force awkward Sanskrit or Hindi neologisms for standardized programming terms. Keep technical keywords familiar to developers:
   - ✅ *पायथन (Python)*, *एसक्यूएल (SQL)*, *गिटहब (GitHub)*, *एटीएस (ATS)*, *एपीआई (API)*, *रोडमैप (Roadmap)*
   - ❌ Avoid translating *API* as *अनुप्रयोग प्रोग्रामिंग इंटरफ़ेस* or *Code* as *कूट*.
3. **Accurate Functional Vocabulary:**
   - *Resume* → रेज़्युमे
   - *Match / Score* → मिलान / स्कोर
   - *Skill Gap* → कौशल अंतराल (गैप)
   - *Evidence* → साक्ष्य
   - *Readiness* → तैयारी / रेडीनेस
   - *Interview* → इंटरव्यू

---

## 5. View Word Budgets & Layout Rules

Every view in `frontend/index.html` adheres to a strict maximum word count budget to eliminate cognitive overload and mobile text crowding:

| View ID | Primary Job | Primary Action | Max Word Budget | Measured Count |
|---|---|---|---|---|
| `view-landing` | Explain product in 10s & trigger upload | Analyze resume CTA | $\le 90$ fold / $\le 200$ tot | **179 words** |
| `view-login` | Authenticate or enter guest mode | Sign In / Continue as Guest | $\le 40$ words | **37 words** |
| `view-dashboard` | Morning read on readiness & next step | Practice Next Action | $\le 60$ words | **58 words** |
| `view-analyzer` | Upload resume & select target role | Run Match Analysis | $\le 70$ words | **59 words** |
| `view-report` | Evidence-based match score & gaps | Export PDF / View Roadmap | $\le 60$ words/tab | **21 words/tab** (128 tot) |
| `view-ats` | Verify formatting & keyword density | Re-scan ATS | $\le 40$ words | **33 words** |
| `view-roadmap` | Sequential week-by-week study plan | Start Next Milestone | $\le 40$ words | **29 words** |
| `view-planner` | Weekly study schedule & streak | Check off task | $\le 30$ words | **22 words** |
| `view-interview` | Practice technical questions | Submit Answer | $\le 60$ words | **60 words** |
| `view-assessment` | Verify skills via MCQ & coding lab | Start Test | $\le 40$ words | **37 words** |
| `view-github` | Prove claimed skills with repos | Analyze GitHub | $\le 40$ words | **34 words** |
| `view-jobs` | View live matching Indian tech jobs | Filter Openings | $\le 40$ words | **36 words** |
| `view-tracker` | Track application stages on Kanban | Add Job | $\le 40$ words | **16 words** |
| `view-career` | Compare roles & Indian salary ranges | Compare Roles | $\le 40$ words | **31 words** |
| `view-pri` | 6-pillar composite readiness index | Recalculate Index | $\le 50$ words | **40 words** |
| `view-profile` | Canonical candidate profile data | Save Profile | $\le 50$ words | **47 words** |
| `view-settings` | Storage, theme & privacy controls | Purge Data / Export | $\le 40$ words | **40 words** |
| `view-privacy` | Explain transient sessions & privacy | Read policy | $\le 120$ words | **120 words** |
| `view-terms` | Explain advisory scope of benchmarks | Read terms | $\le 120$ words | **52 words** |
| `view-cookies` | Disclose zero tracking & local storage| Read policy | $\le 120$ words | **41 words** |
| `view-404` | Help lost users navigate back | Go to Dashboard | $\le 40$ words | **32 words** |

---

## 6. Numerical, Currency & Date Formats

1. **Indian Compensation Benchmarks:** Always format salaries in Lakhs Per Annum (`LPA`) or Indian Rupees (`₹`), e.g., `₹12 - 18 LPA` or `₹8.5 LPA`. Never use USD (`$`) for domestic Indian job postings.
2. **Percentages:** Format scores with at most 1 decimal place (`83.2%` or `80%`). Never output floating-point noise (`83.235294117%`).
3. **Dates:** Use relative dates (`Today`, `Yesterday`, `3 days ago`) for recent actions; use ISO format (`2026-11-06`) for immutable system records.
