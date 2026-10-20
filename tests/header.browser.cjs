const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const artifacts = process.env.TEST_SCREENSHOTS;
const baseline = process.env.HEADER_BASELINE === '1';
const safari = process.env.TEST_BROWSER === 'webkit';

async function signature(page) {
  return page.locator('header[aria-label="Sidhuvud"]').evaluate(header => {
    const style = getComputedStyle(header);
    const rect = header.getBoundingClientRect();
    const buttons = [...header.querySelectorAll('button')].map(button => {
      const css = getComputedStyle(button);
      const box = button.getBoundingClientRect();
      return { x: Math.round(box.x * 10) / 10, width: box.width, height: box.height, color: css.color, background: css.backgroundColor, padding: css.padding, border: css.borderWidth };
    });
    return { background: style.backgroundColor, color: style.color, height: rect.height, width: rect.width, padding: style.padding, border: style.borderWidth, buttons };
  });
}

async function check(page, expected) {
  await page.locator('header[aria-label="Sidhuvud"]').waitFor();
  assert.deepEqual(await signature(page), expected, `Header differs on ${page.url()}`);
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), '#29180F');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const brand = page.locator('header .brand-mark');
  if (await brand.count()) {
    const box = await brand.boundingBox();
    assert(Math.abs(box.x + box.width / 2 - expected.width / 2) < 1, 'Brand stays centered');
    assert.equal(await brand.evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
  }
}

async function screenshot(page, name, headerOnly = false) {
  if (!artifacts) return;
  fs.mkdirSync(artifacts, { recursive: true });
  const filename = path.join(artifacts, name + '.png');
  const target = headerOnly ? page.locator('header[aria-label="Sidhuvud"]') : page;
  const buffer = await target.screenshot(headerOnly ? {} : { fullPage: true });
  if (headerOnly && !baseline && !safari) assert(buffer.equals(fs.readFileSync(filename)), 'Homepage header pixels must remain unchanged');
  else fs.writeFileSync(filename, buffer);
}

(async () => {
  const browser = await (safari ? webkit : chromium).launch(safari ? { headless: true } : { executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  const errors = [], writes = [];
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 600, hasTouch: width < 600 });
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
      await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
      await page.goto(base);
      await page.getByRole('button', { name: 'Äta här', exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      const expected = await signature(page);
      await screenshot(page, `header-home-${width}`, true);
      if (baseline) { await page.close(); continue; }
      assert.equal(expected.background, 'rgb(41, 24, 15)');
      assert.equal(expected.height, 56);
      await check(page, expected);
      for (const route of ['/about', '/contact', '/cart', '/menu']) {
        await page.goto(base + route);
        await check(page, expected);
        if (width === 390 || width === 1440) await screenshot(page, `header-${route.slice(1)}-${width}`);
      }
      await page.getByRole('button', { name: 'Öppna meny', exact: true }).click();
      await page.getByRole('navigation', { name: 'Huvudmeny', exact: true }).getByRole('button', { name: 'Logga in', exact: true }).click();
      await page.waitForTimeout(330);
      await check(page, expected);
      assert.equal(await page.locator('.app-header').getAttribute('inert'), '');
      await page.getByRole('tab', { name: 'Skapa konto', exact: true }).click();
      await check(page, expected);
      await page.getByRole('button', { name: 'Stäng inloggning', exact: true }).click();
      await page.waitForTimeout(330);

      await page.locator('a[href="#drinks"]').click();
      await page.getByRole('link', { name: 'Visa Coca-Cola', exact: true }).click();
      await page.locator('.demo-product-page').waitFor();
      await check(page, expected);
      await page.getByRole('button', { name: 'Tillbaka till menyn', exact: true }).click();
      await page.locator('.demo-product-card').first().waitFor();
      await check(page, expected);
      await page.getByRole('link', { name: 'Visa Coca-Cola', exact: true }).click();
      await page.getByRole('button', { name: 'Lägg i påsen', exact: true }).click();
      assert.equal(await page.locator('header .cart-count').innerText(), '1');
      await check(page, expected);
      if (width === 390 || width === 1440) await screenshot(page, `header-product-${width}`);
      await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
      await page.getByRole('button', { name: 'Öka antal Coca-Cola', exact: true }).click();
      assert.equal(await page.locator('header .cart-count').innerText(), '2');
      await check(page, expected);
      await page.getByRole('button', { name: 'Till kassan', exact: true }).click();
      await page.getByRole('button', { name: 'Fortsätt i demoläge', exact: true }).click();
      await page.locator('.demo-checkout').waitFor();
      await check(page, expected);
      await page.getByRole('radio', { name: 'Ta med', exact: true }).check();
      if (width === 390 || width === 1440) await screenshot(page, `header-checkout-${width}`);
      await page.getByRole('radio', { name: 'Swish', exact: true }).check();
      await page.getByRole('button', { name: 'Simulera betalning', exact: true }).click();
      await page.locator('.demo-receipt').waitFor();
      await check(page, expected);
      assert.equal(await page.locator('header .cart-count').innerText(), '0');
      if (width === 390 || width === 1440) await screenshot(page, `header-receipt-${width}`);
      console.log(`Shared header ${width}px: all routes, unchanged home, navigation, auth, cart counter, checkout and receipt PASS`);
      await page.close();
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
