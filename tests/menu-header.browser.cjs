const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const preview = process.env.TEST_BUILD_MODE !== 'production';
const safari = process.env.TEST_BROWSER === 'webkit';

(async () => {
  const browser = await (safari ? webkit : chromium).launch(safari ? {} : { executablePath: process.env.BROWSER_EXECUTABLE });
  const errors = [], writes = [];
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
      await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
      await page.goto(base + '/menu?orderType=takeaway');
      await page.locator('.menu-category-card').first().waitFor();
      const search = page.getByRole('searchbox', { name: 'Sök efter mat', exact: true });
      assert.equal(await search.getAttribute('placeholder'), 'Sök efter mat…');
      assert.equal(await page.locator('#menu-page-title').innerText(), 'Vår meny');
      assert.equal(await page.getByText('Upptäck våra rätter, tillagade med omsorg.', { exact: true }).count(), 0);
      assert.equal(await page.locator('.demo-menu-notice').count(), 0);
      assert.equal(await page.locator('.menu-search-status:visible').count(), 0);
      assert.equal(await page.locator('.menu-category-card').count(), preview ? 14 : 15);
      const geometry = await page.evaluate(() => {
        const title = document.querySelector('#menu-page-title').getBoundingClientRect();
        const search = document.querySelector('.menu-search').getBoundingClientRect();
        const grid = document.querySelector('.menu-categories');
        return { titleGap: search.top - title.bottom, gridGap: grid.getBoundingClientRect().top - search.bottom,
          columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.equal(geometry.titleGap, 24);
      assert.equal(geometry.gridGap, 16);
      assert.equal(geometry.columns, width < 640 ? 2 : width < 960 ? 3 : 4);
      assert.equal(geometry.overflow, false);
      if (process.env.TEST_SCREENSHOTS) {
        fs.mkdirSync(process.env.TEST_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.TEST_SCREENSHOTS, `menu-header-${width}.png`), fullPage: true });
      }
      await search.fill('pizza');
      assert.equal(await page.locator(preview ? '.demo-product-card' : '.menu-category-card').count(), preview ? 11 : 1);
      await search.fill('xyz-no-match');
      await page.getByText(preview ? 'Inga produkter hittades' : 'Inga kategorier matchar din sökning.', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Rensa sökning', exact: true }).click();
      assert.equal(await page.locator('.menu-category-card').count(), preview ? 14 : 15);
      if (preview) {
        await page.locator('a[href="#drinks"]').click();
        const categorySearch = page.getByRole('searchbox', { name: 'Sök i denna kategori', exact: true });
        await categorySearch.fill('PEPSI');
        assert.equal(await page.locator('.demo-product-card').count(), 2);
        await page.getByRole('button', { name: 'Rensa kategorisökning', exact: true }).click();
        assert.equal(await page.locator('.demo-product-card').count(), 11);
        await page.getByRole('button', { name: 'Lägg i påsen: Pepsi', exact: true }).click();
        await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
        assert.equal(await page.locator('header .cart-count').innerText(), '1');
        assert.match(await page.locator('#cart-drawer').innerText(), /Pepsi/);
        assert.equal(new URL(page.url()).searchParams.get('orderType'), 'takeaway');
      }
      console.log(`${preview ? 'Preview' : 'Production build'} menu ${width}px: minimal heading, spacing, categories, search and navigation PASS`);
      await page.close();
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
