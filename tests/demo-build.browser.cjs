const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const preview = process.env.TEST_BUILD_MODE === 'preview';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
    await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
    await page.goto(base + '/menu?orderType=takeaway');
    await page.locator('.menu-category-card').first().waitFor();
    assert.equal(await page.locator('.menu-category-card').count(), preview ? 14 : 15);
    if (preview) {
      await page.locator('a[href="#drinks"]').click();
      await page.getByRole('button', { name: 'Lägg i påsen: Coca-Cola', exact: true }).click();
    } else assert.equal(await page.locator('.demo-menu').count(), 0);
    await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
    await page.waitForTimeout(350);
    if (preview) {
      await page.getByRole('button', { name: 'Till kassan', exact: true }).click();
      await page.waitForTimeout(350);
      await page.getByRole('button', { name: 'Fortsätt i demoläge', exact: true }).click();
      await page.getByRole('radio', { name: 'Swish', exact: true }).check();
      await page.getByRole('button', { name: 'Simulera betalning', exact: true }).click();
      await page.locator('.demo-receipt').waitFor();
      assert.match(await page.locator('.demo-receipt').innerText(), /Ta med/);
      assert.equal((await page.locator('.demo-receipt .demo-total strong').innerText()).replace(/[^0-9]/g, ''), '25');
      await page.reload();
      await page.locator('.demo-receipt').waitFor();
    } else {
      assert(await page.getByRole('button', { name: 'Till kassan', exact: true }).isDisabled());
      assert.equal(await page.getByRole('button', { name: 'Fortsätt i demoläge', includeHidden: true }).count(), 0);
      await page.goto(base + '/demo/checkout');
      assert.equal(await page.locator('.demo-checkout').count(), 0);
      await page.getByRole('button', { name: 'Äta här', exact: true }).waitFor();
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
    console.log((preview ? 'Preview build: full checkout/receipt smoke test' : 'Production build: original menu/cart, no demo authentication or checkout') + ' PASS');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
