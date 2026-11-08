# CareerMatch AI: Canonical API Contract

This document defines the authoritative API contract between the CareerMatch backend and frontend modules.

## Summary of Architectural Contract Principles
1. **Canonical Schema Restored:** The response contracts for `/api/analyze` and `/api/history/{id}` expose the full canonical keys required by the UI (`activeJob`, `matchResult`, `stages`, `roadmapNodes`, `completedNodes`, `atsReport`, `source`, `aiError`, `saved`, `resume`, `skillGaps`, `advisor`, `projects`, `improvements`, `dashboard`).
2. **Backward-Compatible Aliases:** The shorthand keys introduced in commit `061fe98` (`job`, `match`, `roadmap`, `ats`) are maintained alongside the canonical keys.
3. **Strict Session Isolation:** All endpoints receive an authenticated or cryptographically signed guest session identifier (`cm_sid`) via the `get_owner` dependency, ensuring strict multi-tenant boundary isolation.

---

## Endpoint Contracts

### 1. `POST /api/analyze`
Executes semantic career match analysis between a resume profile and job target.
- **Consumer:** `frontend/js/modules/analyzer.js`, `frontend/js/modules/report.js`, `frontend/js/components/historyDiff.js`

#### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `resume` | `object` | No* | Full parsed resume object (*either `resume` or `resumeId` required) |
| `resumeId` | `string` | No* | ID of previously stored resume |
| `roleTitle` | `string` | Yes | Target role (e.g., "Full Stack Developer", "Backend Developer") |
| `goalCompany` | `string` | No | Target company name |
| `customJdText` | `string` | No | Custom Job Description text |
| `jobUrl` | `string` | No | URL to job posting |
| `weights` | `object` | No | Custom scoring weights |
| `customFocus` | `string` | No | Custom focus area for career coach |
| `dontSave` | `boolean` | No | If true, analysis record is not saved to DB |
| `persistRecord` | `boolean` | No | If false, analysis record is not saved |

#### Response Body
| Field | Type | Canonical / Alias | Frontend Module Usage |
|---|---|---|---|
| `analysisId` | `integer` or `string` | Canonical | Stored in state for history and sharing |
| `saved` | `boolean` | Canonical | Indicates whether analysis was persisted |
| `source` | `string` | Canonical | `"gemini"` or `"template"` |
| `aiError` | `string` or `null` | Canonical | Explanatory error message if AI fell back |
| `resume` | `object` | Canonical | Current candidate resume profile |
| `activeJob` | `object` | Canonical | Target role requirements and benchmarks |
| `matchResult` | `object` | Canonical | `overallScore`, `matchedSkills`, `missingSkills`, etc. |
| `skillGaps` | `array[object]` | Canonical | Prioritized gap list with urgency and courses |
| `roadmapNodes` | `array[object]` | Canonical | Tree structure for roadmap rendering |
| `completedNodes`| `object` | Canonical | Map of `{ nodeId: boolean }` completion status |
| `stages` | `array[object]` | Canonical | 4-stage adaptive milestones |
| `advisor` | `object` | Canonical | AI recommendations and study strategy |
| `projects` | `array[object]` | Canonical | Hands-on projects tailored to gaps |
| `improvements`| `object` | Canonical | High-impact resume bullet suggestions |
| `atsReport` | `object` | Canonical | ATS scoring breakdown and keywords |
| `dashboard` | `object` | Canonical | Updated dashboard metrics |
| `job` | `object` | Alias (Deprecated) | Mirror of `activeJob` |
| `match` | `object` | Alias (Deprecated) | Mirror of `matchResult` |
| `roadmap` | `array[object]` | Alias (Deprecated) | Mirror of `stages` |
| `ats` | `object` | Alias (Deprecated) | Mirror of `atsReport` |

---

### 2. `GET /api/history/{analysis_id}`
Reloads a previously saved analysis record.
- **Consumer:** `frontend/js/modules/dashboard.js`, `frontend/js/modules/report.js`

#### Request Parameters
- `analysis_id` (path, integer): Primary key ID of the analysis record.

#### Response Body
Returns the identical structure as `POST /api/analyze` (`analysisId`, `resume`, `activeJob`, `matchResult`, `stages`, `skillGaps`, `advisor`, etc.) with `source: "sqlite_history"`, plus flat metadata fields (`candidateName`, `targetRole`, `goalCompany`, `createdAt`).

