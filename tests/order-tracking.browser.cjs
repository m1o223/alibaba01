const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const key = 'alibaba.preview.tracking.v1';
const stored = page => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key);
const bag = page => page.evaluate(() => sessionStorage.getItem('alibaba.preview.demo-cart.v2'));
const time = page => page.locator('.order-tracker-time').innerText();
async function settleNavigation(page) {
  // Let lazy module requests resolve before advancing React's Suspense reveal timer.
  await page.waitForTimeout(150);
  await page.clock.runFor(400);
}

async function shot(page, name) {
  if (!process.env.SCREENSHOT_DIR) return;
  fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, name + '.png'), animations: 'disabled' });
}
async function checkout(page, method = 'Swish') {
  await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
  await page.goto(base + '/menu/product/' + encodeURIComponent('demo:chicken-shawarma:plate') + '?orderType=takeaway');
  await page.getByRole('radio', { name: /^Ris/ }).check();
  await page.getByRole('radio', { name: /^Coca-Cola \+/ }).check();
  await page.getByRole('checkbox', { name: /^Extra vitlökssås/ }).check();
  await page.locator('.demo-ingredient-exclusions input[value="pickles"]').check();
  await page.getByRole('button', { name: 'Öka antal', exact: true }).click();
  await page.getByRole('button', { name: 'Lägg i påsen', exact: true }).click();
  await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
  await page.getByRole('button', { name: 'Till kassan', exact: true }).click();
  await page.getByRole('button', { name: 'Fortsätt i demoläge', exact: true }).click();
  await page.getByRole('radio', { name: method, exact: true }).check();
  await page.waitForTimeout(400);
  const now = Date.now();
  await page.clock.install({ time: new Date(now) });
  await page.clock.pauseAt(new Date(now + 1000));
  await page.getByRole('button', { name: 'Simulera betalning', exact: true }).click();
  await page.clock.runFor(2999);
  assert.equal(await page.locator('.payment-demo-layer').getAttribute('data-phase'), 'processing');
  await page.clock.runFor(1);
  await page.locator('.payment-demo-layer[data-phase="confirmed"]').waitFor();
  await page.clock.runFor(900);
  await page.locator('.payment-demo-receipt').waitFor();
  assert.match(await page.locator('.payment-demo-receipt').innerText(), /Utan pickles/);
  assert((await page.locator('.payment-demo-receipt').innerText()).includes(method));
  assert.equal((await page.locator('.payment-demo-grand-total dd').innerText()).replace(/\D/g, ''), '350');
  const reference = (await page.locator('.payment-demo-receipt').innerText()).match(/DEMO-[A-F0-9]{8}/)[0];
  await page.getByRole('button', { name: 'Fortsätt', exact: true }).click();
  await page.locator('.order-confirmation[data-status="pending"]').waitFor();
  assert.equal(await page.locator('.payment-demo-layer').count(), 0);
  assert.equal(new URL(page.url()).pathname, '/demo/checkout');
  assert.match(await page.locator('.order-confirmation-reference').innerText(), new RegExp(reference));
  assert.equal(await page.locator('.order-tracker-circle').count(), 0);
  assert(await page.locator('#root').evaluate(el => el.inert && getComputedStyle(el).filter.includes('blur')));
  return reference;
}
async function layout(page) {
  await page.waitForTimeout(100);
  await page.clock.runFor(320);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const fit = await page.locator('.order-tracker-circle').evaluate(el => {
    const r = el.getBoundingClientRect();
    const header = document.querySelector('.app-header').getBoundingClientRect();
    const targets = [...document.querySelectorAll('header button, .home-logo, .home-order-actions button, main button, main input, main a')]
      .filter(target => !target.closest('[inert], [aria-hidden="true"]'));
    const overlaps = targets.filter(target => { const b = target.getBoundingClientRect(); return b.width && b.height && r.right > b.left && r.left < b.right && r.bottom > b.top && r.top < b.bottom; });
    return { valid: r.top >= header.bottom + 8 && r.right <= innerWidth && r.bottom <= innerHeight && r.left >= 0 && !overlaps.length,
      rect: r.toJSON(), overlaps: overlaps.map(el => ({ tag: el.tagName, text: el.textContent, rect: el.getBoundingClientRect().toJSON() })) };
  });
  assert(fit.valid, 'Tracker fits below header without covering important controls: ' + JSON.stringify({ url: page.url(), ...fit }));
}

