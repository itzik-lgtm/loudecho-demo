import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:5173';
const SS_DIR = '/tmp/loudecho-screenshots';
const errors = [];

async function ss(page, name) {
  const path = `${SS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`[SS] ${name} -> ${path}`);
  return path;
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function logState(page, label) {
  const headings = await page.locator('h1,h2,h3,h4').allTextContents();
  const buttons = await page.locator('button').allTextContents();
  console.log(`\n--- ${label} ---`);
  console.log('Headings:', JSON.stringify(headings));
  console.log('Buttons:', JSON.stringify(buttons.slice(0, 20)));
}

(async () => {
  await mkdir(SS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 1.5
  });
  const page = await ctx.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Navigate to Scene 4 directly via stepper
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== NAVIGATING TO SCENE 4 VIA STEPPER ===');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(1000);

  // Look for stepper — typically numbered buttons at the top
  await logState(page, 'Initial load');

  // Find the stepper step buttons
  const stepperButtons = page.locator('[class*="step"], [class*="stepper"], nav button, [role="tab"]');
  const stepperCount = await stepperButtons.count();
  console.log(`Stepper buttons found: ${stepperCount}`);

  // Try to find step 4 specifically
  let clickedStep4 = false;

  // Try aria-label or data attributes
  const step4Candidates = [
    page.locator('button:has-text("4")').first(),
    page.locator('[data-step="4"]').first(),
    page.locator('[aria-label*="4"]').first(),
    page.locator('[class*="step"]:has-text("4")').first(),
  ];

  for (const candidate of step4Candidates) {
    if (await candidate.isVisible().catch(() => false)) {
      const txt = await candidate.textContent();
      console.log(`Found step 4 button with text: "${txt}"`);
      await candidate.click();
      await wait(1000);
      clickedStep4 = true;
      break;
    }
  }

  if (!clickedStep4) {
    // Try clicking all buttons to find the one that navigates to scene 4
    console.log('Trying to find step 4 by inspecting all visible buttons...');
    const allBtns = await page.locator('button').all();
    for (const btn of allBtns) {
      const txt = await btn.textContent().catch(() => '');
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible && txt?.trim() === '4') {
        console.log('Found button with text "4", clicking...');
        await btn.click();
        await wait(1000);
        clickedStep4 = true;
        break;
      }
    }
  }

  if (!clickedStep4) {
    console.log('WARNING: Could not find step 4 button directly. Checking page structure...');
    // Dump the page's top-level structure for debugging
    const topStructure = await page.evaluate(() => {
      const nav = document.querySelector('nav, header, [class*="step"], [class*="nav"]');
      return nav ? nav.innerHTML.slice(0, 2000) : 'No nav found';
    });
    console.log('Top structure:', topStructure.slice(0, 500));
  }

  await logState(page, 'After clicking step 4');
  await ss(page, 'E1_scene4_header');

  // Check Scene 4 header
  const scene4Heading = await page.locator('h1,h2').first().textContent().catch(() => 'N/A');
  console.log('Scene 4 heading:', scene4Heading);

  // Check what tabs are shown
  const tabs = await page.locator('[role="tab"], [class*="tab"]').allTextContents();
  console.log('Tabs:', JSON.stringify(tabs));

  // Check stats
  const stats = await page.locator('[class*="stat"], [class*="metric"], [class*="card"]').allTextContents();
  console.log('Stats/metrics visible:', JSON.stringify(stats.slice(0, 10)));

  // Screenshot the full scene 4
  await ss(page, 'E2_scene4_full');

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Scene 4 → Scene 5 via "Run Simulation →"
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== NAVIGATING TO SCENE 5 ===');

  const runSimBtn = page.locator('button:has-text("Run Simulation"), button:has-text("Simulation")').first();
  if (await runSimBtn.isVisible().catch(() => false)) {
    const txt = await runSimBtn.textContent();
    console.log(`Clicking: "${txt}"`);
    await runSimBtn.click();
    await wait(1000);
  } else {
    // Try arrow button or next button
    const nextBtns = await page.locator('button').all();
    for (const btn of nextBtns) {
      const txt = await btn.textContent().catch(() => '');
      if (txt?.includes('→') || txt?.toLowerCase().includes('next') || txt?.toLowerCase().includes('simulation')) {
        const visible = await btn.isVisible().catch(() => false);
        if (visible) {
          console.log(`Clicking next button: "${txt}"`);
          await btn.click();
          await wait(1000);
          break;
        }
      }
    }
  }

  await logState(page, 'Scene 5 - idle state');
  await ss(page, 'E3_scene5_idle');

  // Look for "Simulate 500 Bid Events" button
  const simBidBtn = page.locator('button:has-text("Simulate"), button:has-text("500"), button:has-text("Bid")').first();
  if (await simBidBtn.isVisible().catch(() => false)) {
    const txt = await simBidBtn.textContent();
    console.log(`Found simulation button: "${txt}"`);
    await simBidBtn.click();

    // Screenshot while loading
    await wait(500);
    await ss(page, 'E4_scene5_loading');

    // Wait for completion - look for table or "done" state
    console.log('Waiting for simulation to complete...');
    await wait(3000);
    await ss(page, 'E5_scene5_done_with_table');

    // Check for bid event table
    const tableRows = await page.locator('table tr, [class*="table"] tr, [class*="row"]').count();
    console.log(`Table rows found: ${tableRows}`);

    // Check for rule breakdown
    const ruleBreakdown = await page.locator('[class*="rule"], [class*="breakdown"]').allTextContents();
    console.log('Rule breakdown elements:', JSON.stringify(ruleBreakdown.slice(0, 5)));

    await logState(page, 'Scene 5 - done state');
  } else {
    console.log('WARNING: Could not find simulation button');
    const allBtns = await page.locator('button').allTextContents();
    console.log('All buttons:', JSON.stringify(allBtns));
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Scene 5 → Scene 6 via "Explore User Journey →"
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== NAVIGATING TO SCENE 6 ===');

  const journeyBtn = page.locator('button:has-text("User Journey"), button:has-text("Explore User Journey"), button:has-text("Journey")').first();
  if (await journeyBtn.isVisible().catch(() => false)) {
    const txt = await journeyBtn.textContent();
    console.log(`Clicking: "${txt}"`);
    await journeyBtn.click();
    await wait(1000);
  } else {
    // Try next/arrow button
    const nextBtns = await page.locator('button').all();
    for (const btn of nextBtns) {
      const txt = await btn.textContent().catch(() => '');
      if (txt?.includes('→') || txt?.toLowerCase().includes('journey') || txt?.toLowerCase().includes('explore')) {
        const visible = await btn.isVisible().catch(() => false);
        if (visible) {
          console.log(`Clicking: "${txt}"`);
          await btn.click();
          await wait(1000);
          break;
        }
      }
    }
  }

  await logState(page, 'Scene 6 initial');
  await ss(page, 'E6_scene6_initial');

  // Click "Next touchpoint →" twice
  for (let i = 1; i <= 2; i++) {
    const nextTouchBtn = page.locator('button:has-text("Next touchpoint"), button:has-text("touchpoint"), button:has-text("Next →")').first();
    if (await nextTouchBtn.isVisible().catch(() => false)) {
      const txt = await nextTouchBtn.textContent();
      console.log(`Clicking touchpoint ${i}: "${txt}"`);
      await nextTouchBtn.click();
      await wait(800);
    } else {
      // Try arrow-only button in lower area
      const allVisible = await page.locator('button').all();
      for (const btn of allVisible) {
        const txt = await btn.textContent().catch(() => '');
        if (txt?.includes('→') && await btn.isVisible().catch(() => false)) {
          console.log(`Clicking arrow button for touchpoint ${i}: "${txt}"`);
          await btn.click();
          await wait(800);
          break;
        }
      }
    }
  }

  await logState(page, 'Scene 6 after 2 touchpoints');
  await ss(page, 'E7_scene6_after_2_touchpoints');

  // Check for quote card
  const quoteCard = await page.locator('[class*="quote"], blockquote, [class*="testimonial"]').allTextContents();
  console.log('Quote card text:', JSON.stringify(quoteCard));

  // ─────────────────────────────────────────────────────────────
  // STEP 4: Scene 6 → Scene 7 via "Open Operator Chat →"
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== NAVIGATING TO SCENE 7 ===');

  const chatBtn = page.locator('button:has-text("Operator Chat"), button:has-text("Open Operator Chat"), button:has-text("Chat")').first();
  if (await chatBtn.isVisible().catch(() => false)) {
    const txt = await chatBtn.textContent();
    console.log(`Clicking: "${txt}"`);
    await chatBtn.click();
    await wait(1000);
  } else {
    const nextBtns = await page.locator('button').all();
    for (const btn of nextBtns) {
      const txt = await btn.textContent().catch(() => '');
      if (txt?.includes('→') || txt?.toLowerCase().includes('chat') || txt?.toLowerCase().includes('operator')) {
        const visible = await btn.isVisible().catch(() => false);
        if (visible) {
          console.log(`Clicking: "${txt}"`);
          await btn.click();
          await wait(1000);
          break;
        }
      }
    }
  }

  await logState(page, 'Scene 7 initial');
  await ss(page, 'E8_scene7_initial');

  // Look for suggested queries
  const suggestedQueries = page.locator('[class*="suggest"], [class*="query"], button[class*="chip"], [class*="pill"], [class*="example"]');
  const suggestCount = await suggestedQueries.count();
  console.log(`Suggested query buttons found: ${suggestCount}`);

  let clickedQuery = false;
  if (suggestCount > 0) {
    const firstQuery = suggestedQueries.first();
    const txt = await firstQuery.textContent();
    console.log(`Clicking suggested query: "${txt}"`);
    await firstQuery.click();
    clickedQuery = true;
  } else {
    // Try to find any clickable chip/pill looking buttons
    const allBtns = await page.locator('button').all();
    for (const btn of allBtns) {
      const txt = await btn.textContent().catch(() => '');
      const visible = await btn.isVisible().catch(() => false);
      if (visible && txt && txt.trim().length > 10 && txt.trim().length < 100) {
        // Skip navigation buttons
        if (!txt.includes('→') && !txt.includes('Scene') && !['1','2','3','4','5','6','7'].includes(txt.trim())) {
          console.log(`Clicking query-like button: "${txt.trim()}"`);
          await btn.click();
          clickedQuery = true;
          break;
        }
      }
    }
  }

  if (clickedQuery) {
    // Wait for response to appear
    console.log('Waiting for chat response...');
    await wait(3000);
    await ss(page, 'E9_scene7_response');

    // Check right panel population
    const rightPanel = await page.locator('[class*="right"], [class*="panel"], [class*="sidebar"], [class*="detail"]').allTextContents();
    console.log('Right panel content:', JSON.stringify(rightPanel.slice(0, 5)));
  } else {
    console.log('WARNING: No suggested queries found to click');
    const allBtns = await page.locator('button').allTextContents();
    console.log('All buttons on scene 7:', JSON.stringify(allBtns));
  }

  await ss(page, 'E10_scene7_final');

  // ─────────────────────────────────────────────────────────────
  // CONSOLE ERRORS SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== CONSOLE ERRORS ===');
  if (errors.length === 0) {
    console.log('No console errors detected.');
  } else {
    console.log(`${errors.length} error(s):`);
    errors.forEach(e => console.log(` • ${e}`));
  }

  await browser.close();
  console.log('\nDone.');
})();
