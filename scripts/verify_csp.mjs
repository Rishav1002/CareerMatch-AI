import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const page = await browser.newPage();

  const cspViolations = [];
  const consoleErrors = [];

  // Expose binding to catch SecurityPolicyViolationEvent in browser context
  await page.exposeFunction("reportCSPViolation", (violation) => {
    cspViolations.push(violation);
  });

  // Inject listener before document scripts execute
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      window.reportCSPViolation({
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
        sample: e.sample,
      });
    });
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  console.log("Navigating to http://localhost:3000/ ...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  console.log("Navigating to http://localhost:3000/#/auth ...");
  await page.goto("http://localhost:3000/#/auth", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Check form submit handler prevention: press Enter in email input
  const emailInput = page.locator("#authPageEmailInput");
  if (await emailInput.isVisible()) {
    await emailInput.fill("test@example.com");
    await emailInput.press("Enter");
    await page.waitForTimeout(500);
  }

  // Check URL didn't navigate to /?email=test%40example.com
  const currentUrl = page.url();
  console.log("Current URL after Enter:", currentUrl);
  if (currentUrl.includes("?")) {
    throw new Error(`Form submitted natively! Query string present: ${currentUrl}`);
  }

  console.log("CSP Violations detected:", cspViolations.length);
  if (cspViolations.length > 0) {
    console.error("CSP Violations:", JSON.stringify(cspViolations, null, 2));
  }

  console.log("Console Errors detected:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error("Console Errors:", consoleErrors);
  }

  await browser.close();

  if (cspViolations.length > 0) {
    console.error("FAILED: CSP violations were detected!");
    process.exit(1);
  }

  console.log("SUCCESS: Zero CSP violations detected!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
