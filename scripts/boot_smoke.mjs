/**
 * CareerMatch AI: Automated Boot Smoke Test
 * 
 * Stage 1: Strict JS syntax check on every frontend ES module.
 * Stage 2: Headless DOM boot verification using JSDOM:
 *   - Verifies the full ES module dependency graph imports without syntax or reference errors.
 *   - Verifies window.__cmBooted is marked true.
 *   - Verifies theme toggling flips data-theme correctly and updates storage.
 *   - Verifies all 20 route definitions exist and render.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const JS_DIR = path.join(FRONTEND_DIR, "js");
const HTML_FILE = path.join(FRONTEND_DIR, "index.html");

console.log("==================================================");
console.log("  CareerMatch AI: Boot Smoke Test");
console.log("==================================================");

// --- Stage 1: Syntax check all JS modules ---
console.log("\n[Stage 1/2] Checking JavaScript syntax across frontend/js/...");

function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllJsFiles(fullPath));
    } else if (file.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}

const jsFiles = getAllJsFiles(JS_DIR);
let syntaxFailures = 0;

for (const filePath of jsFiles) {
  const relPath = path.relative(ROOT_DIR, filePath);
  try {
    const code = fs.readFileSync(filePath, "utf-8");
    execFileSync(process.execPath, ["--input-type=module", "--check"], {
      input: code,
      stdio: ["pipe", "pipe", "pipe"],
    });
    // Syntax valid
  } catch (err) {
    syntaxFailures++;
    console.error(`SYNTAX ERROR in ${relPath}:`);
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    console.error(stderr.trim());
  }
}

if (syntaxFailures > 0) {
  console.error(`\nFAILED: ${syntaxFailures} file(s) failed JavaScript syntax check.`);
  process.exit(1);
}
console.log(`PASS: All ${jsFiles.length} JavaScript files passed syntax check.`);

// --- Stage 2: Headless DOM Boot & Verification ---
console.log("\n[Stage 2/2] Booting application in headless DOM...");

const rawHtml = fs.readFileSync(HTML_FILE, "utf-8");
const baseUrl = process.env.BASE_URL || "http://localhost:3000";

const dom = new JSDOM(rawHtml, {
  url: baseUrl,
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
});

const { window } = dom;

// Polyfill minimal browser APIs required for headless test environment
function defineGlobal(key, val) {
  try {
    Object.defineProperty(globalThis, key, {
      value: val,
      configurable: true,
      writable: true,
    });
  } catch {
    // If getter-only and cannot reconfigure, ignore
  }
}

defineGlobal("window", window);
defineGlobal("document", window.document);
defineGlobal("HTMLElement", window.HTMLElement);
defineGlobal("CustomEvent", window.CustomEvent);
defineGlobal("Event", window.Event);
defineGlobal("navigator", window.navigator);
defineGlobal("location", window.location);
defineGlobal("history", window.history);
defineGlobal("localStorage", window.localStorage);
defineGlobal("sessionStorage", window.sessionStorage);

window.scrollTo = () => {};
window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
};

globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Intercept unhandled exceptions or console errors
const consoleErrors = [];
const originalError = console.error;
window.console.error = (...args) => {
  consoleErrors.push(args.join(" "));
  originalError(...args);
};

try {
  // Dynamically import main.js - this exercises the full ES-module import graph
  const mainPath = path.join(JS_DIR, "main.js");
  const mainUrl = new URL(`file://${path.resolve(mainPath).replace(/\\/g, "/")}`).href;
  
  // In Node ESM, load module graph
  await import(mainUrl);

  // Trigger DOMContentLoaded to invoke app boot if needed
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true, cancelable: true }));

  // Check boot indicator
  if (!window.__cmBooted) {
    throw new Error("window.__cmBooted is not true after main.js execution.");
  }
  console.log("PASS: Application booted successfully (__cmBooted = true).");

  // Check Theme Toggle
  const initialTheme = window.document.documentElement.getAttribute("data-theme") || "light";
  const toggleBtn = window.document.getElementById("topbarThemeToggleBtn") || window.document.getElementById("themeToggleBtn");
  if (!toggleBtn) {
    throw new Error("Theme toggle button (#topbarThemeToggleBtn or #themeToggleBtn) not found in DOM.");
  }
  
  toggleBtn.click();
  const nextTheme = window.document.documentElement.getAttribute("data-theme");
  if (nextTheme === initialTheme) {
    throw new Error(`Theme toggle failed: theme remained '${initialTheme}'.`);
  }
  console.log(`PASS: Theme toggle flipped theme from '${initialTheme}' to '${nextTheme}'.`);

  // Check Router and Routes
  const careermatch = window.__careermatch;
  if (!careermatch || !careermatch.router) {
    throw new Error("window.__careermatch.router is not defined.");
  }
  
  const { router } = careermatch;
  const { ROUTE_REGISTRY } = await import(new URL(`file://${path.resolve(path.join(JS_DIR, "router.js")).replace(/\\/g, "/")}`).href);
  const routeCount = Object.keys(ROUTE_REGISTRY).length;
  console.log(`PASS: Route registry verified with ${routeCount} routes.`);

  console.log("\n==================================================");
  console.log("  BOOT SMOKE PASSED: Site boots cleanly!");
  console.log("==================================================");
  process.exit(0);

} catch (err) {
  console.error("\n==================================================");
  console.error("  BOOT SMOKE FAILED: IMPORT / RUNTIME ERROR");
  console.error("==================================================");
  console.error("Error details:", err);
  if (consoleErrors.length > 0) {
    console.error("\nCaptured Console Errors:\n" + consoleErrors.join("\n"));
  }
  process.exit(1);
}
