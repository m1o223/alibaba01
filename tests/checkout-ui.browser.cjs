const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';

(async () => {
  const engine = process.env.TEST_BROWSER || 'chromium';
  const browser = await playwright[engine].launch({ headless: true, ...(engine === 'chromium' ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  try {
    for (const width of [307, 375, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [], writes = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
      await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
      await page.goto(base + '/menu?orderType=takeaway');
      await page.locator('a[href="#drinks"]').click();
      await page.getByRole('link', { name: 'Visa Coca-Cola', exact: true }).click();
      await page.getByRole('button', { name: 'Lägg i påsen', exact: true }).click();
      await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
      await page.getByRole('button', { name: 'Till kassan', exact: true }).click();
      await page.getByRole('button', { name: 'Fortsätt i demoläge', exact: true }).click();
      await page.locator('.demo-checkout').waitFor();
      assert.equal(await page.locator('input[name="order-type"]').count(), 3);
      assert(await page.getByRole('radio', { name: 'Hämta själv', exact: true }).isChecked());
      const delivery = page.getByRole('radio', { name: 'Hemleverans', exact: true });
      assert(await delivery.isEnabled());
      const beforeTotals = await page.locator('.demo-summary-panel .demo-total').allTextContents();
      await delivery.check();
      await page.getByRole('dialog', { name: 'Leveransuppgifter', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Stäng leveransuppgifter', exact: true }).click();
      assert(await page.getByRole('button', { name: 'Simulera betalning', exact: true }).isDisabled());
      await page.getByRole('radio', { name: 'Hämta själv', exact: true }).check();
      assert.deepEqual(await page.locator('.demo-summary-panel .demo-total').allTextContents(), beforeTotals);
      assert.equal(await page.locator('input[name*="address"]').count(), 0);
      for (const [label, value] of [['Äta på plats', 'dine-in'], ['Hämta själv', 'takeaway']]) {
        const option = page.getByRole('radio', { name: label, exact: true });
        await option.check();
        assert.equal(new URL(page.url()).searchParams.get('orderType'), value);
        assert.equal(await page.evaluate(() => sessionStorage.getItem('alibaba.orderType')), value);
      }
      await page.getByRole('radio', { name: 'Hämta själv', exact: true }).check();
      assert.equal(await page.locator('.demo-checkout .demo-notice').count(), 0);
      assert.equal(await page.getByText('Välj betalsätt', { exact: true }).count(), 1);
      assert.equal(await page.locator('.checkout-demo-status').count(), 1);
      const pay = page.getByRole('button', { name: 'Simulera betalning', exact: true });
      assert(await pay.isDisabled());
      const logos = page.locator('.checkout-payment-mark');
      assert.equal(await logos.count(), 5);
      await logos.evaluateAll(images => Promise.all(images.map(image => image.decode())));
      assert(await logos.evaluateAll(images => images.every(image => image.naturalWidth > 0 && getComputedStyle(image).objectFit === 'contain')));
      for (const method of ['Swish', 'Apple Pay', 'Google Pay', 'Betalkort – Visa / Mastercard']) {
        await page.getByRole('radio', { name: method, exact: true }).check();
        assert(await pay.isEnabled());
        assert.match(await page.locator('.demo-payment-preview').innerText(), /Demo/);
        assert.deepEqual(await page.locator('.demo-summary-panel .demo-total').allTextContents(), beforeTotals);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: no horizontal overflow`);
        assert(await page.locator('.demo-payment-option').evaluateAll(rows => rows.every(row => row.scrollWidth <= row.clientWidth)), `${width}: payment rows fit`);
      }
      assert(await page.locator('.checkout-demo-status').evaluate(notice => Boolean(notice.nextElementSibling?.matches('button.demo-primary'))));
      if (process.env.SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `${engine}-${width}.png`), fullPage: true });
      }
      await pay.click();
      await page.locator('.demo-receipt').waitFor();
      assert.match(await page.locator('.demo-receipt').innerText(), /Ta med/);
      assert.equal((await page.locator('.demo-receipt .demo-total strong').innerText()).replace(/[^0-9]/g, ''), '25');
      assert.deepEqual(writes, [], 'No order or payment requests');
      assert.deepEqual(errors, []);
      console.log(`${engine} ${width}px: checkout labels, delivery payment blocked, original logos, unchanged totals and demo receipt PASS`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
