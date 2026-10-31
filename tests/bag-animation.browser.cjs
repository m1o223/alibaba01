const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const cartKey = 'alibaba.preview.demo-cart.v2';
const productUrl = key => base + '/menu/product/' + encodeURIComponent('demo:' + key) + '?orderType=takeaway';
const count = page => page.locator('header .cart-count');
const submit = page => page.getByRole('button', { name: 'Lägg i påsen', exact: true });
async function settled(page, expected) {
  await page.waitForFunction(value => document.querySelector('header .cart-count')?.textContent === String(value) && !document.querySelector('.bag-flight'), expected);
}
async function record(page) {
  await page.evaluate(() => {
    window.bagSamples = [];
    window.bagRecordingDone = false;
    const started = performance.now();
    const tick = () => {
      const circle = document.querySelector('.bag-flight');
      const icon = document.querySelector('header .cart-button img');
      const header = document.querySelector('header').getBoundingClientRect();
      const target = icon.getBoundingClientRect();
      const box = circle?.getBoundingClientRect();
      const stored = JSON.parse(sessionStorage.getItem('alibaba.preview.demo-cart.v2') || '[]');
      window.bagSamples.push({
        t: performance.now() - started, count: Number(document.querySelector('header .cart-count').textContent),
        actual: stored.reduce((sum, line) => sum + line.quantity, 0),
        confirmed: Boolean(document.querySelector('.bag-add-button[data-confirmed]')),
        width: box?.width, x: box ? box.x + box.width / 2 : null, y: box ? box.y + box.height / 2 : null,
        distance: box ? Math.hypot(box.x + box.width / 2 - target.x - target.width / 2, box.y + box.height / 2 - target.y - target.height / 2) : null,
        opacity: circle ? Number(getComputedStyle(circle).opacity) : null,
        pointerEvents: circle ? getComputedStyle(circle).pointerEvents : null,
        headerTop: header.top, headerHeight: header.height, iconWidth: target.width, scroll: scrollY,
      });
      if (performance.now() - started < 1250) requestAnimationFrame(tick);
      else window.bagRecordingDone = true;
    };
    requestAnimationFrame(tick);
    document.querySelector('.demo-purchase button[type="submit"]').click();
  });
}

