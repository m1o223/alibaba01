const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { openLegacyOrder } = require('./legacy-order-fixture.cjs');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const money = text => Number(text.replace(/[^0-9]/g, ''));

(async () => {
  const safari = process.env.TEST_BROWSER === 'webkit';
  const browser = await (safari ? webkit : chromium).launch(safari ? {} : { executablePath: process.env.BROWSER_EXECUTABLE });
  const errors = [], writes = [];
  try {
    for (const width of [307, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
      await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
      await page.goto(base + '/menu/product/' + encodeURIComponent('demo:chicken-shawarma:plate') + '?orderType=takeaway');
      const exclusions = page.locator('.demo-ingredient-exclusions');
      await exclusions.waitFor();
      assert.equal(await exclusions.locator('input:checked').count(), 0);
      assert.equal(await page.locator('.demo-product-page .demo-notice').count(), 0);
      await page.getByText('Ingredienser och allergener \u00e4r \u00e4nnu inte bekr\u00e4ftade. Kontakta restaurangen vid allergi.', { exact: true }).waitFor();
      await page.getByText('Att ta bort en ingrediens garanterar inte allergenfri mat.', { exact: true }).waitFor();
      const garlic = exclusions.locator('input[value="garlic"]'), pickles = exclusions.locator('input[value="pickles"]');
      const total = page.locator('.demo-purchase .demo-total strong');
      await garlic.check();
      assert.equal(money(await total.innerText()), 145);
      assert.ok(await page.getByRole('button', { name: 'L\u00e4gg i p\u00e5sen', exact: true }).isDisabled());
      await pickles.check();
      await garlic.uncheck();
      assert.equal(await exclusions.locator('input:checked').count(), 1);
      assert.equal(money(await total.innerText()), 145);
      await garlic.check();
      await page.getByRole('radio', { name: /^Ris/ }).check();
      await page.getByRole('radio', { name: /^Coca-Cola \+/ }).check();
      await page.getByRole('checkbox', { name: /^Extra vitl/ }).check();
      assert.equal(money(await total.innerText()), 175);
      if (process.env.TEST_SCREENSHOTS) {
        fs.mkdirSync(process.env.TEST_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.TEST_SCREENSHOTS, `exclusions-product-${width}.png`), fullPage: true });
      }
      await page.locator('.demo-purchase button[type="submit"]').click();
      await garlic.uncheck(); await pickles.uncheck();
      await exclusions.locator('input[value="onion"]').check();
      await exclusions.locator('input[value="tomato"]').check();
      await page.getByRole('button', { name: '\u00d6ka antal', exact: true }).click();
      assert.equal(money(await total.innerText()), 350);
      await page.locator('.demo-purchase button[type="submit"]').click();
      await page.reload();
      await page.getByRole('button', { name: '\u00d6ppna varukorg', exact: true }).click();
      const bag = page.locator('#cart-drawer');
      assert.equal(await bag.locator('li').count(), 2);
      assert.equal(await page.locator('header .cart-count').innerText(), '3');
      assert.match(await bag.locator('li').nth(0).innerText(), /Utan pickles/);
      assert.match(await bag.locator('li').nth(1).innerText(), /Utan tomat/);
      assert.equal(money(await bag.locator('.cart-drawer-summary strong').last().innerText()), 525);
      await bag.getByRole('button', { name: 'Till kassan', exact: true }).click();
      await page.getByRole('button', { name: 'Forts\u00e4tt i demol\u00e4ge', exact: true }).click();
      await page.locator('.demo-checkout').waitFor();
      assert.match(await page.locator('.demo-order-lines').innerText(), /Utan pickles/);
      assert.match(await page.locator('.demo-order-lines').innerText(), /Utan tomat/);
      await page.getByRole('radio', { name: 'Swish', exact: true }).check();
      await page.getByRole('button', { name: 'Simulera betalning', exact: true }).click();
      await page.locator('.payment-demo-receipt').waitFor();
      assert.match(await page.locator('.payment-demo-receipt').innerText(), /Utan pickles/);
      assert.match(await page.locator('.payment-demo-receipt').innerText(), /Utan tomat/);
      assert.equal(money(await page.locator('.payment-demo-grand-total dd').innerText()), 525);
      assert.equal(await page.locator('header .cart-count').innerText(), '3');
      await page.getByRole('button', { name: 'Stäng', exact: true }).click();
      await openLegacyOrder(page, base, 'swish', 'takeaway');
      const order = await page.evaluate(() => JSON.parse(sessionStorage.getItem('alibaba.preview.demo-order.v1')));
      assert.equal(order.demoOnly, true);
      assert.equal(order.totalOre, 52500);
      assert.deepEqual(order.lines.map(line => [...line.selections.exclusions].sort()), [['garlic', 'pickles'], ['onion', 'tomato']]);
      assert.deepEqual(order.lines.map(line => line.exclusions.map(option => option.key)), [['garlic', 'pickles'], ['onion', 'tomato']]);
      await page.reload();
      await page.locator('.demo-restaurant-preview summary').click();
      const restaurant = page.locator('.demo-restaurant-preview');
      assert.match(await restaurant.innerText(), /Utan pickles/);
      assert.match(await restaurant.innerText(), /Utan tomat/);
      assert.equal(await restaurant.locator('li').count(), 2);
      assert.equal(money(await page.locator('.demo-receipt .demo-total strong').innerText()), 525);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (process.env.TEST_SCREENSHOTS) await restaurant.screenshot({ path: path.join(process.env.TEST_SCREENSHOTS, `exclusions-restaurant-${width}.png`) });
      for (const key of ['demo:drinks:water', 'demo:sauces:garlic', 'demo:pizza:margherita']) {
        await page.goto(base + '/menu/product/' + encodeURIComponent(key));
        await page.locator('.demo-product-page').waitFor();
        assert.equal(await page.locator('.demo-ingredient-exclusions').count(), 0);
      }
      for (const key of ['demo:meat-shawarma:wrap', 'demo:falafel:wrap', 'demo:kebab:plate', 'demo:pizza:kebab']) {
        await page.goto(base + '/menu/product/' + encodeURIComponent(key));
        await page.locator('.demo-ingredient-exclusions').waitFor();
        assert.equal(await page.locator('.demo-ingredient-exclusions input:checked').count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      console.log(`${safari ? 'WebKit' : 'Chromium'} ${width}px: exclusions, pricing, separate portions, reload, checkout, restaurant preview and applicability PASS`);
      await page.close();
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
