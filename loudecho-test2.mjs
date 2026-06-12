import { chromium } from 'playwright';

const SS_DIR = '/tmp/loudecho-screenshots';

async function ss(page, name) {
  const path = `${SS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`[SS] ${name}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // ─── SCENE 1 ────────────────────────────────────────────────
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await ss(page, 'S1_brief_input');

  // Scroll to bottom to see full scene 1
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await ss(page, 'S1_brief_input_bottom');

  // ─── SCENE 2: Click Generate ─────────────────────────────────
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('button:has-text("Generate")').first().click();
  await page.waitForTimeout(600);
  await ss(page, 'S2_streaming_600ms');

  await page.waitForTimeout(2000);
  await ss(page, 'S2_streaming_2600ms');

  // Wait for counter to stop climbing (judging phase)
  let lastCount = '';
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(1000);
    const countText = await page.locator('[class*="count"], [class*="Count"]').first().textContent().catch(() => '');
    if (countText === lastCount && countText !== '') {
      console.log('Counter stable at:', countText);
      break;
    }
    lastCount = countText;
  }
  await ss(page, 'S2_judging_phase');

  // Wait for "Proceed to Review" or any completion state
  await page.waitForTimeout(5000);
  await ss(page, 'S2_after_judging_wait');

  // Check sidebar and bucket badges
  const sidebarEl = page.locator('aside, [class*="sidebar"], [class*="Sidebar"], [class*="panel"]');
  const sidebarCount = await sidebarEl.count();
  console.log('Sidebar elements:', sidebarCount);

  const allText = await page.evaluate(() => document.body.innerText);
  const hasProceed = allText.includes('Proceed');
  const hasReview = allText.includes('Review');
  console.log('Has "Proceed":', hasProceed, 'Has "Review":', hasReview);

  // Find any bucket-related elements
  const bucketEls = await page.locator('[class*="bucket"], [class*="Bucket"]').count();
  const badgeEls = await page.locator('[class*="badge"], [class*="Badge"]').count();
  console.log('Bucket els:', bucketEls, 'Badge els:', badgeEls);

  // Try scrolling down to find CTA
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await ss(page, 'S2_scrolled_bottom');

  // Log all visible text to find CTA
  const bodyText = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a')).map(el => el.textContent?.trim()).filter(Boolean);
  });
  console.log('All button/link text:', JSON.stringify(bodyText));

  // Try to find "Proceed to Review" button anywhere
  await page.evaluate(() => window.scrollTo(0, 0));

  // Look for sidebar bucket summary
  const sidebar = await page.locator('[class*="sidebar"], aside, [class*="panel"], [class*="Panel"]').allTextContents().catch(() => []);
  console.log('Sidebar contents:', sidebar.map(t => t.slice(0, 200)));

  // Screenshot at full width zoomed in on left sidebar
  const leftPanel = page.locator('[class*="sidebar"], aside').first();
  if (await leftPanel.isVisible().catch(() => false)) {
    await leftPanel.screenshot({ path: `${SS_DIR}/S2_sidebar_zoom.png` });
    console.log('[SS] S2_sidebar_zoom');
  }

  // Zoom in on main content
  await ss(page, 'S2_full_final');

  // ─── Navigate to Scene 3 ────────────────────────────────────
  // Try clicking header nav "Resolve & Approve" or "Review & Approve"
  const navItems = ['Resolve & Approve', 'Review & Approve', '3', '4'];
  for (const item of navItems) {
    const btn = page.locator(`nav button:has-text("${item}"), [class*="nav"] button:has-text("${item}"), button:has-text("Resolve"), button:has-text("Proceed")`).first();
    if (await btn.isVisible().catch(() => false)) {
      const txt = await btn.textContent();
      console.log(`Nav click: "${txt}"`);
      await btn.click();
      break;
    }
  }

  // Also try header nav links
  const headerLinks = await page.locator('header button, [class*="nav"] button, [role="navigation"] button').allTextContents();
  console.log('Header nav buttons:', headerLinks);

  // Click "3 Resolve & Approve" in top nav
  const resolveBtn = page.locator('button:has-text("Resolve")');
  if (await resolveBtn.isVisible().catch(() => false)) {
    await resolveBtn.click();
    console.log('Clicked Resolve & Approve nav');
    await page.waitForTimeout(1500);
    await ss(page, 'S3_from_nav');
  }

  await page.waitForTimeout(1000);
  const scene3Headings = await page.locator('h1,h2,h3').allTextContents();
  console.log('Current headings:', scene3Headings);
  const scene3Buttons = await page.locator('button').allTextContents();
  console.log('Current buttons:', scene3Buttons);
  await ss(page, 'S3_initial');

  // ─── Console errors ───────────────────────────────────────────
  console.log('\n=== CONSOLE ERRORS ===');
  if (consoleErrors.length === 0) console.log('None');
  else consoleErrors.forEach(e => console.log(e));

  await browser.close();
})();