(async () => {
  const safari = process.env.TEST_BROWSER === 'webkit';
  const browser = await (safari ? webkit : chromium).launch(safari ? {} : { executablePath: process.env.BROWSER_EXECUTABLE });
  const errors = [], writes = [];
  async function newPage(width = 390, reducedMotion = 'no-preference') {
    const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
    await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
    return page;
  }
  try {
    for (const width of [307, 375, 390, 768, 1440]) {
      const page = await newPage(width);
      await page.goto(productUrl('chicken-shawarma:plate'));
      await submit(page).waitFor();
      assert.ok(await submit(page).isDisabled());
      assert.equal(await page.locator('.bag-flight').count(), 0);
      await page.getByRole('radio', { name: /^Ris/ }).check();
      await page.getByRole('radio', { name: /^Coca-Cola \+/ }).check();
      await page.getByRole('checkbox', { name: /^Extra vitl/ }).check();
      await page.locator('.demo-ingredient-exclusions input[value="garlic"]').check();
      await page.locator('.demo-ingredient-exclusions input[value="pickles"]').check();
      await page.getByRole('button', { name: 'Öka antal', exact: true }).click();
      await submit(page).scrollIntoViewIfNeeded();
      const initial = await page.evaluate(() => ({ scroll: scrollY, height: document.querySelector('header').getBoundingClientRect().height }));
      assert.ok(initial.scroll > 100, 'Long product page is scrolled');
      const url = page.url();
      await record(page);
      if (process.env.TEST_SCREENSHOTS) {
        await page.waitForTimeout(400);
        fs.mkdirSync(process.env.TEST_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.TEST_SCREENSHOTS, `bag-flight-${safari ? 'webkit' : 'chromium'}-${width}.png`) });
      }
      await page.waitForFunction(() => window.bagRecordingDone);
      const samples = await page.evaluate(() => window.bagSamples);
      assert.ok(samples.some(s => s.confirmed), 'Brief checkmark');
      assert.ok(samples.some(s => s.actual === 2 && s.count === 0 && s.t < 700), 'Actual state updates before the visible counter');
      assert.ok(samples.some(s => s.opacity === 1 && Math.abs(s.width - 48) < 0.1 && s.pointerEvents === 'none'));
      assert.ok(samples.some(s => s.count === 2 && s.distance < 1 && s.opacity > 0 && s.opacity < 1), 'Counter changes at arrival while the circle shrinks at the icon center');
      assert.ok(samples.some(s => s.iconWidth > 26.5), 'Only the bag bounces');
      assert.ok(samples.every(s => Math.abs(s.headerTop) < 1 && s.headerHeight === initial.height));
      assert.ok(samples.every(s => Math.abs(s.scroll - initial.scroll) < 2), 'No automatic scrolling');
      const arrival = samples.find(s => s.count === 2);
      assert.ok(arrival.t >= 780 && arrival.t < 1100, 'Arrival timing');
      await settled(page, 2);
      assert.equal(page.url(), url);
      assert.equal(await page.locator('#cart-drawer').getAttribute('aria-hidden'), 'true');
      const lines = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), cartKey);
      assert.equal(lines[0].quantity, 2);
      assert.deepEqual([...lines[0].selections.exclusions].sort(), ['garlic', 'pickles']);
      assert.match(await page.locator('.demo-purchase .demo-total strong').innerText(), /^350\s+kr$/);
      await page.evaluate(() => {
        window.bagCounts = [Number(document.querySelector('header .cart-count').textContent)];
        window.bagCounterObserver = new MutationObserver(() => window.bagCounts.push(Number(document.querySelector('header .cart-count').textContent)));
        window.bagCounterObserver.observe(document.querySelector('header .cart-count'), { childList: true, characterData: true, subtree: true });
      });
      await page.getByRole('button', { name: 'Minska antal', exact: true }).click();
      await submit(page).click();
      await page.getByRole('button', { name: 'Öka antal', exact: true }).click();
      await submit(page).click();
      assert.equal(await page.locator('.bag-flight').count(), 2, 'Repeated additions have independent flights');
      await settled(page, 5);
      assert.deepEqual(await page.evaluate(() => { window.bagCounterObserver.disconnect(); return window.bagCounts; }), [2, 3, 5]);
      assert.equal(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key))[0].quantity, cartKey), 5);
      await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
      assert.match(await page.locator('#cart-drawer').innerText(), /Utan pickles/);
      assert.match(await page.locator('#cart-drawer').innerText(), /875\s+kr/);
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      console.log(`${safari ? 'WebKit' : 'Chromium'} ${width}px: sticky header, curved flight, arrival, bounce, count, quantity and customizations PASS`);
      await page.close();
    }

    const failure = await newPage();
    await failure.goto(productUrl('drinks:water'));
    for (let i = 1; i < 20; i++) await failure.getByRole('button', { name: 'Öka antal', exact: true }).click();
    await submit(failure).click();
    await submit(failure).click();
    assert.equal(await failure.locator('.bag-flight').count(), 1, 'Rejected repeat must not create another flight');
    assert.equal(await failure.locator('.bag-add-button[data-confirmed]').count(), 0);
    await settled(failure, 20);
    await submit(failure).click();
    assert.equal(await failure.locator('.bag-flight, .bag-add-button[data-confirmed]').count(), 0);
    assert.match(await failure.locator('.demo-feedback').innerText(), /Högst 20/);
    assert.equal(await count(failure).innerText(), '20');
    await failure.close();

    const reduced = await newPage(390, 'reduce');
    await reduced.goto(productUrl('drinks:water'));
    await submit(reduced).click();
    assert.equal(await reduced.locator('.bag-flight').count(), 0);
    assert.equal(await count(reduced).innerText(), '1');
    assert.equal(await reduced.locator('header .cart-button img').evaluate(el => el.getAnimations().length), 0);
    await reduced.close();

    const motionChange = await newPage();
    await motionChange.goto(productUrl('drinks:water'));
    await submit(motionChange).click();
    await motionChange.emulateMedia({ reducedMotion: 'reduce' });
    await settled(motionChange, 1);
    await motionChange.close();

    const interrupted = await newPage();
    await interrupted.goto(productUrl('drinks:water'));
    await submit(interrupted).click();
    await interrupted.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
    await settled(interrupted, 1);
    await interrupted.keyboard.press('Escape');
    await submit(interrupted).click();
    await interrupted.getByRole('button', { name: 'Tillbaka till menyn', exact: true }).click();
    await settled(interrupted, 2);
    await interrupted.goto(base + '/menu?q=vatten');
    await interrupted.getByRole('button', { name: 'Lägg i påsen: Vatten', exact: true }).click();
    await settled(interrupted, 3);
    await interrupted.close();

    const resized = await newPage();
    await resized.goto(productUrl('drinks:water'));
    await submit(resized).scrollIntoViewIfNeeded();
    await record(resized);
    await resized.setViewportSize({ width: 768, height: 844 });
    await resized.waitForFunction(() => window.bagRecordingDone);
    assert.ok(await resized.evaluate(() => window.bagSamples.some(s => s.count === 1 && s.distance < 1 && s.opacity > 0 && s.opacity < 1)), 'Flight tracks resized target');
    await settled(resized, 1);
    await resized.close();

    const shared = await newPage();
    for (const route of ['/', '/menu', '/about', '/contact']) {
      await shared.goto(base + route);
      await shared.locator('header').waitFor();
      assert.equal(await shared.locator('header').count(), 1);
      await shared.evaluate(() => scrollTo(0, document.body.scrollHeight));
      const geometry = await shared.locator('header').evaluate(el => ({ top: el.getBoundingClientRect().top, height: el.getBoundingClientRect().height, color: getComputedStyle(el).backgroundColor }));
      assert.deepEqual(geometry, { top: 0, height: 56, color: 'rgb(41, 24, 15)' });
      await shared.getByRole('button', { name: 'Öppna meny', exact: true }).click();
      assert.equal(await shared.locator('#site-menu').getAttribute('aria-hidden'), 'false');
      await shared.keyboard.press('Escape');
    }
    await shared.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
    console.log('Failure, reduced motion, interruption cleanup, search quick-add, resize and shared navigation PASS');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
