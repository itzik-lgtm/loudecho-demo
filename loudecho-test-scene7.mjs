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
  const stepNum = index + 1;
  const stepDivs = page.locator('.sticky.top-0 div.cursor-pointer');
  const count = await stepDivs.count();
  for (let i = 0; i < count; i++) {
    const div = stepDivs.nth(i);
    const allSpans = await div.locator('span').allTextContents();
    if (allSpans.some(t => t.trim() === String(stepNum))) {
      console.log(`Clicking step ${stepNum} (div index ${i})`);
      await div.click();
      return true;
    }
  }
  // Fallback: use next arrow
  const cur = parseInt(await page.locator('.sticky.top-0 span.tabular-nums').textContent().catch(() => '1') ?? '1');
  const curIdx = cur - 1;
  for (let i = curIdx; i < index; i++) {
    await page.locator('button[title="Next scene"]').click();
    await wait(300);
  }
  return true;
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
  await wait(800);

  // Jump directly to Scene 7
  await clickStepperAt(page, 6);
  await wait(1000);

  const sceneCounter = await page.locator('.sticky.top-0 span.tabular-nums').textContent().catch(() => 'N/A');
  console.log('Scene counter:', sceneCounter);

  const headings = await page.locator('h1,h2,h3,h4').allTextContents();
  console.log('Headings:', JSON.stringify(headings));

  // Capture all buttons
  const allBtns = await page.locator('button').all();
  const btnTexts = [];
  for (const btn of allBtns) {
    const txt = await btn.textContent().catch(() => '');
    const visible = await btn.isVisible().catch(() => false);
    const disabled = await btn.isDisabled().catch(() => false);
    if (txt?.trim()) btnTexts.push({ text: txt.trim().slice(0, 80), visible, disabled });
  }
  console.log('All buttons:', JSON.stringify(btnTexts));

  await ss(page, 'T4a_scene7_initial');

  // The suggested queries are the 3 long-text buttons:
  // "Show me what ran on CNN yesterday"
  // "Which variants are underperforming on finance sites?"
  // "Only serve lifestyle variants on sports content"
  // Click the first one (enabled)
  let queryClicked = false;
  for (const btn of allBtns) {
    const txt = await btn.textContent().catch(() => '');
    const visible = await btn.isVisible().catch(() => false);
    const disabled = await btn.isDisabled().catch(() => false);
    if (visible && !disabled && txt && txt.trim().length >= 15 && txt.trim().length <= 120) {
      if (!txt.includes('→') && !txt.match(/^\d+$/) && !txt.includes('Previous') && !txt.includes('Next')) {
        console.log(`Clicking suggested query: "${txt.trim().slice(0, 80)}"`);
        await btn.click();
        queryClicked = true;
        break;
      }
    }
  }

  if (!queryClicked) {
    console.log('WARNING: No suitable query button found');
  } else {
    await wait(500);
    await ss(page, 'T4b_scene7_loading');
    console.log('Waiting for response...');
    await wait(4000);
    await ss(page, 'T4c_scene7_response');

    const finalHeadings = await page.locator('h1,h2,h3,h4').allTextContents();
    console.log('Headings after query:', JSON.stringify(finalHeadings));

    // Check for right panel content
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Page text (first 800 chars):', pageText.slice(0, 800));
  }

  console.log('\n=== CONSOLE ERRORS ===');
  if (errors.length === 0) console.log('None');
  else errors.forEach(e => console.log(` • ${e}`));

  await browser.close();
  console.log('\nDone.');
})();
