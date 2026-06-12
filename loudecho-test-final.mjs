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

// Click the stepper div by scene index (0-based)
async function clickStepperAt(page, index) {
  // The stepper items are divs containing a span with the number
  // They have text like "4" (for index 3) and labels like "Review & Approve"
  const stepNum = index + 1;
  // Find the step item div that contains the number
  // Each step is: div.flex.items-center.gap-0.5.flex-1 > div.cursor-pointer containing span with stepNum
  const stepDivs = page.locator('.sticky.top-0 div.cursor-pointer');
  const count = await stepDivs.count();
  console.log(`  Found ${count} cursor-pointer divs in header`);
  for (let i = 0; i < count; i++) {
    const div = stepDivs.nth(i);
    const spanText = await div.locator('span').first().textContent().catch(() => '');
    if (spanText?.trim() === String(stepNum) || spanText?.trim() === '✓') {
      // Check if it contains the right step number in a span
      const allSpans = await div.locator('span').allTextContents();
      console.log(`  Step div ${i}: spans = ${JSON.stringify(allSpans)}`);
      if (allSpans.some(t => t.trim() === String(stepNum))) {
        console.log(`  Clicking step ${stepNum} (div index ${i})`);
        await div.click();
        return true;
      }
    }
  }

  // Fallback: just click "Next scene" arrow enough times
  console.log(`  Fallback: clicking Next arrow ${index} times`);
  for (let i = 0; i < index; i++) {
    const nextBtn = page.locator('button[title="Next scene"]');
    if (await nextBtn.isEnabled().catch(() => false)) {
      await nextBtn.click();
      await wait(300);
    }
  }
  return false;
}

