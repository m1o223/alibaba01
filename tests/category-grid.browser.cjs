const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const categories = JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', 'import {demoCategories} from "./src/demo/menuData.ts"; console.log(JSON.stringify(demoCategories));'], { encoding: 'utf8' }));
const money = value => Number(value.replace(/[^0-9]/g, ''));

(async () => {
  const safari = process.env.TEST_BROWSER === 'webkit';
  const browser = await (safari ? webkit : chromium).launch(safari ? {} : { executablePath: process.env.BROWSER_EXECUTABLE });
  const errors = [], writes = [];
  try {
    for (const width of [307, 375, 390, 430, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
      await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
      await page.goto(base + '/menu?orderType=takeaway', { waitUntil: 'domcontentloaded' });
      await page.locator('.menu-category-card').first().waitFor();
      assert.equal(await page.locator('.menu-category-card').count(), categories.length);
      let checked = 0;
      for (const category of categories) {
        await page.goto(base + '/menu?orderType=takeaway#' + category.slug, { waitUntil: 'domcontentloaded' });
        await page.locator(`.demo-category-view h2[id="${category.slug}"]`).waitFor();
        await page.locator('.category-product-card').first().waitFor();
        const cards = page.locator('.category-product-card');
        assert.deepEqual(await cards.evaluateAll(items => items.map(item => item.dataset.productKey)), category.products.map(product => product.key));
        assert.deepEqual(await cards.locator('h3').allTextContents(), category.products.map(product => product.name));
        assert.deepEqual((await cards.locator('strong').allTextContents()).map(money), category.products.map(product => product.priceOre / 100));
        assert.equal(await cards.locator('button, .demo-product-description, .demo-product-category').count(), 0);
        assert.equal(await page.locator('.demo-category-view .demo-product-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), width < 640 ? 2 : width < 960 ? 3 : 4);
        await page.waitForFunction(() => [...document.querySelectorAll('.category-product-media img')].every(image => image.complete && image.naturalWidth > 0));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.equal(await cards.evaluateAll(items => items.every(item => {
          const name = item.querySelector('h3'), price = item.querySelector('strong'), media = item.querySelector('.category-product-media'), link = item.querySelector('a');
          const n = name.getBoundingClientRect(), p = price.getBoundingClientRect(), m = media.getBoundingClientRect(), box = item.getBoundingClientRect(), a = link.getBoundingClientRect();
          return name.scrollWidth <= name.clientWidth + 1 && n.bottom <= p.top && m.bottom <= n.top && p.bottom <= box.bottom && a.height >= box.height - 2 && Math.abs(m.width / m.height - 4 / 3) < .01;
        })), true, category.slug + ' readable card geometry');
        if (process.env.TEST_SCREENSHOTS && ['chicken-shawarma', 'offers', 'drinks'].includes(category.slug)) {
          fs.mkdirSync(process.env.TEST_SCREENSHOTS, { recursive: true });
          await page.locator('.demo-category-view').screenshot({ path: path.join(process.env.TEST_SCREENSHOTS, `${category.slug}-${width}.png`) });
        }
        const search = page.getByRole('searchbox', { name: 'S\u00f6k i denna kategori', exact: true });
        await search.fill('xyz-no-results');
        await page.getByText('Inga produkter hittades', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Rensa kategoris\u00f6kning', exact: true }).click();
        const products = width === 390 ? category.products : [category.products[0]];
        for (const [index, product] of products.entries()) {
          const card = page.locator(`[data-product-key="${product.key}"]`);
          await card.scrollIntoViewIfNeeded();
          const scroll = await page.evaluate(() => scrollY);
          const target = ['.category-product-media', 'h3', 'strong', 'a'][index % 4];
          await card.locator(target).click();
          await page.locator('.demo-product-page').waitFor();
          assert.equal(decodeURIComponent(new URL(page.url()).pathname.split('/').at(-1)), product.key);
          assert.equal(await page.locator('.demo-product-content h1').innerText(), product.name);
          assert.equal(money(await page.locator('.demo-base-price').innerText()), product.priceOre / 100);
          assert.equal(await page.locator('.demo-option-group').count(), product.customizationGroups.length);
          assert.equal(await page.getByRole('button', { name: 'L\u00e4gg i p\u00e5sen', exact: true }).isDisabled(), product.customizationGroups.some(group => group.required));
          assert.equal(new URL(page.url()).searchParams.get('orderType'), 'takeaway');
          await page.getByRole('button', { name: 'Tillbaka till menyn', exact: true }).click();
          await page.locator('.category-product-card').first().waitFor();
          await page.waitForTimeout(200);
          assert.equal(new URL(page.url()).hash, '#' + category.slug);
          assert.ok(Math.abs(await page.evaluate(() => scrollY) - scroll) < 3, 'Category scroll restoration');
        }
        checked += category.products.length;
      }
      assert.equal(checked, 84);
      await page.goto(base + '/menu?q=shawarma', { waitUntil: 'domcontentloaded' });
      await page.locator('.demo-product-card').first().waitFor();
      assert.equal(await page.locator('.demo-product-card').count(), 13);
      assert.equal(await page.locator('.category-product-card').count(), 0, 'Global search presentation unchanged');
      assert.equal(await page.locator('.demo-product-actions button').count(), 13);
      console.log(`${safari ? 'WebKit' : 'Chromium'} ${width}px: all 14 categories / 84 prices, grid, images, search, detail navigation and scroll PASS`);
      await page.close();
    }
    const ordering = await browser.newPage({ viewport: { width: 390, height: 900 } });
    ordering.on('pageerror', error => errors.push(error.message));
    ordering.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
    await ordering.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
    let subtotal = 0;
    for (const key of ['demo:offers:family-menu', 'demo:pizza:margherita', 'demo:meat-shawarma:plate', 'demo:falafel:wrap']) {
      const product = categories.flatMap(category => category.products).find(product => product.key === key);
      await ordering.goto(base + '/menu?orderType=dine-in#' + product.categorySlug, { waitUntil: 'domcontentloaded' });
      await ordering.locator(`.demo-category-view h2[id="${product.categorySlug}"]`).waitFor();
      await ordering.getByRole('link', { name: 'Visa ' + product.name, exact: true }).click();
      await ordering.locator('.demo-product-page').waitFor();
      let unit = product.priceOre;
      for (const [index, group] of product.customizationGroups.entries()) {
        const field = ordering.locator('.demo-option-group').nth(index);
        const input = group.required || group.type === 'multiple' ? field.locator('input').first() : field.locator('input').nth(1);
        await input.check();
        unit += group.options[0].priceOre;
      }
      await ordering.getByRole('button', { name: '\u00d6ka antal', exact: true }).click();
      assert.equal(money(await ordering.locator('.demo-purchase .demo-total strong').innerText()), unit * 2 / 100);
      await ordering.getByRole('button', { name: 'L\u00e4gg i p\u00e5sen', exact: true }).click();
      subtotal += unit * 2;
      await ordering.getByRole('button', { name: '\u00d6ppna varukorg', exact: true }).click();
      const bag = ordering.locator('#cart-drawer');
      assert.equal(money(await bag.locator('.cart-drawer-summary strong').last().innerText()), subtotal / 100);
      await bag.getByRole('button', { name: '\u00d6ka antal ' + product.name, exact: true }).click();
      assert.equal(money(await bag.locator('.cart-drawer-summary strong').last().innerText()), (subtotal + unit) / 100);
      await bag.getByRole('button', { name: 'Minska antal ' + product.name, exact: true }).click();
      assert.equal(money(await bag.locator('.cart-drawer-summary strong').last().innerText()), subtotal / 100);
      await ordering.keyboard.press('Escape');
    }
    await ordering.getByRole('button', { name: '\u00d6ppna varukorg', exact: true }).click();
    const remove = ordering.locator('#cart-drawer').getByRole('button', { name: /^Ta bort / });
    while (await remove.count()) await remove.first().click();
    assert.equal(await ordering.locator('header .cart-count').innerText(), '0');
    assert.ok(await ordering.getByRole('button', { name: 'Till kassan', exact: true }).isDisabled());
    await ordering.close();
    console.log('Offer, pizza, meat plate and falafel: customization, quantity, subtotal and removal PASS');
    const fallback = await browser.newPage();
    await fallback.route('**/assets/hero-*.webp', route => route.abort());
    await fallback.goto(base + '/menu#chicken-shawarma', { waitUntil: 'domcontentloaded' });
    await fallback.locator('.category-product-media > span').first().waitFor();
    await fallback.waitForFunction(() => document.querySelectorAll('.category-product-media img').length === 0);
    assert.equal(await fallback.locator('.category-product-media > span').count(), categories.find(category => category.slug === 'chicken-shawarma').products.length);
    await fallback.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
