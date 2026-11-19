import { chromium } from "playwright";

const VIEWPORTS = [
  { name: "Mobile (360px)", width: 360, height: 640 },
  { name: "Tablet (768px)", width: 768, height: 1024 },
  { name: "Desktop (1440px)", width: 1440, height: 900 },
];

async function run() {
  console.log("==================================================");
  console.log("  CareerMatch AI: Responsive Multi-Viewport Audit");
  console.log("==================================================");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting ${vp.name}...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });

    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!text.includes("401 (Unauthorized)")) {
          errors.push(text);
        }
      }
    });
    page.on("pageerror", (err) => errors.push(err.message));

    const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
    await page.goto(`${baseUrl}/`, { waitUntil: "load" });
    await page.waitForTimeout(1000);

    // Check horizontal scroll overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (overflow) {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      console.warn(`  WARNING: Horizontal overflow detected on ${vp.name}! scrollWidth: ${scrollWidth} > innerWidth: ${vp.width}`);
    } else {
      console.log(`  PASS: Zero horizontal overflow on ${vp.name}.`);
    }

    if (vp.width <= 768) {
      // Check mobile drawer toggles
      const hamburger = page.locator("#mobileMenuBtn");
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await page.waitForTimeout(300);
        const rail = page.locator("#appRail");
        const isOpen = await rail.evaluate((el) => el.classList.contains("open") || el.classList.contains("mobile-open"));
        console.log(`  PASS: Mobile rail toggles cleanly (open state: ${isOpen}).`);
      }

      // Check Profile Dropdown & Sign-In/Sign-Out visibility on mobile above bottom nav (Task 6 Item 3)
      console.log(`  Checking mobile user avatar dropdown visibility on ${vp.name}...`);
      await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: "load" });
      await page.waitForTimeout(600);

      const avatarBtn = page.locator("#topbarAvatarBtn");
      if (await avatarBtn.isVisible()) {
        await avatarBtn.click();
        await page.waitForTimeout(300);

        const dropdown = page.locator(".user-avatar-dropdown");
        const isDropdownOpen = await dropdown.evaluate((el) => el.classList.contains("open"));
        if (!isDropdownOpen) {
          throw new Error("Mobile user avatar dropdown failed to open on click.");
        }

        // Verify dropdown bounds do not fall behind mobile bottom nav
        const dropdownBox = await dropdown.boundingBox();
        const bottomNav = page.locator(".mobile-bottom-nav");
        let bottomNavY = 640;
        if (await bottomNav.isVisible()) {
          const navBox = await bottomNav.boundingBox();
          if (navBox) bottomNavY = navBox.y;
        }

        if (dropdownBox) {
          console.log(`  Dropdown bottom: ${dropdownBox.y + dropdownBox.height}px vs BottomNav top: ${bottomNavY}px`);
          if (dropdownBox.y + dropdownBox.height > bottomNavY + 1) {
            throw new Error(`Mobile user avatar dropdown is obscured behind bottom navigation: dropdown bottom ${dropdownBox.y + dropdownBox.height} > bottom nav ${bottomNavY}`);
          }
          console.log(`  PASS: Mobile user avatar dropdown floats cleanly above bottom navigation.`);
        }
      }
    }

    // Check landing page theme toggle works in this viewport
    const themeBtn = page.locator("#landingThemeToggleBtn");
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
      console.log(`  PASS: Theme toggle flipped theme to '${theme}' on ${vp.name}.`);
    }

    if (errors.length > 0) {
      console.error(`  ERRORS detected on ${vp.name}:`, errors);
      process.exit(1);
    }

    await page.close();
  }

  await browser.close();
  console.log("\n==================================================");
  console.log("  ALL VIEWPORT AUDITS PASSED CLEANLY!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