(async () => {
  const engine = process.env.TEST_BROWSER || 'chromium';
  const browser = await pw[engine].launch({ headless: true, ...(engine === 'chromium' ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const errors = [], writes = [];
  async function createPage(width) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
    return page;
  }
  try {
    for (const width of (process.env.TEST_WIDTHS || '307,375,390,430,768,1440').split(',').map(Number)) {
      const page = await createPage(width);
      const reference = await checkout(page), originalBag = await bag(page);
      await shot(page, `${engine}-${width}-waiting`);
      assert(await page.getByText('Testkontroller · Endast demo', { exact: true }).isVisible());
      await page.getByRole('button', { name: 'Simulera godkännande', exact: true }).evaluate(el => { el.click(); el.click(); });
      await page.getByRole('heading', { name: 'Beställningen är bekräftad!', exact: true }).waitFor();
      const acceptance = (await stored(page)).active.acceptedAt;
      assert.equal((await stored(page)).active.acknowledged, false);
      assert.equal(await page.locator('.order-tracker-circle').count(), 0);
      await page.clock.runFor(100);
      assert.equal(new URL(page.url()).pathname, '/demo/checkout', 'No automatic redirect before OK');
      await shot(page, `${engine}-${width}-accepted`);
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForURL(url => url.pathname === '/');
      await settleNavigation(page);
      await page.locator('.order-tracker-circle').waitFor();
      assert.equal(await time(page), '25:00');
      assert.equal((await stored(page)).active.summary.reference, reference);
      assert.equal((await stored(page)).confirmation, null);
      assert.equal(await bag(page), originalBag);
      assert.equal(await page.locator('#root').evaluate(el => el.inert), false);
      await layout(page);
      await shot(page, `${engine}-${width}-home`);
      await page.clock.runFor(12000);
      assert.equal(await time(page), '24:48');
      await page.getByRole('button', { name: 'Se menyn & beställ', exact: true }).click();
      await page.waitForURL(url => url.pathname === '/menu');
      await settleNavigation(page);
      await page.locator('.menu-category-card').first().waitFor();
      await layout(page);
      await page.reload();
      await settleNavigation(page);
      await page.locator('.order-tracker-circle').waitFor();
      assert.equal((await stored(page)).active.acceptedAt, acceptance);
      assert.notEqual(await time(page), '25:00');
      for (const route of ['/about', '/contact', '/menu']) {
        await page.locator(`a[href="${route}"]`).first().evaluate(el => el.click());
        await page.waitForURL(url => url.pathname === route);
        await settleNavigation(page);
        await page.locator('.order-tracker-circle').waitFor();
        await layout(page);
        assert.equal((await stored(page)).active.acceptedAt, acceptance);
      }
      await page.locator('a[href="#drinks"]').evaluate(el => el.click());
      await settleNavigation(page);
      await page.getByRole('link', { name: 'Visa Vatten', exact: true }).evaluate(el => el.click());
      await settleNavigation(page);
      await layout(page);
      assert.equal((await stored(page)).active.acceptedAt, acceptance);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await layout(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('.order-tracker-circle').evaluate(el => getComputedStyle(el).animationName), 'none');
      await page.locator('.order-tracker-circle').click();
      const panel = page.getByRole('dialog', { name: 'Ali Baba Demo', exact: true });
      await panel.waitFor();
      assert.match(await panel.innerText(), new RegExp(reference));
      assert.match(await panel.innerText(), /Simulerad återstående tid/);
      assert.equal(await page.getByRole('button', { name: 'Stäng orderinformation', exact: true }).evaluate(el => document.activeElement === el), true);
      await shot(page, `${engine}-${width}-panel`);
      await page.getByRole('button', { name: 'Stäng orderinformation', exact: true }).click();
      assert.equal(await panel.count(), 0);
      assert(await page.locator('.order-tracker-circle').isVisible());
      assert.equal((await stored(page)).active.acceptedAt, acceptance);
      await page.locator('.order-tracker-circle').click();
      await page.keyboard.press('Escape');
      assert.equal(await panel.count(), 0);
      await page.clock.fastForward(25 * 60 * 1000);
      assert.equal(await time(page), '00:00');
      await page.locator('.order-tracker-circle').click();
      assert.match(await panel.innerText(), /Beräknad tid uppnådd/);
      assert.doesNotMatch(await panel.innerText(), /Redo att hämtas|Maten är klar/);
      await page.reload();
      await settleNavigation(page);
      await page.locator('.order-tracker-circle').waitFor();
      assert.equal(await time(page), '00:00');
      assert.equal(await bag(page), originalBag);
      await page.close();

      const rejected = await createPage(width);
      const method = width === 307 ? 'Betalkort – Visa / Mastercard' : width === 375 ? 'Apple Pay' : width === 390 ? 'Google Pay' : 'Swish';
      const rejectedReference = await checkout(rejected, method), rejectedBag = await bag(rejected);
      await rejected.reload();
      await settleNavigation(rejected);
      await rejected.locator('.order-confirmation[data-status="pending"]').waitFor();
      assert.match(await rejected.locator('.order-confirmation-reference').innerText(), new RegExp(rejectedReference));
      await rejected.getByRole('button', { name: 'Simulera avvisning', exact: true }).click();
      await rejected.getByRole('heading', { name: 'Beställningen kunde inte accepteras.', exact: true }).waitFor();
      assert(await rejected.getByText('Produkten är tyvärr slut.', { exact: true }).isVisible());
      assert.equal((await stored(rejected)).active, null);
      assert.equal((await stored(rejected)).confirmation.acceptedAt, null);
      await shot(rejected, `${engine}-${width}-rejected`);
      await rejected.getByRole('button', { name: 'Till startsidan', exact: true }).click();
      await rejected.waitForURL(url => url.pathname === '/');
      await settleNavigation(rejected);
      await rejected.getByRole('button', { name: 'Se menyn & beställ', exact: true }).waitFor();
      assert.equal(await rejected.locator('.order-tracker-circle').count(), 0);
      assert.equal((await stored(rejected)).confirmation.status, 'rejected');
      assert.equal((await stored(rejected)).confirmation.acknowledged, true);
      assert.equal(await bag(rejected), rejectedBag);
      await rejected.reload();
      await settleNavigation(rejected);
      assert.equal(await rejected.locator('.order-tracker-circle').count(), 0);
      await rejected.close();
      console.log(`${engine} ${width}px: accept/reject, receipt identity/options, OK-only redirect, 25-minute timestamp, all routes, refresh/expiry, panel, no overlaps and unchanged bag PASS`);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
