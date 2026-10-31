const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const artifacts = process.env.TEST_SCREENSHOTS;
const baseline = process.env.HOME_BASELINE === '1';
const safari = process.env.TEST_BROWSER === 'webkit';

(async () => {
  const browser = await (safari ? webkit : chromium).launch(safari ? {} : { executablePath: process.env.BROWSER_EXECUTABLE });
  const errors = [];
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
      await page.goto(base);
      await page.locator('.home-order-primary').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => ['.app-header', '.home-logo', '.home-restaurant-name', '.home-description', '.home-order-actions', '.home-info'].map(selector => {
        const el = document.querySelector(selector), rect = el.getBoundingClientRect(), css = getComputedStyle(el);
        return { selector, x: rect.x, y: rect.y, width: rect.width, height: rect.height, color: css.color, background: css.backgroundColor };
      }));
      if (artifacts && !safari) {
        fs.mkdirSync(artifacts, { recursive: true });
        const file = path.join(artifacts, `home-layout-${width}.json`);
        if (baseline) fs.writeFileSync(file, JSON.stringify(layout));
        else assert.deepEqual(layout, JSON.parse(fs.readFileSync(file)), 'Unrelated homepage layout and colors must not change');
      }
      if (baseline) { await page.close(); continue; }
      assert.equal(await page.locator('.home-order-actions button').count(), 1);
      const button = page.getByRole('button', { name: 'Se menyn & beställ', exact: true });
      assert.equal(await page.getByRole('button', { name: /^(Äta här|Ta med)$/ }).count(), 0);
      const box = await button.boundingBox();
      assert(Math.abs(box.x + box.width / 2 - width / 2) < 1);
      assert.equal(await button.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(41, 24, 15)');
      assert.equal(await button.evaluate(el => getComputedStyle(el).borderRadius), '6px');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (artifacts) await page.screenshot({ path: path.join(artifacts, `home-button-${width}.png`), fullPage: true });
      await button.click();
      await page.waitForURL(base + '/menu');
      await page.locator('.menu-category-card').first().waitFor();
      assert.equal(await page.evaluate(() => sessionStorage.getItem('alibaba.orderType')), null);
      await page.locator('a[href="#drinks"]').click();
      await page.getByRole('button', { name: 'Lägg i påsen: Coca-Cola', exact: true }).click();
      await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
      assert.equal(await page.locator('header .cart-count').innerText(), '1');
      await page.getByRole('button', { name: 'Stäng varukorg', exact: true }).click();
      await page.goto(base);
      await page.locator('.home-order-primary').waitFor();
      await page.evaluate(() => sessionStorage.setItem('alibaba.orderType', 'takeaway'));
      await page.getByRole('button', { name: 'Se menyn & beställ', exact: true }).click();
      await page.waitForURL(base + '/menu');
      assert.equal(await page.evaluate(() => sessionStorage.getItem('alibaba.orderType')), 'takeaway');
      assert.equal(await page.locator('header .cart-count').innerText(), '1');
      console.log(`Homepage ${width}px: single centered button, menu navigation, preserved cart and order choice PASS`);
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
