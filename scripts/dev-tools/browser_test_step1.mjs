/**
 * CareerMatch AI: Step 1 Real Browser Verification
 * - Opens http://127.0.0.1:3000 in real Chromium
 * - Captures DevTools console messages and errors
 * - Tests theme toggle and persistence
 * - Clicks "Analyze your resume"
 * - Navigates the rail
 * - Saves screenshots in docs/screenshots/
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SCREENSHOT_DIR = path.join(ROOT_DIR, "docs", "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

(async () => {
  console.log("Launching Chromium at:", chromePath);
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const consoleLogs = [];

  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === "error") {
      consoleErrors.push(text);
      console.error(`[Browser Console Error] ${text}`);
    } else if (type === "warning") {
      consoleWarnings.push(text);
    } else {
      consoleLogs.push(text);
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
    console.error(`[Browser PageError] ${err.message}`);
  });

  console.log("Navigating to http://127.0.0.1:3000/ ...");
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });

  // Wait for boot flag
  await page.waitForFunction(() => window.__cmBooted === true, { timeout: 8000 });
  console.log("PASS: Real browser confirmed window.__cmBooted === true");

  // Screenshot initial landing page (light)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "hero_light.png"), fullPage: false });
  console.log("Captured: hero_light.png");

  // Test Theme Toggle (on landing page, #landingThemeToggleBtn is visible)
  const themeToggle = page.locator("#landingThemeToggleBtn");
  await themeToggle.click();
  await page.waitForTimeout(300);

  const themeAfterClick = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  console.log("Theme after click:", themeAfterClick);
  if (themeAfterClick !== "dark") {
    throw new Error(`Expected dark theme after toggle, got: ${themeAfterClick}`);
  }

  // Screenshot dark theme
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "hero_dark.png"), fullPage: false });
  console.log("Captured: hero_dark.png");

  // Reload page to verify persistence
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__cmBooted === true, { timeout: 8000 });
  const themeAfterReload = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  console.log("Theme after reload:", themeAfterReload);
  if (themeAfterReload !== "dark") {
    throw new Error(`Expected theme persistence (dark) after reload, got: ${themeAfterReload}`);
  }
  console.log("PASS: Theme persisted across reload!");

  // Switch back to light
  await page.locator("#landingThemeToggleBtn").click();
  await page.waitForTimeout(200);

  // Click CTA to navigate to Analyzer
  console.log("Testing CTA navigation to Analyzer...");
  const analyzeCta = page.locator("#landingAnalyzeCtaBtn");
  if (await analyzeCta.count() > 0) {
    await analyzeCta.click();
    await page.waitForTimeout(500);
    const hash = await page.evaluate(() => window.location.hash);
    console.log("URL hash after clicking CTA:", hash);
  }

  // Test Rail Navigation
  console.log("Testing rail navigation...");
  const railLinks = ["#/dashboard", "#/analyzer", "#/ats", "#/roadmap", "#/market"];
  for (const r of railLinks) {
    await page.evaluate((targetHash) => {
      window.location.hash = targetHash;
    }, r);
    await page.waitForTimeout(300);
    const currentHash = await page.evaluate(() => window.location.hash);
    console.log(`Navigated to: ${currentHash}`);
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "analyzer_step1.png"), fullPage: false });
  console.log("Captured: analyzer_step1.png");

  await browser.close();

  console.log("\n==================================================");
  console.log("Console Errors detected in browser:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log(consoleErrors);
  }
  console.log("STEP 1 BROWSER TEST COMPLETE");
  console.log("==================================================");

  if (consoleErrors.some(e => e.includes("SyntaxError") || e.includes("Failed to load module script"))) {
    process.exit(1);
  }
})();
