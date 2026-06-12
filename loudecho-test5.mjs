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
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  // Navigate to app and run through all scenes
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await wait(500);

  // Scene 1 → Scene 2
  await page.locator('button:has-text("Generate")').first().click();
  console.log('Waiting for Scene 2 to complete (~22s)...');
  await wait(22000);

  // Scene 2 → Scene 3
  await page.locator('button:has-text("Proceed to Review")').first().click();
  await wait(800);
  await ss(page, 'D1_scene3_bulk_approve');

  // Step 1: Bulk approve
  const approvePoolBtn = page.locator('button:has-text("Approve recommended launch pool")');
  console.log('"Approve recommended launch pool" visible:', await approvePoolBtn.isVisible().catch(() => false));
  await approvePoolBtn.click();
  await wait(800);
  await ss(page, 'D2_scene3_cluster_review_landed');

  // Now in cluster-review phase
  // The first cluster is auto-selected ("CTA contrast ratio below threshold")
  // Take a screenshot showing the cluster detail
  await ss(page, 'D3_scene3_cluster_detail_first');

  // Check what clusters exist
  const clusterBtns = await page.locator('button').allTextContents();
  console.log('Cluster-review buttons:', JSON.stringify(clusterBtns.slice(0, 20)));

  // Approve all in current cluster using "Approve all"
  const approveAllBtn = page.locator('button:has-text("✓ Approve all"), button:has-text("Approve all")').first();
  if (await approveAllBtn.isVisible().catch(() => false)) {
    console.log('Clicking "Approve all" for current cluster');
    await approveAllBtn.click();
    await wait(500);
  }
  await ss(page, 'D4_scene3_after_approve_all_cluster1');

  // Keep clicking through clusters
  for (let i = 0; i < 10; i++) {
    // Look for a pending cluster button in the left list and click it
    const pendingCluster = page.locator('button[class*="pending"], button:has-text("pending")').first();
    if (await pendingCluster.isVisible().catch(() => false)) {
      const txt = await pendingCluster.textContent();
      console.log(`Clicking pending cluster: "${txt?.slice(0, 60)}"`);
      await pendingCluster.click();
      await wait(400);

      // Approve all in this cluster
      const appAll = page.locator('button:has-text("✓ Approve all"), button:has-text("Approve all")').first();
      if (await appAll.isVisible().catch(() => false)) {
        await appAll.click();
        await wait(400);
      }
      continue;
    }

    // Check if we're at final-summary
    const headings = await page.locator('h1,h2,h3').allTextContents();
    console.log(`Iteration ${i} headings:`, JSON.stringify(headings));
    if (headings.some(h => h.includes('final') || h.includes('Summary') || h.includes('Campaign ready') || h.includes('Launch'))) {
      console.log('Reached final summary!');
      break;
    }

    // Check buttons for any remaining work
    const btns = await page.locator('button').allTextContents();
    const hasPending = btns.some(b => b.includes('pending'));
    if (!hasPending) {
      console.log('No more pending items');
      break;
    }
    console.log(`Iteration ${i}: still have pending items`);
    await wait(300);
  }

  await wait(1000);
  await ss(page, 'D5_scene3_after_all_clusters');

  // Check current state
  const state = await page.evaluate(() => document.body.innerText);
  console.log('Has "final-summary" content:', state.includes('Campaign') || state.includes('Ready to launch') || state.includes('Send to'));
  const headings = await page.locator('h1,h2,h3').allTextContents();
  const btns = await page.locator('button').allTextContents();
  console.log('Current headings:', JSON.stringify(headings));
  console.log('Current buttons:', JSON.stringify(btns));

  // Try "Send to Simulation" button
  const sendBtn = page.locator('button:has-text("Send"), button:has-text("Launch"), button:has-text("Simulation")').first();
  if (await sendBtn.isVisible().catch(() => false)) {
    const txt = await sendBtn.textContent();
    console.log(`Clicking: "${txt}"`);
    await sendBtn.click();
    await wait(800);
    await ss(page, 'D6_scene3_final_summary_or_scene4');
  }

  console.log('\n=== CONSOLE ERRORS ===');
  if (errors.length === 0) console.log('None');
  else errors.forEach(e => console.log(e));

  await browser.close();
})();
