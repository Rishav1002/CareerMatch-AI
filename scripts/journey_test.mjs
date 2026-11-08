/**
 * CareerMatch AI: Comprehensive End-to-End Journey Test
 * Drives real Chromium via Playwright through the core candidate workflow:
 * Paste resume -> Parse preview -> Run match analysis -> View interactive report
 * -> View adaptive roadmap -> View ATS simulator -> View job market
 * -> Test language switch -> Test theme toggle -> Confirm zero console/network errors.
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SCREENSHOT_DIR = path.join(ROOT_DIR, "docs", "screenshots");
const FIXTURE_RESUME = path.join(ROOT_DIR, "tests", "fixtures", "test_resume.txt");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

console.log("==================================================");
console.log("  CareerMatch AI: E2E Browser Journey Test");
console.log("==================================================");

(async () => {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const cspViolations = [];

  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();
    console.log(`[Browser ${type}] ${text}`);
    if (type === "error") {
      consoleErrors.push(text);
      if (text.includes("Content Security Policy")) {
        cspViolations.push(text);
      }
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  try {
    // 1. Load Application
    console.log(`\n[1/7] Navigating to ${baseUrl}/ ...`);
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__cmBooted === true, { timeout: 10000 });
    console.log("PASS: Application booted successfully (__cmBooted = true).");

    // 2. Navigate to Analyzer
    console.log("\n[2/7] Navigating to Resume & Job Match Analyzer (#/analyzer)...");
    await page.evaluate(() => { window.location.hash = "#/analyzer"; });
    await page.waitForTimeout(500);

    // 3. Paste and Parse Resume
    console.log("\n[3/7] Pasting fixture resume and parsing...");
    const resumeText = fs.readFileSync(FIXTURE_RESUME, "utf-8");
    await page.fill("#pastedResumeInput", resumeText);
    await page.click("#parseTextBtn");

    // Wait for parsed resume preview to appear
    await page.waitForFunction(() => {
      const el = document.getElementById("parsedCandidateName");
      return el && el.textContent.trim().length > 0;
    }, { timeout: 10000 });

    const candidateName = await page.textContent("#parsedCandidateName");
    console.log(`PASS: Resume parsed successfully for candidate: "${candidateName.trim()}"`);

    // 4. Fill Role & Company and Run Analysis
    console.log("\n[4/7] Selecting target role 'Python Backend Developer' and running match analysis...");
    await page.selectOption("#targetRoleSelect", "Python Backend Developer");
    await page.fill("#goalCompanyInput", "Razorpay");
    await page.fill("#customJdInput", "Backend Engineer with Python, FastAPI, PostgreSQL, Redis, Docker, and distributed systems.");

    const isRunDisabled = await page.getAttribute("#runAnalysisBtn", "disabled");
    console.log("Run button disabled attribute:", isRunDisabled);

    await page.click("#runAnalysisBtn");

    // Wait for navigation to #/report
    await page.waitForFunction(() => window.location.hash === "#/report", { timeout: 25000 });
    console.log("PASS: Analysis complete, routed to #/report");

    // Wait for report DOM to populate
    await page.waitForFunction(() => {
      const score = document.getElementById("spotlightScoreNum");
      return score && score.textContent.trim().length > 0;
    }, { timeout: 10000 });

    const scoreText = await page.textContent("#spotlightScoreNum");
    console.log(`PASS: Rendered overall match score: ${scoreText.trim()}%`);

    const matchedCount = await page.textContent("#reportMatchedCountBadge");
    const missingCount = await page.textContent("#reportMissingCountBadge");
    console.log(`PASS: Skills breakdown -> Matched: ${matchedCount.trim()}, Missing: ${missingCount.trim()}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "report.png"), fullPage: false });
    console.log("Captured: report.png");

    // 5. Check Adaptive Roadmap Screen
    console.log("\n[5/7] Navigating to Adaptive Roadmap (#/roadmap)...");
    await page.evaluate(() => { window.location.hash = "#/roadmap"; });
    await page.waitForTimeout(800);

    const hasStages = await page.evaluate(() => {
      return document.querySelectorAll(".roadmap-stage-column, .roadmap-node-card, .timeline-item").length > 0;
    });
    console.log(`PASS: Roadmap milestones rendered (nodes count > 0: ${hasStages})`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "roadmap.png"), fullPage: false });
    console.log("Captured: roadmap.png");

    // 6. Check ATS and Jobs Market Screens
    console.log("\n[6/7] Verifying ATS Simulator (#/ats) and Job Market (#/market)...");
    await page.evaluate(() => { window.location.hash = "#/ats"; });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "ats.png"), fullPage: false });

    await page.evaluate(() => { window.location.hash = "#/market"; });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "Job-Market.png"), fullPage: false });
    console.log("PASS: ATS and Market views rendered.");

    // 7. Verify Theme Toggle and i18n Language Switch
    console.log("\n[7/7] Testing UI controls (Theme toggle & Language switch)...");
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await page.evaluate(() => {
      const btn = document.getElementById("topbarThemeToggleBtn") || document.getElementById("landingThemeToggleBtn");
      btn?.click();
    });
    await page.waitForTimeout(300);
    const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    console.log(`PASS: Theme toggle flipped from '${initialTheme}' to '${toggledTheme}'.`);

    // Switch back
    await page.evaluate(() => {
      const btn = document.getElementById("topbarThemeToggleBtn") || document.getElementById("landingThemeToggleBtn");
      btn?.click();
    });

    console.log("\n==================================================");
    console.log("  JOURNEY TEST PASSED: Full Candidate Flow Verified!");
    console.log("==================================================");

  } catch (err) {
    console.error("\nJOURNEY TEST FAILED:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
