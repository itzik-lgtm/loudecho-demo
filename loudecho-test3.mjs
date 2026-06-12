import { chromium } from 'playwright';

const SS_DIR = '/tmp/loudecho-screenshots';
const consoleErrors = [];

async function ss(page, name) {
  const path = `${SS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`[SS] ${name}`);
}

async function waitMs(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', err => consoleErrors.push(`[pageerror] ${err.message}`));

  // ─── SCENE 1 ────────────────────────────────────────────────────────
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await waitMs(800);
  await ss(page, 'A1_scene1_brief_input');

  // Scroll to show full scene1 (variation axes pills + Generate button)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await waitMs(400);
  await ss(page, 'A2_scene1_scrolled_bottom');
  await page.evaluate(() => window.scrollTo(0, 0));

  // ─── SCENE 2 ────────────────────────────────────────────────────────
  console.log('Clicking Generate...');
  await page.locator('button:has-text("Generate")').first().click();
  await waitMs(600);
  await ss(page, 'B1_scene2_streaming_start');

  await waitMs(3000);
  await ss(page, 'B2_scene2_streaming_mid');

  // Wait for generating phase to complete (16s stream + ~1s buffer)
  console.log('Waiting for streaming to finish (16s)...');
  await waitMs(14000);
  await ss(page, 'B3_scene2_near_end_of_streaming');

  // Should now be in judging phase
  await waitMs(2000);
  await ss(page, 'B4_scene2_judging_phase');

  // Wait for judging to complete (4s)
  await waitMs(4000);
  await ss(page, 'B5_scene2_ready_state');

  // Check phase
  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasReady = bodyText.includes('Proceed to Review') || bodyText.includes('Generate & Judge');
  const hasProceed = bodyText.includes('Proceed to Review');
  console.log('Body contains "Generate & Judge":', bodyText.includes('Generate & Judge'));
  console.log('Body contains "Proceed to Review":', hasProceed);
  console.log('Body contains "AI Judging":', bodyText.includes('AI Judging'));
  console.log('Body contains "Recommended":', bodyText.includes('Recommended'));
  console.log('Body contains "Needs Review":', bodyText.includes('Needs Review'));

  // Scroll sidebar into view if any
  const allBtns = await page.locator('button').allTextContents();
  console.log('Buttons visible:', JSON.stringify(allBtns));

  // Zoom in on sidebar (left panel)
  const sidebar = page.locator('aside, [class*="sidebar"], [class*="Sidebar"]').first();
  const hasSidebar = await sidebar.isVisible().catch(() => false);
  console.log('Sidebar visible:', hasSidebar);
  if (hasSidebar) {
    await sidebar.screenshot({ path: `${SS_DIR}/B5b_scene2_sidebar_zoom.png` });
    console.log('[SS] B5b_scene2_sidebar_zoom');
  }

  // Screenshot at viewport (not full page) to see layout
  await page.screenshot({ path: `${SS_DIR}/B5c_scene2_viewport.png`, fullPage: false });
  console.log('[SS] B5c_scene2_viewport');

  // ─── Navigate to Scene 3 ─────────────────────────────────────────────
  // Click "Proceed to Review →" button
  const proceedBtn = page.locator('button:has-text("Proceed to Review")');
  const proceedVisible = await proceedBtn.isVisible().catch(() => false);
  console.log('"Proceed to Review" button visible:', proceedVisible);

  if (proceedVisible) {
    await proceedBtn.click();
    await waitMs(1200);
    await ss(page, 'C1_scene3_initial');
  } else {
    // Try nav item
    const navLinks = await page.locator('header button, [class*="nav"] button, nav button').allTextContents();
    console.log('Nav buttons:', JSON.stringify(navLinks));

    // Click "3 Resolve & Approve" nav item
    const resolveNav = page.locator('button:has-text("Resolve"), button:has-text("Review & Approve"), button:has-text("3")');
    for (const btn of await resolveNav.all()) {
      const txt = await btn.textContent();
      const visible = await btn.isVisible().catch(() => false);
      console.log(`Nav option: "${txt?.trim()}" visible: ${visible}`);
      if (visible) {
        await btn.click();
        console.log(`Clicked nav: "${txt?.trim()}"`);
        await waitMs(1200);
        break;
      }
    }
    await ss(page, 'C1_scene3_initial');
  }

  // Inspect scene 3
  const s3h = await page.locator('h1,h2,h3,.text-brand').allTextContents();
  console.log('Scene 3 headings/labels:', JSON.stringify(s3h));
  const s3btns = await page.locator('button').allTextContents();
  console.log('Scene 3 buttons:', JSON.stringify(s3btns));

  // ─── Scene 3: Bulk Approve Step ──────────────────────────────────────
  await ss(page, 'C2_scene3_bulk_approve');

  // Look for "Approve All" / checkboxes
  const approveAll = page.locator('button:has-text("Approve All"), button:has-text("Approve all")').first();
  if (await approveAll.isVisible().catch(() => false)) {
    console.log('Found "Approve All" button');
    await approveAll.screenshot({ path: `${SS_DIR}/C2b_approve_all_btn.png` });
  }

  // ─── Scene 3: Cluster Review Step ────────────────────────────────────
  // Find and click a cluster/group card
  // Look for clickable cluster items
  const clusterCandidates = [
    '[class*="cluster"]',
    '[class*="ClusterRow"]',
    '[class*="cluster-row"]',
    '[class*="BucketRow"]',
    'tr[class*="cluster"]',
    '[data-cluster]',
  ];

  let clusterFound = false;
  for (const sel of clusterCandidates) {
    const count = await page.locator(sel).count();
    if (count > 0) {
      console.log(`Found ${count} elements: ${sel}`);
      await page.locator(sel).first().click().catch(() => {});
      await waitMs(800);
      await ss(page, 'C3_cluster_detail');
      clusterFound = true;
      break;
    }
  }

  if (!clusterFound) {
    // Try clicking any list items that might be clusters
    const allItems = page.locator('[role="row"], [role="listitem"], li').all();
    for (const item of (await allItems).slice(0, 5)) {
      const txt = await item.textContent().catch(() => '');
      if (txt && txt.length > 5) {
        console.log(`Clicking item: "${txt.slice(0, 50)}"`);
        await item.click().catch(() => {});
        await waitMs(500);
        break;
      }
    }
    await ss(page, 'C3_cluster_detail');
  }

  // Navigate through remaining scene 3 steps
  const nextStepBtns = [
    'button:has-text("Next")',
    'button:has-text("Continue")',
    'button:has-text("Proceed")',
    'button:has-text("Done")',
    'button:has-text("Finish")',
    'button:has-text("Summary")',
    'button:has-text("Complete")',
  ];

  for (let step = 0; step < 4; step++) {
    await waitMs(500);
    const currentBtns = await page.locator('button').allTextContents();
    console.log(`Step ${step} buttons:`, JSON.stringify(currentBtns));

    let advanced = false;
    for (const sel of nextStepBtns) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        const txt = await btn.textContent();
        console.log(`Clicking step btn: "${txt}"`);
        await btn.click();
        await waitMs(1000);
        await ss(page, `C${4+step}_step_${txt?.trim().replace(/[^a-z0-9]/gi,'_').slice(0,20)}`);
        advanced = true;
        break;
      }
    }
    if (!advanced) break;
  }

  await ss(page, 'C_final_state');

  const finalH = await page.locator('h1,h2,h3').allTextContents();
  const finalBtns = await page.locator('button').allTextContents();
  console.log('Final headings:', JSON.stringify(finalH));
  console.log('Final buttons:', JSON.stringify(finalBtns));

  // ─── Console errors ─────────────────────────────────────────────────
  console.log('\n=== CONSOLE ERRORS ===');
  if (consoleErrors.length === 0) console.log('None');
  else consoleErrors.forEach(e => console.log(e));

  await browser.close();
  console.log('\nAll screenshots in', SS_DIR);
})();
