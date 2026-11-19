import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const SCREENSHOT_DIR = path.resolve("screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("Launching Playwright Chromium...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const BASE_URL = "http://127.0.0.1:3000/#/landing";

  async function setupPage(page, theme) {
    await page.addInitScript((t) => {
      localStorage.setItem("cm_theme", t);
      localStorage.setItem("cm_storage_noticed", "true");
      document.documentElement.setAttribute("data-theme", t);
    }, theme);
  }

  // 1. Desktop 1440px - Light Theme
  {
    console.log("Capturing 1440px Light Theme...");
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 }
    });
    await setupPage(page, "light");
    await page.goto(BASE_URL, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "landing-1440-light.png"),
      fullPage: true
    });
    console.log("Saved screenshots/landing-1440-light.png");
    await page.close();
  }

  // 2. Desktop 1440px - Dark Theme
  {
    console.log("Capturing 1440px Dark Theme...");
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 }
    });
    await setupPage(page, "dark");
    await page.goto(BASE_URL, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "landing-1440-dark.png"),
      fullPage: true
    });
    console.log("Saved screenshots/landing-1440-dark.png");
    await page.close();
  }

  // 3. Laptop 1024px
  {
    console.log("Capturing 1024px Laptop Viewport...");
    const page = await browser.newPage({
      viewport: { width: 1024, height: 768 }
    });
    await setupPage(page, "light");
    await page.goto(BASE_URL, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "landing-1024-laptop.png"),
      fullPage: true
    });
    console.log("Saved screenshots/landing-1024-laptop.png");
    await page.close();
  }

  // 4. Mobile 375px
  {
    console.log("Capturing 375px Mobile Viewport...");
    const page = await browser.newPage({
      viewport: { width: 375, height: 812 }
    });
    await setupPage(page, "light");
    await page.goto(BASE_URL, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "landing-375-mobile.png"),
      fullPage: true
    });
    console.log("Saved screenshots/landing-375-mobile.png");
    await page.close();
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
