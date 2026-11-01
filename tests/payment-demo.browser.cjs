const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const money = text => Number(text.replace(/[^0-9]/g, ''));
const storage = page => page.evaluate(() => JSON.stringify([Object.entries(sessionStorage), Object.entries(localStorage)]));

(async () => {
  const engine = process.env.TEST_BROWSER || 'chromium';
  const browser = await playwright[engine].launch({ headless: true, ...(engine === 'chromium' ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  try {
    for (const width of [307, 375, 390, 430, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [], requests = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
      await page.goto(base + '/menu/product/' + encodeURIComponent('demo:chicken-shawarma:plate') + '?orderType=takeaway');
      await page.getByRole('radio', { name: /^Ris/ }).check();
      await page.getByRole('radio', { name: /^Coca-Cola \+/ }).check();
      await page.getByRole('checkbox', { name: /^Extra vitlökssås/ }).check();
      await page.locator('.demo-ingredient-exclusions input[value="pickles"]').check();
      await page.locator('.demo-ingredient-exclusions input[value="garlic"]').check();
      await page.getByRole('button', { name: 'Öka antal', exact: true }).click();
      await page.getByRole('button', { name: 'Lägg i påsen', exact: true }).click();
      await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
      await page.getByRole('button', { name: 'Till kassan', exact: true }).click();
      await page.getByRole('button', { name: 'Fortsätt i demoläge', exact: true }).click();
      await page.locator('.demo-checkout').waitFor();
      await page.waitForTimeout(400);
      const url = page.url();
      const pay = page.getByRole('button', { name: 'Simulera betalning', exact: true });
      const modal = page.locator('.payment-demo-modal');
      const layer = page.locator('.payment-demo-layer');
      await page.clock.install({ time: new Date('2026-11-01T12:00:00Z') });
      await page.clock.pauseAt(new Date('2026-11-01T12:00:01Z'));
      await page.evaluate(() => { window.printCalls = 0; window.print = () => { window.printCalls++; }; });
      for (const method of ['Swish', 'Apple Pay', 'Google Pay', 'Betalkort – Visa / Mastercard']) {
        await page.getByRole('radio', { name: method, exact: true }).check();
        if (method.startsWith('Betalkort')) {
          assert.equal(await page.locator('.checkout-card-preview input:disabled').count(), 4);
          assert(await page.getByRole('button', { name: 'Betala säkert', exact: true }).isDisabled());
        }
        const before = await storage(page);
        const monitor = request => requests.push(request.url());
        page.on('request', monitor);
        await pay.scrollIntoViewIfNeeded();
        const scrollY = await page.evaluate(() => window.scrollY);
        // Two synchronous activations must still create only one simulation.
        await pay.evaluate(button => { button.focus(); button.click(); button.click(); });
        await modal.waitFor();
        assert.equal(await modal.count(), 1);
        assert.equal(await layer.getAttribute('data-phase'), 'processing');
        assert(await modal.getByText('Kontrollerar betalningen…', { exact: true }).isVisible());
        assert(await page.locator('#root').evaluate(root => root.inert && getComputedStyle(root).filter.includes('blur')));
        assert.equal(await modal.evaluate(el => getComputedStyle(el).filter), 'none');
        assert.equal(await page.evaluate(() => document.body.style.position), 'fixed');
        await page.keyboard.press('Tab');
        assert(await modal.evaluate(el => el.contains(document.activeElement)));
        await page.clock.runFor(2999);
        assert.equal(await layer.getAttribute('data-phase'), 'processing');
        if (process.env.SCREENSHOT_DIR && method === 'Swish') {
          fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
          await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `${engine}-${width}-processing.png`), animations: 'disabled' });
        }
        await page.clock.runFor(1);
        await page.locator('.payment-demo-layer[data-phase="confirmed"]').waitFor();
        assert.equal(await layer.getAttribute('data-phase'), 'confirmed');
        assert(await modal.getByText('Demobetalning bekräftad', { exact: true }).isVisible());
        await page.clock.runFor(899);
        assert.equal(await layer.getAttribute('data-phase'), 'confirmed');
        await page.clock.runFor(1);
        await page.locator('.payment-demo-receipt').waitFor();
        await page.clock.runFor(300);
        assert.equal(page.url(), url);
        assert.equal(money(await page.locator('.payment-demo-grand-total dd').innerText()), 350);
        const receipt = await page.locator('.payment-demo-receipt').innerText();
        for (const text of ['2 × Kycklingshawarmatallrik', 'Ris', 'Coca-Cola', 'Extra vitlökssås', 'Utan pickles', 'Utan vitlökskräm', 'Hämta själv', method]) assert(receipt.includes(text), text);
        assert.match(receipt, /DEMO-[A-F0-9]{8}/);
        assert.equal(await page.locator('header .cart-count').innerText(), '2');
        assert.equal(await storage(page), before, 'No cart mutation or new order/session data');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert(await modal.evaluate(el => el.scrollWidth <= el.clientWidth));
        const rect = await modal.boundingBox();
        assert(rect.x >= 0 && rect.x + rect.width <= width && rect.y >= 0 && rect.y + rect.height <= 900);
        if (process.env.SCREENSHOT_DIR && method === 'Swish') await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `${engine}-${width}-receipt.png`), animations: 'disabled' });
        await modal.getByRole('button', { name: 'Skriv ut', exact: true }).click();
        await page.emulateMedia({ media: 'print' });
        assert.equal(await page.locator('#root').evaluate(el => getComputedStyle(el).display), 'none');
        assert.equal(await page.locator('.payment-demo-actions').evaluate(el => getComputedStyle(el).display), 'none');
        assert.equal(await modal.evaluate(el => getComputedStyle(el).maxHeight), 'none');
        assert(await page.locator('.payment-demo-badge').isVisible());
        assert(await page.locator('.payment-demo-safety').isVisible());
        if (engine === 'chromium' && width === 390 && method === 'Swish' && process.env.SCREENSHOT_DIR) await page.pdf({ path: path.join(process.env.SCREENSHOT_DIR, 'demo-receipt.pdf'), format: 'A4' });
        await page.emulateMedia({ media: 'screen' });
        await modal.getByRole('button', { name: 'Stäng', exact: true }).click();
        assert.equal(await modal.count(), 0);
        assert.equal(await page.locator('#root').evaluate(el => el.inert), false);
        assert.equal(await page.locator('#root').evaluate(el => el.style.filter), '');
        assert.equal(await page.evaluate(() => document.body.style.position), '');
        assert(Math.abs(await page.evaluate(() => window.scrollY) - scrollY) <= 1);
        assert(await pay.evaluate(el => document.activeElement === el));
        page.off('request', monitor);
      }
      assert.equal(await page.evaluate(() => window.printCalls), 4);
      await page.getByRole('radio', { name: 'Äta på plats', exact: true }).check();
      await pay.click();
      await page.clock.runFor(4200);
      assert.match(await page.locator('.payment-demo-receipt').innerText(), /Äta på plats/);
      await page.setViewportSize({ width, height: 480 });
      assert(await modal.evaluate(el => el.scrollHeight > el.clientHeight), 'Receipt scrolls in a short viewport');
      await modal.getByRole('button', { name: 'Stäng', exact: true }).scrollIntoViewIfNeeded();
      assert(await modal.getByRole('button', { name: 'Stäng', exact: true }).isVisible());
      await page.keyboard.press('Escape');
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await pay.click();
      assert.equal(await page.locator('.payment-demo-spinner').evaluate(el => getComputedStyle(el).animationName), 'none');
      await page.getByRole('button', { name: 'Stäng betalningsdemo', exact: true }).click();
      await page.clock.runFor(5000);
      assert.equal(await modal.count(), 0, 'Closing cancels pending phase timers');
      assert.equal(await page.locator('header .cart-count').innerText(), '2');
      await pay.click();
      await page.goBack();
      await page.clock.runFor(5000);
      assert.equal(await modal.count(), 0, 'Route unmount cancels timers and restores the background');
      assert.equal(await page.locator('#root').evaluate(el => el.inert), false);
      assert.deepEqual(requests, [], 'Simulation must make NO network requests');
      assert.deepEqual(errors, []);
      console.log(`${engine} ${width}px: all 4 methods, exact 3000/900ms phases, receipt/options/total, print, focus, cancellation, no requests or bag changes PASS`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
