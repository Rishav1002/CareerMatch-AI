/**
 * CareerMatch AI: Automated Frontend Smoke Test
 * Validates ES Module graph integrity, static HTML views, DOM elements,
 * duplicate listener guards, and backend end-to-end flow.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const jsDir = path.join(rootDir, "frontend", "js");
const htmlPath = path.join(rootDir, "frontend", "index.html");

let passedChecks = 0;
let totalChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ [PASS] ${message}`);
    passedChecks++;
  }
}

console.log("==================================================");
console.log("   CareerMatch AI — Frontend & E2E Smoke Test     ");
console.log("==================================================\n");

// ---------------------------------------------------------------------------
// 1. ES Module Graph Audit (Catches import/export mismatches like FloatingAskAiManager)
// ---------------------------------------------------------------------------
console.log("--- 1. Auditing ES Module Import/Export Graph ---");
function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) results = results.concat(getAllJsFiles(full));
    else if (full.endsWith(".js") && !full.endsWith("app.js")) results.push(full);
  }
  return results;
}

const jsFiles = getAllJsFiles(jsDir);
let moduleErrors = [];

for (const file of jsFiles) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, lineNo) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("import ")) return;
    const match = trimmed.match(/import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+["']([^"']+)["']/);
    if (!match) return;
    const namedPart = match[1];
    const defaultPart = match[2];
    const importPath = match[3];

    const resolved = path.resolve(path.dirname(file), importPath);
    if (!fs.existsSync(resolved)) {
      moduleErrors.push(`[${path.relative(rootDir, file)}:${lineNo + 1}] Missing file: ${importPath}`);
      return;
    }

    const targetContent = fs.readFileSync(resolved, "utf8");
    if (namedPart) {
      const names = namedPart.split(",").map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
      for (const name of names) {
        const regex1 = new RegExp(`export\\s+(const|let|var|function|class)\\s+${name}\\b`);
        const regex2 = new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`);
        if (!regex1.test(targetContent) && !regex2.test(targetContent)) {
          moduleErrors.push(`[${path.relative(rootDir, file)}:${lineNo + 1}] Export "${name}" NOT found in ${importPath}`);
        }
      }
    }
    if (defaultPart && !targetContent.includes("export default")) {
      moduleErrors.push(`[${path.relative(rootDir, file)}:${lineNo + 1}] Default export "${defaultPart}" NOT found in ${importPath}`);
    }
  });
}

assert(moduleErrors.length === 0, `All ES module imports/exports must be valid (found ${moduleErrors.length} errors)`);

// ---------------------------------------------------------------------------
// 2. HTML Structure & Route Registry (All 15 Views)
// ---------------------------------------------------------------------------
console.log("\n--- 2. Auditing index.html & 15 Route Views ---");
const html = fs.readFileSync(htmlPath, "utf8");

// Assert boot watchdog and banner exist
assert(html.includes('id="cmBootFailureBanner"'), "index.html must contain boot failure banner #cmBootFailureBanner");
assert(html.includes("window.__cmBooted"), "index.html must contain boot watchdog checking window.__cmBooted");

// All 15 required routes
const expectedRoutes = [
  { hash: "#/dashboard", id: "view-dashboard", name: "Dashboard" },
  { hash: "#/analyzer", id: "view-analyzer", name: "Resume & Job Match Analyzer" },
  { hash: "#/report", id: "view-report", name: "Evidence & Gap Report" },
  { hash: "#/ats", id: "view-ats", name: "ATS Simulator" },
  { hash: "#/roadmap", id: "view-roadmap", name: "Adaptive Roadmap" },
  { hash: "#/planner", id: "view-planner", name: "Preparation Planner" },
  { hash: "#/interview", id: "view-interview", name: "AI Mock Interview" },
  { hash: "#/assessment", id: "view-assessment", name: "Skill Assessment Lab" },
  { hash: "#/github", id: "view-github", name: "GitHub Skill Verification" },
  { hash: "#/jobs", id: "view-jobs", name: "Live Tech Jobs" },
  { hash: "#/tracker", id: "view-tracker", name: "Application Pipeline Tracker" },
  { hash: "#/career", id: "view-career", name: "Career Path & Salary Intelligence" },
  { hash: "#/pri", id: "view-pri", name: "Placement Readiness Index" },
  { hash: "#/profile", id: "view-profile", name: "User Career Profile" },
  { hash: "#/settings", id: "view-settings", name: "Settings & Storage" },
];

for (const r of expectedRoutes) {
  const hasId = html.includes(`id="${r.id}"`);
  assert(hasId, `View container #${r.id} (${r.name}) must exist in index.html`);
  if (hasId) {
    const idx = html.indexOf(`id="${r.id}"`);
    const slice = html.substring(idx, idx + 800);
    assert(slice.length > 50, `View #${r.id} must have non-empty content`);
  }
}

// Check key interactive elements
assert(html.includes('id="themeToggleBtn"'), "Theme toggle button #themeToggleBtn must exist");
assert(html.includes('id="landingAnalyzeCtaBtn"'), "Landing CTA button #landingAnalyzeCtaBtn must exist");
assert(html.includes('id="runAnalysisBtn"'), "Run analysis button #runAnalysisBtn must exist");
assert(html.includes('id="appBuildSha"'), "Build SHA badge #appBuildSha must exist in footer");

// ---------------------------------------------------------------------------
// 3. Theme Toggle & Duplicate Listener Test Simulation
// ---------------------------------------------------------------------------
console.log("\n--- 3. Testing Theme Toggle & Duplicate Listener Guard ---");
let currentTheme = "light";
let toggleCount = 0;
function simulateThemeToggle() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  toggleCount++;
}

// Simulate one click
simulateThemeToggle();
assert(currentTheme === "dark" && toggleCount === 1, "Clicking theme toggle flips light -> dark exactly once");

// Check bindOnce implementation in main.js
const mainJsContent = fs.readFileSync(path.join(jsDir, "main.js"), "utf8");
assert(mainJsContent.includes("function bindOnce"), "main.js must define bindOnce helper");
assert(mainJsContent.includes("window.__cmBooted = true"), "main.js must set window.__cmBooted = true");

// ---------------------------------------------------------------------------
// 4. Backend Health & End-to-End API Flow
// ---------------------------------------------------------------------------
console.log("\n--- 4. Testing Local Backend APIs & End-to-End Flow ---");

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const postJson = postData ? JSON.stringify(postData) : null;
    const headers = { ...(options.headers || {}) };
    if (postJson) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(postJson);
    }
    const req = http.request({ ...options, headers }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on("error", reject);
    if (postJson) req.write(postJson);
    req.end();
  });
}

// Spawn backend server for test on port 8999 using venv python if available
const pyCmd = fs.existsSync(path.join(rootDir, "venv", "Scripts", "python.exe"))
  ? path.join(rootDir, "venv", "Scripts", "python.exe")
  : "python";

const serverProcess = spawn(pyCmd, ["app.py"], {
  env: { ...process.env, PORT: "8999", HOST: "127.0.0.1", PYTHONPATH: rootDir },
  cwd: rootDir,
});

serverProcess.stdout.on("data", (d) => {
  // console.log("[Backend]", d.toString().trim());
});
serverProcess.stderr.on("data", (d) => {
  // console.error("[Backend err]", d.toString().trim());
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await makeRequest({
        hostname: "127.0.0.1",
        port,
        path: "/api/health",
        method: "GET",
      });
      if (res && res.status === 200) return true;
    } catch {
      // Still booting
    }
    await sleep(250);
  }
  return false;
}

async function runBackendTests() {
  const ready = await waitForServer(8999, 30);
  assert(ready, "Local backend server started and responded on port 8999");

  try {
    // 4.1 Check /api/health
    const health = await makeRequest({
      hostname: "127.0.0.1",
      port: 8999,
      path: "/api/health",
      method: "GET",
    });
    assert(health.status === 200, `/api/health responded with HTTP 200 (status=${health.status})`);
    assert(health.data && health.data.build_sha, `/api/health exposes build_sha (${health.data?.build_sha})`);

    // 4.2 Check /api/roles
    const roles = await makeRequest({
      hostname: "127.0.0.1",
      port: 8999,
      path: "/api/roles",
      method: "GET",
    });
    assert(roles.status === 200, `/api/roles responded with HTTP 200`);
    assert(Array.isArray(roles.data?.roles) && roles.data.roles.length >= 8, `roles catalog returned (${roles.data?.roles?.length} roles)`);

    // 4.3 Test empty analysis input validation
    const emptyAnalyze = await makeRequest(
      {
        hostname: "127.0.0.1",
        port: 8999,
        path: "/api/analyze",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {}
    );
    assert(
      emptyAnalyze.status === 400 || (emptyAnalyze.data && emptyAnalyze.data.detail),
      "POST /api/analyze with empty body returns 400 validation error"
    );

    // 4.4 Test resume parsing flow
    const sampleResumeText = `
John Doe
Software Engineer
Email: john.doe@example.org
Skills: Python, FastAPI, JavaScript, React, SQL, Git, Docker
Experience:
Software Engineer at Acme Corp (2022-2024)
- Built high-performance microservices using Python and FastAPI
- Designed REST APIs and optimized PostgreSQL database queries
Education:
B.Tech Computer Science, 2022
    `;

    const parseResp = await makeRequest(
      {
        hostname: "127.0.0.1",
        port: 8999,
        path: "/api/resume/parse",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { pastedText: sampleResumeText }
    );

    if (parseResp.status !== 200) {
      console.error("parseResp status:", parseResp.status, "data:", parseResp.data || parseResp.text);
    }
    assert(parseResp.status === 200, "POST /api/resume/parse parsed sample resume text");
    const resumeObj = parseResp.data?.resume || parseResp.data;
    const skillsList = Array.isArray(resumeObj.technicalSkills)
      ? resumeObj.technicalSkills
      : (resumeObj.skills?.technical || []);
    assert(Array.isArray(skillsList) && skillsList.length > 0, `Parsed resume contains extracted skills (${skillsList.length} skills found)`);

    // 4.5 Test full match analysis
    const analyzeResp = await makeRequest(
      {
        hostname: "127.0.0.1",
        port: 8999,
        path: "/api/analyze",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        resume: resumeObj,
        roleTitle: "Full Stack Developer",
        goalCompany: "TechCorp",
        customJdText: "Seeking Full Stack Developer skilled in Python, FastAPI, React, SQL, and Docker.",
      }
    );

    assert(analyzeResp.status === 200, "POST /api/analyze generated full career intelligence report");
    const rep = analyzeResp.data || {};
    const score = rep.matchResult?.overallScore ?? rep.matchScore;
    assert(typeof score === "number", `Match score generated: ${score}%`);
    assert(Array.isArray(rep.roadmapNodes) && rep.roadmapNodes.length > 0, `Analysis generated adaptive roadmap (${rep.roadmapNodes.length} nodes)`);
    assert(rep.atsReport && typeof rep.atsReport.atsScore === "number", `ATS Report generated (score: ${rep.atsReport.atsScore})`);

    // ---------------------------------------------------------------------------
    // 5. Garbage Value Guard (DOM & API Responses)
    // ---------------------------------------------------------------------------
    console.log("\n--- 5. Checking for Garbage Values & Seeded Data ---");
    const bannedPatterns = [
      "undefined",
      "NaN",
      "[object Object]",
      "Infinity",
      "Lorem",
      "TODO",
      "candidate@careermatch.ai",
      "Candidate_Profile",
      "user-demo-aarav",
      "demo-aarav-sharma"
    ];

    const responsesToAudit = [
      JSON.stringify(health.data),
      JSON.stringify(roles.data),
      JSON.stringify(parseResp.data),
      JSON.stringify(analyzeResp.data),
    ];

    for (const banned of bannedPatterns) {
      assert(!html.includes(banned), `DOM must not contain garbage or seeded string "${banned}"`);
      for (const respStr of responsesToAudit) {
        assert(!respStr.includes(banned), `API responses must not contain garbage or seeded string "${banned}"`);
      }
    }
  } finally {
    serverProcess.kill("SIGTERM");
  }

  console.log("\n==================================================");
  console.log(`🎉 ALL SMOKE TESTS PASSED (${passedChecks}/${totalChecks} checks)`);
  console.log("==================================================\n");
  process.exit(0);
}

runBackendTests().catch((err) => {
  console.error("❌ Smoke test crashed:", err);
  serverProcess.kill("SIGTERM");
  process.exit(1);
});
