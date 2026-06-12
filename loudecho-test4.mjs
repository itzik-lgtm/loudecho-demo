import { chromium } from 'playwright';

const SS_DIR = '/tmp/loudecho-screenshots';
const errors = [];

async function ss(page, name) {
  const path = `${SS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`[SS] ${name}`);
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  // Use a larger viewport for clearer screenshots
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();

  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  // ─── Go straight to Scene 2 ready state ───────────────────────
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await wait(500);

  // Click Generate
  await page.locator('button:has-text("Generate")').first().click();
  console.log('Clicked Generate, waiting 22s for full animation...');
  await wait(22000); // 16s stream + 4s judging + 2s buffer

  // Capture ready state (sidebar + bucket summary + badges on cards)
  await ss(page, 'ZOOM_B5_scene2_ready_full');

  // Zoom in on the left sidebar panel specifically
  const leftPanel = page.locator('aside, [class*="left"], .w-\\[280px\\]').first();
  const panelVisible = await leftPanel.isVisible().catch(() => false);
  console.log('Left panel visible:', panelVisible);
  if (panelVisible) {
    await leftPanel.screenshot({ path: `${SS_DIR}/ZOOM_B5_sidebar_detail.png` });
    console.log('[SS] ZOOM_B5_sidebar_detail');
  }

  // Screenshot first few cards in the grid
  const cards = page.locator('[class*="card"], [class*="Card"]').first();
  if (await cards.isVisible().catch(() => false)) {
    await cards.screenshot({ path: `${SS_DIR}/ZOOM_B5_card_with_badge.png` });
    console.log('[SS] ZOOM_B5_card_with_badge');
  }

  // ─── Scene 3 ──────────────────────────────────────────────────
  await page.locator('button:has-text("Proceed to Review")').first().click();
  await wait(1000);
  await ss(page, 'ZOOM_C1_scene3_bulk_approve');

  // Zoom into scene3 content
  const s3content = page.locator('main, [class*="content"], [class*="Content"]').first();
  if (await s3content.isVisible().catch(() => false)) {
    await s3content.screenshot({ path: `${SS_DIR}/ZOOM_C1_scene3_content.png` });
    console.log('[SS] ZOOM_C1_scene3_content');
  }

  // Look for cluster rows specifically
  const body = await page.evaluate(() => document.body.innerHTML);
  // Look for any table rows or list items
  const listItems = await page.locator('tr, [role="row"], li, [class*="row"], [class*="Row"]').count();
  console.log('List/row items count:', listItems);

  // Try to identify the cluster display
  const allEls = await page.evaluate(() => {
    const els = document.querySelectorAll('[class]');
    const classNames = new Set();
    els.forEach(el => {
      el.className.split(' ').forEach(c => {
        if (c.includes('cluster') || c.includes('bucket') || c.includes('group') ||
            c.includes('review') || c.includes('approve') || c.includes('card')) {
          classNames.add(c);
        }
      });
    });
    return Array.from(classNames).slice(0, 50);
  });
  console.log('Relevant class names:', JSON.stringify(allEls));

  // Get a scrollable view of scene 3
  await page.evaluate(() => window.scrollTo(0, 0));
  await ss(page, 'ZOOM_C2_scene3_top');
  await page.evaluate(() => window.scrollTo(0, 500));
  await ss(page, 'ZOOM_C2_scene3_mid');

  // Look for the "Approve recommended launch pool" button
  const approveBtn = page.locator('button:has-text("Approve recommended launch pool")');
  const approveBtnVisible = await approveBtn.isVisible().catch(() => false);
  console.log('"Approve recommended launch pool" visible:', approveBtnVisible);

  // Try to click something that looks like a cluster
  // First, look for what's actually rendered
  const visibleText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const texts = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text && text.length > 3 && text.length < 100) texts.push(text);
    }
    return [...new Set(texts)].slice(0, 80);
  });
  console.log('Visible text nodes (first 80):', JSON.stringify(visibleText));

  // Click "Approve recommended launch pool" and move to next step
  if (approveBtnVisible) {
    await approveBtn.click();
    await wait(1000);
    await ss(page, 'ZOOM_C3_after_approve');

    const afterH = await page.locator('h1,h2,h3').allTextContents();
    const afterBtns = await page.locator('button').allTextContents();
    console.log('After approve headings:', JSON.stringify(afterH));
    console.log('After approve buttons:', JSON.stringify(afterBtns));
  }

  // Keep stepping through
  for (let i = 0; i < 5; i++) {
    const btns = await page.locator('button').allTextContents();
    console.log(`Step ${i} buttons:`, JSON.stringify(btns));

    const nextBtns = [
      'button:has-text("Next")',
      'button:has-text("Continue")',
      'button:has-text("Proceed")',
      'button:has-text("Done")',
      'button:has-text("Finish")',
      'button:has-text("Summary")',
      'button:has-text("Complete")',
      'button:has-text("Confirm")',
      'button:has-text("Launch")',
    ];

    let advanced = false;
    for (const sel of nextBtns) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        const txt = await btn.textContent();
        console.log(`Clicking: "${txt}"`);
        await btn.click();
        await wait(1000);
        await ss(page, `ZOOM_C${4+i}_step_${i}`);
        advanced = true;
        break;
      }
    }
    if (!advanced) break;
  }

  await ss(page, 'ZOOM_FINAL');
  const finalH = await page.locator('h1,h2,h3').allTextContents();
  const finalBtns = await page.locator('button').allTextContents();
  console.log('Final headings:', JSON.stringify(finalH));
  console.log('Final buttons:', JSON.stringify(finalBtns));

  console.log('\n=== CONSOLE ERRORS ===');
  if (errors.length === 0) console.log('None');
  else errors.forEach(e => console.log(e));

  await browser.close();
})();