async function logState(page, label) {
  const sceneCounter = await page.locator('.sticky.top-0 span.tabular-nums').textContent().catch(() => 'N/A');
  const headings = await page.locator('h1,h2,h3,h4').allTextContents();
  const buttons = await page.locator('button').allTextContents();
  console.log(`\n--- ${label} ---`);
  console.log('Scene counter:', sceneCounter);
  console.log('Headings:', JSON.stringify(headings));
  console.log('Buttons:', JSON.stringify(buttons.filter(b => b.trim()).slice(0, 25)));
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

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(1000);

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Navigate directly to Scene 4 (index 3)
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== TEST 1: Navigate to Scene 4 via stepper ===');

  // Scenes are 0-indexed in React state; step 4 in the UI = index 3
  // Click the stepper step 4
  await clickStepperAt(page, 3);
  await wait(800);

  await logState(page, 'Scene 4 after stepper click');
  await ss(page, 'T1_scene4_header');

  // Check the scene counter to confirm we're on scene 4
  const sceneCounter4 = await page.locator('.sticky.top-0 span.tabular-nums').textContent().catch(() => 'N/A');
  console.log(`Scene counter shows: "${sceneCounter4}"`);

  // Check for any heading mentioning "Scene 4" vs the actual scene name
  const scene4Heading = await page.locator('h1,h2').first().textContent().catch(() => 'N/A');
  console.log(`Scene 4 main heading: "${scene4Heading}"`);

  // Check what tabs are rendered
  const tabs = await page.locator('[role="tab"], [class*="tab-"], [class*="Tab"]').allTextContents();
  console.log('Tabs:', JSON.stringify(tabs));

  // Check stats/cards in scene 4
  const statCards = await page.locator('[class*="stat"], [class*="metric"]').allTextContents();
  console.log('Stat cards:', JSON.stringify(statCards.slice(0, 8)));

  // Full page screenshot of scene 4
  await ss(page, 'T1b_scene4_full');

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Scene 4 → Scene 5 via "Run Simulation →" button
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== TEST 2: Navigate to Scene 5 via "Run Simulation →" ===');

  // Look for the Run Simulation button (it's a CTA at the bottom of scene 4)
  let foundSimBtn = false;
  const allBtns = await page.locator('button').all();
  for (const btn of allBtns) {
    const txt = await btn.textContent().catch(() => '');
    const visible = await btn.isVisible().catch(() => false);
    if (visible && (txt?.toLowerCase().includes('simulation') || txt?.toLowerCase().includes('run sim'))) {
      console.log(`Found simulation CTA: "${txt.trim()}"`);
      await btn.click();
      foundSimBtn = true;
      break;
    }
  }

  if (!foundSimBtn) {
    // Try "→" buttons or next buttons
    console.log('No simulation button found, trying next arrow...');
    const allVisible = await page.locator('button').all();
    for (const btn of allVisible) {
      const txt = await btn.textContent().catch(() => '');
      if (txt?.includes('→') && await btn.isVisible().catch(() => false)) {
        console.log(`Clicking "→" button: "${txt.trim()}"`);
        await btn.click();
        foundSimBtn = true;
        break;
      }
    }
  }

  if (!foundSimBtn) {
    // Jump directly with the next arrow in the stepper header
    console.log('Jumping to scene 5 via stepper arrow');
    await clickStepperAt(page, 4);
  }
  await wait(1000);

  await logState(page, 'Scene 5 - idle state');
  await ss(page, 'T2a_scene5_idle');

  // Find "Simulate 500 Bid Events" button
  let simBidBtn = null;
  const allBtns2 = await page.locator('button').all();
  for (const btn of allBtns2) {
    const txt = await btn.textContent().catch(() => '');
    const visible = await btn.isVisible().catch(() => false);
    if (visible && txt?.trim()) {
      console.log(`  Visible button: "${txt.trim().slice(0, 60)}"`);
    }
    if (visible && (txt?.includes('500') || txt?.toLowerCase().includes('bid') || txt?.toLowerCase().includes('simulate'))) {
      simBidBtn = btn;
      console.log(`Found simulate bid button: "${txt.trim()}"`);
    }
  }

  if (simBidBtn) {
    await simBidBtn.click();
    await wait(500);
    await ss(page, 'T2b_scene5_loading');
    console.log('Clicked simulate bid events, waiting for completion...');
    await wait(4000);
    await ss(page, 'T2c_scene5_done');

    const tableRows = await page.locator('table tr').count();
    console.log(`Table rows: ${tableRows}`);
    const ruleElements = await page.locator('[class*="rule"]').count();
    console.log(`Rule elements: ${ruleElements}`);

    await logState(page, 'Scene 5 - done state');
  } else {
    console.log('WARNING: Could not find "Simulate 500 Bid Events" button');
    await ss(page, 'T2b_scene5_no_button');
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Scene 5 → Scene 6 via "Explore User Journey →"
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== TEST 3: Navigate to Scene 6 via "Explore User Journey →" ===');

  let foundJourneyBtn = false;
  const allBtns3 = await page.locator('button').all();
  for (const btn of allBtns3) {
    const txt = await btn.textContent().catch(() => '');
    const visible = await btn.isVisible().catch(() => false);
    if (visible && (txt?.toLowerCase().includes('journey') || txt?.toLowerCase().includes('explore'))) {
      console.log(`Found journey CTA: "${txt.trim()}"`);
      await btn.click();
      foundJourneyBtn = true;
      break;
    }
  }

  if (!foundJourneyBtn) {
    console.log('No journey button, jumping to scene 6 via stepper');
    await clickStepperAt(page, 5);
  }
  await wait(1000);

  await logState(page, 'Scene 6 - initial');
  await ss(page, 'T3a_scene6_initial');

  // Click "Next touchpoint →" twice
  for (let i = 1; i <= 2; i++) {
    let clicked = false;
    const allBtnsLoop = await page.locator('button').all();
    for (const btn of allBtnsLoop) {
      const txt = await btn.textContent().catch(() => '');
      const visible = await btn.isVisible().catch(() => false);
      if (visible && (txt?.toLowerCase().includes('touchpoint') || txt?.toLowerCase().includes('next touch'))) {
        console.log(`Clicking touchpoint ${i}: "${txt.trim()}"`);
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // Try arrow buttons in the content area (not stepper)
      console.log(`Could not find touchpoint button ${i}, trying content area arrows...`);
      const contentBtns = await page.locator('main button, [class*="scene"] button, [class*="content"] button').all();
      for (const btn of contentBtns) {
        const txt = await btn.textContent().catch(() => '');
        if (txt?.includes('→') && await btn.isVisible().catch(() => false)) {
          console.log(`Clicking content arrow: "${txt.trim().slice(0, 60)}"`);
          await btn.click();
          break;
        }
      }
    }
    await wait(800);
    await ss(page, `T3b_scene6_touchpoint_${i}`);
  }

  await logState(page, 'Scene 6 - after 2 touchpoints');
  await ss(page, 'T3c_scene6_final_touchpoint');

  // Check for quote card
  const quoteText = await page.locator('[class*="quote"], blockquote, [class*="testimonial"], [class*="persona"]').allTextContents();
  console.log('Quote/persona card text:', JSON.stringify(quoteText.slice(0, 5)));

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Scene 6 → Scene 7 via "Open Operator Chat →"
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== TEST 4: Navigate to Scene 7 via "Open Operator Chat →" ===');

  let foundChatBtn = false;
  const allBtns4 = await page.locator('button').all();
  for (const btn of allBtns4) {
    const txt = await btn.textContent().catch(() => '');
    const visible = await btn.isVisible().catch(() => false);
    if (visible && (txt?.toLowerCase().includes('operator') || txt?.toLowerCase().includes('chat') || txt?.toLowerCase().includes('open operator'))) {
      console.log(`Found chat CTA: "${txt.trim()}"`);
      await btn.click();
      foundChatBtn = true;
      break;
    }
  }

  if (!foundChatBtn) {
    console.log('No chat button, jumping to scene 7 via stepper');
    await clickStepperAt(page, 6);
  }
  await wait(1000);

  await logState(page, 'Scene 7 - initial');
  await ss(page, 'T4a_scene7_initial');

  // Find and click a suggested query
  // They might be chip/pill buttons or styled divs
  let queryClicked = false;

  // First check for any "suggestion" or "query" elements
  const suggestionSelectors = [
    '[class*="suggest"]',
    '[class*="query"]',
    '[class*="chip"]',
    '[class*="pill"]',
    '[class*="example"]',
    '[class*="prompt"]',
  ];

  for (const sel of suggestionSelectors) {
    const elements = page.locator(sel);
    const count = await elements.count();
    if (count > 0) {
      console.log(`Found ${count} elements matching "${sel}"`);
      const first = elements.first();
      const txt = await first.textContent();
      const visible = await first.isVisible().catch(() => false);
      if (visible) {
        console.log(`Clicking suggestion: "${txt?.trim().slice(0, 80)}"`);
        await first.click();
        queryClicked = true;
        break;
      }
    }
  }

  if (!queryClicked) {
    // Try clicking any button that looks like a query (not nav, not "→")
    console.log('No suggestion elements found, scanning all buttons for query-like text...');
    const allBtns5 = await page.locator('button').all();
    for (const btn of allBtns5) {
      const txt = await btn.textContent().catch(() => '');
      const visible = await btn.isVisible().catch(() => false);
      // Suggested queries are typically longer text (10-120 chars), not nav items
      if (visible && txt && txt.trim().length >= 15 && txt.trim().length <= 120) {
        if (!txt.includes('→') && !txt.match(/^\d+$/) && !txt.includes('Previous') && !txt.includes('Next')) {
          console.log(`Clicking query-like button: "${txt.trim().slice(0, 80)}"`);
          await btn.click();
          queryClicked = true;
          break;
        }
      }
    }
  }

  if (queryClicked) {
    console.log('Waiting for chat response (up to 5s)...');
    await wait(5000);
    await ss(page, 'T4b_scene7_response');

    const rightPanel = await page.evaluate(() => {
      // Check right portion of viewport for any populated content
      const allText = document.body.innerText;
      return allText.slice(0, 2000);
    });
    console.log('Page text after query (first 500 chars):', rightPanel.slice(0, 500));
  } else {
    console.log('WARNING: No suggested queries found to click');
    // Dump all visible buttons
    const allBtns6 = await page.locator('button').all();
    for (const btn of allBtns6) {
      const txt = await btn.textContent().catch(() => '');
      const visible = await btn.isVisible().catch(() => false);
      if (visible && txt?.trim()) {
        console.log(`  Button: "${txt.trim().slice(0, 80)}"`);
      }
    }
  }

  await ss(page, 'T4c_scene7_final');

  // ─────────────────────────────────────────────────────────────
  // CONSOLE ERRORS SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== CONSOLE ERRORS ===');
  if (errors.length === 0) {
    console.log('No console errors.');
  } else {
    console.log(`${errors.length} error(s):`);
    errors.forEach(e => console.log(` • ${e}`));
  }

  await browser.close();
  console.log('\n=== Done ===');
})();