---

### 3. `GET /api/dashboard`
Fetches high-level placement readiness dashboard metrics.
- **Consumer:** `frontend/js/modules/dashboard.js`

#### Request Parameters
None. Owner ID resolved securely from signed cookie or JWT.

#### Response Body
| Field | Type | Description |
|---|---|---|
| `dashboard.stats` | `object` | Key metrics: readinessScore, analysesRun, skillsCount |
| `dashboard.recentAnalyses` | `array[object]` | List of past analyses for quick access |
| `dashboard.readinessScore` | `number` | Aggregated placement readiness index (0-100) |
| `dashboard.skillsCount` | `integer` | Count of verified candidate skills |
| `dashboard.gapCount` | `integer` | Count of identified high-priority gaps |

---

### 4. `GET /api/bootstrap`
App initialization bootstrap payload containing roles and profile defaults.
- **Consumer:** `frontend/js/main.js`, `frontend/js/api.js`

#### Response Body
| Field | Type | Description |
|---|---|---|
| `roles` | `array[object]` | Complete role catalog with skills and benchmarks |
| `defaultWeights` | `object` | Standard evaluation category weights |
| `defaultPriWeights` | `object` | Standard Placement Readiness Index weights |
| `dashboard` | `object` or `null` | Pre-loaded dashboard if active resume exists |
| `studentProfile` | `object` or `null` | Profile data for authenticated/guest user |

---

### 5. `POST /api/resume/parse`
Parses raw resume file bytes or text into structured JSON candidate profile.
- **Consumer:** `frontend/js/modules/analyzer.js`

#### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `base64Data` | `string` | No* | Base64-encoded PDF/DOCX/TXT file bytes |
| `filename` | `string` | No | Uploaded file name |
| `pastedText` | `string` | No* | Plaintext resume text (*either data or text required) |
| `dontSave` | `boolean` | No | Prevent saving to DB |

#### Response Body
| Field | Type | Description |
|---|---|---|
| `resume` | `object` | Structured candidate profile with technicalSkills, education, etc. |
| `saved` | `boolean` | Save confirmation flag |
| `dashboard` | `object` or `null` | Updated dashboard metrics |

---

### 6. `POST /api/ats/evaluate`
Evaluates resume against ATS parsing benchmarks and keyword matching.
- **Consumer:** `frontend/js/modules/ats.js`

#### Response Body
| Field | Type | Description |
|---|---|---|
| `atsScore` | `float` | Score (0-100) |
| `breakdown` | `object` | Score breakdown across format, skills, and structure |
| `recommendations` | `array[string]` | Actionable formatting advice |
| `keywordsFound` | `array[string]` | Detected ATS keywords |
| `keywordsMissing` | `array[string]` | Critical target keywords missing |

---

### 7. `POST /api/readiness/index`
Computes composite Placement Readiness Index (PRI).
- **Consumer:** `frontend/js/modules/pri.js`

#### Response Body
| Field | Type | Description |
|---|---|---|
| `readinessIndex` | `float` | Overall score (0-100) |
| `tier` | `string` | `"Foundational"`, `"Competitive"`, or `"Placement Ready"` |
| `breakdown` | `object` | Category sub-scores |
| `actionableRecommendations`| `array[string]` | Strategic suggestions |

---

### 8. `POST /api/jobs/market`
Aggregated job market listings with candidate skill match scores.
- **Consumer:** `frontend/js/modules/market.js`

#### Response Body
| Field | Type | Description |
|---|---|---|
| `jobs` | `array[object]` | Enriched job listings with salary and match % |
| `totalListings` | `integer` | Total matching listings |
| `trendingSkills`| `array[object]` | Market frequency of in-demand skills |
| `dataSource` | `string` | Description of live/cached data origin |

---

### 9. `POST /api/assessment/generate`, `POST /api/assessment/submit`, `POST /api/assessment/hint`
Technical skill testing lab.
- **Consumer:** `frontend/js/modules/assessment.js`

---

### 10. `POST /api/interview/start`, `POST /api/interview/answer`
Interactive mock interview practice simulator.
- **Consumer:** `frontend/js/modules/interview.js`

---

### 11. `POST /api/ai/ask` & `GET /api/ai/status`
AI advisor queries and availability status check.
- **Consumer:** `frontend/js/components/askAi.js`, `frontend/js/main.js`
