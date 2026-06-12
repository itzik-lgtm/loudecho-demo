import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const SS_DIR = '/tmp/loudecho-screenshots';
const errors = [];

async function ss(page, name) {
  const path = `${SS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`[SS] ${name} -> ${path}`);
  return path;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[pageerror] ${err.message}`);
  });

  // ── SCENE 1: Brief Input ──────────────────────────────────────────────
  console.log('\n=== SCENE 1: Brief Input ===');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await ss(page, '01_scene1_initial');

  // Inspect what's on the page
  const h1 = await page.locator('h1').allTextContents();
  const h2 = await page.locator('h2').allTextContents();
  const buttons = await page.locator('button').allTextContents();
  console.log('H1:', h1);
  console.log('H2:', h2);
  console.log('Buttons:', buttons);

  // Look for text areas / inputs
  const textareas = await page.locator('textarea').count();
  const inputs = await page.locator('input').count();
  console.log(`Textareas: ${textareas}, Inputs: ${inputs}`);

  // Screenshot after a moment to see full render
  await ss(page, '02_scene1_loaded');

  // ── Click to Scene 2 ──────────────────────────────────────────────────
  console.log('\n=== Navigating to Scene 2 ===');

  // Try common CTA buttons
  const ctaSelectors = [
    'button:has-text("Generate")',
    'button:has-text("Start")',
    'button:has-text("Submit")',
    'button:has-text("Next")',
    'button:has-text("Proceed")',
    'button:has-text("Run")',
    'button:has-text("Go")',
    '[data-scene="2"]',
    'button[type="submit"]',
  ];

  let clicked = false;
  for (const sel of ctaSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) {
      console.log(`Clicking: ${sel}`);
      await btn.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    // Fallback: click the first visible button
    const firstBtn = page.locator('button').first();
    if (await firstBtn.isVisible().catch(() => false)) {
      const txt = await firstBtn.textContent();
      console.log(`Fallback click first button: "${txt}"`);
      await firstBtn.click();
      clicked = true;
    }
  }

  await page.waitForTimeout(800);
  await ss(page, '03_scene2_streaming_early');

  // Wait a bit for streaming to be visible
  await page.waitForTimeout(2000);
  await ss(page, '04_scene2_streaming_mid');

  // Wait for judging phase
  await page.waitForTimeout(3000);
  await ss(page, '05_scene2_judging');

  // Wait for ready state (longer wait)
  await page.waitForTimeout(5000);
  await ss(page, '06_scene2_ready');

  // Check for bucket sidebar / badges
  const sidebarText = await page.locator('aside, [class*="sidebar"], [class*="Sidebar"]').allTextContents().catch(() => []);
  console.log('Sidebar text snippets:', sidebarText.map(t => t.slice(0, 100)));

  const badges = await page.locator('[class*="badge"], [class*="Badge"], [class*="tag"], [class*="Tag"]').count();
  console.log(`Badge/tag elements found: ${badges}`);

  const buttonsAfterScene2 = await page.locator('button').allTextContents();
  console.log('Buttons in Scene 2:', buttonsAfterScene2);

  // Extra wait in case it's still loading
  await page.waitForTimeout(4000);
  await ss(page, '07_scene2_final_state');

  // ── Navigate to Scene 3 ──────────────────────────────────────────────
  console.log('\n=== Navigating to Scene 3 ===');

  const scene3Selectors = [
    'button:has-text("Proceed to Review")',
    'button:has-text("Review")',
    'button:has-text("Proceed")',
    'button:has-text("Next")',
    'button:has-text("Continue")',
    'a:has-text("Review")',
    'a:has-text("Proceed")',
  ];

  let clickedScene3 = false;
  for (const sel of scene3Selectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) {
      const txt = await btn.textContent();
      console.log(`Clicking scene3 CTA: "${txt}" via ${sel}`);
      await btn.click();
      clickedScene3 = true;
      break;
    }
  }

  if (!clickedScene3) {
    console.log('Could not find "Proceed to Review" button');
    const allBtns = await page.locator('button').allTextContents();
    console.log('Available buttons:', allBtns);
  }

  await page.waitForTimeout(1500);
  await ss(page, '08_scene3_bulk_approve');

  // Inspect scene 3 state
  const scene3H = await page.locator('h1, h2, h3').allTextContents();
  console.log('Scene 3 headings:', scene3H);
  const scene3Btns = await page.locator('button').allTextContents();
  console.log('Scene 3 buttons:', scene3Btns);

  // ── Bulk approve step ─────────────────────────────────────────────────
  // Look for approve all / select all
  const approveSelectors = [
    'button:has-text("Approve All")',
    'button:has-text("Select All")',
    'button:has-text("Approve")',
    'input[type="checkbox"]',
  ];
  for (const sel of approveSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      console.log(`Found approve element: ${sel}`);
      break;
    }
  }
  await ss(page, '09_scene3_bulk_approve_detail');

  // ── Cluster review step ───────────────────────────────────────────────
  // Look for clusters / groups to click
  const clusterSelectors = [
    '[class*="cluster"]',
    '[class*="Cluster"]',
    '[class*="group"]',
    '[class*="Group"]',
    '[class*="bucket"]',
    '[class*="Bucket"]',
    'li[class*="card"]',
    '[role="listitem"]',
  ];

  let clickedCluster = false;
  for (const sel of clusterSelectors) {
    const els = page.locator(sel);
    const count = await els.count();
    if (count > 0) {
      console.log(`Found ${count} elements matching: ${sel}`);
      await els.first().click().catch(() => {});
      clickedCluster = true;
      await page.waitForTimeout(800);
      await ss(page, '10_scene3_cluster_clicked');
      break;
    }
  }

  if (!clickedCluster) {
    // Try clicking first list item or card
    const cards = page.locator('[class*="card"], [class*="Card"], li').first();
    if (await cards.isVisible().catch(() => false)) {
      await cards.click().catch(() => {});
      await page.waitForTimeout(800);
      await ss(page, '10_scene3_cluster_clicked');
    }
  }

  // Screenshot cluster detail
  await ss(page, '11_scene3_cluster_detail');

  // Navigate through scene 3 steps if there are "Next" or step buttons
  const nextBtns = [
    'button:has-text("Next")',
    'button:has-text("Continue")',
    'button:has-text("Proceed")',
    'button:has-text("Done")',
    'button:has-text("Finish")',
    'button:has-text("Summary")',
  ];

  for (let i = 0; i < 3; i++) {
    for (const sel of nextBtns) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        const txt = await btn.textContent();
        console.log(`Step through: clicking "${txt}"`);
        await btn.click();
        await page.waitForTimeout(1200);
        await ss(page, `12_scene3_step${i+1}_after_${txt?.replace(/\s+/g, '_').slice(0,20)}`);
        break;
      }
    }
  }

  // Final summary screenshot
  await ss(page, '13_scene3_final_summary');
  const finalH = await page.locator('h1, h2, h3').allTextContents();
  console.log('Final headings:', finalH);

  // ── Console errors report ─────────────────────────────────────────────
  console.log('\n=== CONSOLE ERRORS ===');
  if (errors.length === 0) {
    console.log('None detected');
  } else {
    errors.forEach(e => console.log(e));
  }

  await browser.close();
  console.log('\nDone. Screenshots in', SS_DIR);
})();
