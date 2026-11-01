const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';

(async () => {
  const engine = process.env.TEST_BROWSER || 'chromium';
  const browser = await playwright[engine].launch({ headless: true, ...(engine === 'chromium' ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  try {
    for (const width of [307, 375, 390, 430, 768, 1440]) {
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
        if (method === 'Betalkort – Visa / Mastercard') {
          const card = page.locator('.checkout-card-preview');
          assert.equal(await card.locator('input').count(), 4);
          for (const label of ['Kortnummer', 'Utgångsdatum', 'CVC/CVV', 'Namn på kortet']) {
            assert(await card.getByLabel(label, { exact: true }).isDisabled());
          }
          assert(await card.locator('input').evaluateAll(inputs => inputs.every(input => input.readOnly && input.disabled && input.value === '' && !input.name && input.autocomplete === 'off')));
          assert.equal(await card.locator('form').count(), 0);
          assert.equal(await page.locator('.demo-payment-preview, .demo-card-visual').count(), 0);
          assert(await pay.isEnabled());
          assert.equal(await card.getByText('Kortbetalning är ännu inte tillgänglig.', { exact: true }).count(), 1);
          const securePay = card.getByRole('button', { name: 'Betala säkert', exact: true });
          assert(await securePay.isDisabled());
          const url = page.url();
          const storage = await page.evaluate(() => JSON.stringify([Object.entries(sessionStorage), Object.entries(localStorage)]));
          await card.locator('input').first().evaluate(input => input.focus());
          await page.keyboard.type('TEST-ONLY');
          await page.keyboard.press('Enter');
          // Even removing disabled in the DOM cannot create a submission handler.
          await securePay.evaluate(button => { button.disabled = false; button.click(); button.disabled = true; });
          await page.waitForTimeout(1000);
          assert.equal(page.url(), url);
          assert(await card.locator('input').evaluateAll(inputs => inputs.every(input => input.value === '')));
          assert.equal(await page.evaluate(() => JSON.stringify([Object.entries(sessionStorage), Object.entries(localStorage)])), storage);
          assert.equal(await page.locator('.demo-receipt').count(), 0);
          await card.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
        } else {
          assert(await pay.isEnabled());
          assert.match(await page.locator('.demo-payment-preview').innerText(), /Demo/);
          assert(await page.locator('.checkout-demo-status').evaluate(notice => Boolean(notice.nextElementSibling?.matches('button.demo-primary'))));
        }
        assert.deepEqual(await page.locator('.demo-summary-panel .demo-total').allTextContents(), beforeTotals);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: no horizontal overflow`);
        assert(await page.locator('.demo-payment-option').evaluateAll(rows => rows.every(row => row.scrollWidth <= row.clientWidth)), `${width}: payment rows fit`);
      }
      if (process.env.SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `${engine}-${width}.png`), fullPage: true });
      }
      await page.getByRole('radio', { name: 'Swish', exact: true }).check();
      await pay.click();
      await page.locator('.payment-demo-receipt').waitFor();
      assert.match(await page.locator('.payment-demo-receipt').innerText(), /Hämta själv/);
      assert.equal((await page.locator('.payment-demo-grand-total dd').innerText()).replace(/[^0-9]/g, ''), '25');
      assert.equal(new URL(page.url()).pathname, '/demo/checkout');
      assert.equal(await page.locator('header .cart-count').innerText(), '1');
      assert.deepEqual(writes, [], 'No order or payment requests');
      assert.deepEqual(errors, []);
      console.log(`${engine} ${width}px: disabled card UI, no credentials/storage/requests/submission, unchanged totals and Swish demo receipt PASS`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
